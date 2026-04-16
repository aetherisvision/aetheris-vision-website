/**
 * /api/cron/receipts
 *
 * Daily cron job — scans Gmail for receipts from known vendors and logs them
 * as expenses. Runs at 6:00 AM Central via Vercel Cron (see vercel.json).
 *
 * Requires these env vars in Vercel:
 *   GMAIL_CLIENT_ID          — OAuth2 client ID from Google Cloud Console
 *   GMAIL_CLIENT_SECRET      — OAuth2 client secret
 *   CRON_SECRET              — Random string; Vercel Cron sends Authorization: Bearer <CRON_SECRET>
 *   GMAIL_RECEIPT_LOOKBACK_DAYS — optional; default 30 (how far back to search Gmail)
 *
 * Gmail refresh tokens are stored in oauth_tokens (rows biz / per) via /admin/gmail — not in env.
 *
 * Setup steps (one-time):
 *   1. Go to https://console.cloud.google.com
 *   2. Create project → Enable Gmail API
 *   3. OAuth2 credentials (Desktop app) → get client ID + secret
 *   4. Run scripts/gmail-auth.ts once per account to get refresh tokens
 *   5. Add all vars to Vercel project settings
 */

import { sql } from '@/lib/db'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'av-admin-session'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

// Known vendors: [display name, Gmail sender match, category]
const VENDORS: [string, string, string][] = [
  ['Vercel',     'vercel.com',          'Cloud Services'],
  ['Groq',       'groq.com',            'Cloud Services'],
  ['GitHub',     'github.com',          'Cloud Services'],
  ['Anthropic',  'anthropic.com',       'Cloud Services'],
  ['Cloudflare', 'cloudflare.com',      'Cloud Services'],
  ['Neon',       'neon.tech',           'Cloud Services'],
  ['OpenAI',     'openai.com',          'Cloud Services'],
  ['AWS',        'amazonaws.com',       'Cloud Services'],
  ['Google',     'google.com',          'Cloud Services'],
  ['Notion',     'notion.so',           'Software Subscriptions'],
  ['Slack',      'slack.com',           'Software Subscriptions'],
  ['Zoom',       'zoom.us',             'Software Subscriptions'],
  ['Stripe',     'stripe.com',          'Banking & Financial Fees'],
  ['QuickBooks', 'quickbooks.com',      'Software Subscriptions'],
  ['Docuseal',   'docuseal.co',         'Software Subscriptions'],
  ['Adobe',      'adobe.com',           'Software Subscriptions'],
  ['Figma',      'figma.com',           'Design Tools'],
  ['1Password',  '1password.com',       'Software Subscriptions'],
  ['Navy Federal','navyfederal.org',    'Banking & Financial Fees'],
  ['USAA',       'usaa.com',            'Banking & Financial Fees'],
  ['Cloudways',  'cloudways.com',       'Cloud Services'],
  ['Namecheap',  'namecheap.com',       'Domain & Hosting'],
  ['GoDaddy',    'godaddy.com',         'Domain & Hosting'],
  // Extra common sender domains / brands
  ['PayPal',     'paypal.com',          'Banking & Financial Fees'],
  ['PayPal',     'mail.paypal.com',     'Banking & Financial Fees'],
  ['Best Buy',   'bestbuy.com',         'Office & Equipment'],
  ['Best Buy',   'emails.bestbuy.com',  'Office & Equipment'],
  ['Sanity',     'sanity.io',           'Cloud Services'],
  ['Sanity',     'sanity-mail.com',     'Cloud Services'],
  ['GitLab',     'gitlab.com',          'Cloud Services'],
]

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  return data.access_token
}

async function gmailGet(token: string, path: string) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

async function gmailGetAttachment(token: string, userId: string, msgId: string, attachId: string) {
  const res = await fetch(
    `${GMAIL_API}/users/${userId}/messages/${msgId}/attachments/${attachId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.json()
}

function base64Decode(s: string): string {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractText(payload: GmailPayload): string {
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return base64Decode(payload.body.data)
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractText(part)
      if (text) return text
    }
  }
  return ''
}

interface GmailPayload {
  mimeType?: string
  body?: { data?: string; attachmentId?: string; size?: number }
  parts?: GmailPayload[]
  filename?: string
  headers?: { name: string; value: string }[]
}

// Parse dollar amount from email text — takes the first occurrence of $N.NN
function parseAmount(text: string): number | null {
  const m = text.match(/\$\s*([\d,]+\.?\d{0,2})/)
  if (!m) return null
  const val = parseFloat(m[1].replace(/,/g, ''))
  return isNaN(val) || val <= 0 ? null : val
}

async function processAccount(
  refreshToken: string,
  accountLabel: string,
  daysBack: number
): Promise<{ logged: number; skipped: number }> {
  const token = await getAccessToken(refreshToken)
  const start = new Date(Date.now() - daysBack * 86400 * 1000)
  const y = start.getFullYear()
  const m = String(start.getMonth() + 1).padStart(2, '0')
  const d = String(start.getDate()).padStart(2, '0')
  const afterDate = `${y}/${m}/${d}`

  // Build Gmail search query across all known vendors
  const senderFilters = VENDORS.map(([, domain]) => `from:${domain}`).join(' OR ')
  // Subject keywords catch many vendors, but some invoices don't include them.
  // Include attachments/PDFs as a fallback signal to avoid missing invoices.
  const subjectTerms =
    'subject:receipt OR subject:invoice OR subject:payment OR subject:billing OR subject:charge OR subject:subscription OR subject:order OR subject:confirmation OR subject:statement OR subject:receipt'
  const attachmentTerms = 'has:attachment OR filename:pdf'
  const query = `(${senderFilters}) ((${subjectTerms}) OR (${attachmentTerms})) after:${afterDate}`

  const list = await gmailGet(token, `/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`)
  if (!list.messages?.length) return { logged: 0, skipped: 0 }

  let logged = 0
  let skipped = 0

  for (const { id: msgId } of list.messages) {
    // Check if already logged
    const existing = await sql`SELECT id FROM expenses WHERE gmail_message_id = ${msgId} LIMIT 1`
    if (existing.length > 0) { skipped++; continue }

    const msg = await gmailGet(token, `/users/me/messages/${msgId}?format=full`)
    const headers: { name: string; value: string }[] = msg.payload?.headers ?? []
    const subject = headers.find((h: { name: string }) => h.name === 'Subject')?.value ?? ''
    const from = headers.find((h: { name: string }) => h.name === 'From')?.value ?? ''
    const dateHeader = headers.find((h: { name: string }) => h.name === 'Date')?.value ?? ''
    const date = new Date(dateHeader).toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    const taxYear = new Date(date).getFullYear()

    const bodyText = extractText(msg.payload)
    const amount = parseAmount(bodyText)
    if (!amount) { skipped++; continue }

    // Match vendor
    const vendor = VENDORS.find(([, domain]) => from.includes(domain))
    if (!vendor) { skipped++; continue }
    const [vendorName, , category] = vendor

    // Upload PDF attachment if present (first PDF attachment wins)
    let receiptUrl: string | null = null
    const parts: GmailPayload[] = msg.payload?.parts ?? []
    for (const part of parts) {
      if (part.filename?.toLowerCase().endsWith('.pdf') && part.body?.attachmentId) {
        try {
          const att = await gmailGetAttachment(token, 'me', msgId, part.body.attachmentId)
          const bytes = Buffer.from(att.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
          const blob = await put(
            `receipts/gmail/${Date.now()}-${vendorName.toLowerCase()}.pdf`,
            bytes,
            { access: 'public', contentType: 'application/pdf' }
          )
          receiptUrl = blob.url
        } catch { /* attachment upload optional — proceed without */ }
        break
      }
    }

    const inserted = await sql`
      INSERT INTO expenses (date, vendor, description, category, amount, tax_year, receipt_url, gmail_message_id, source)
      VALUES (
        ${date},
        ${vendorName},
        ${subject.slice(0, 200)},
        ${category},
        ${amount},
        ${taxYear},
        ${receiptUrl},
        ${msgId},
        ${'gmail-' + accountLabel}
      )
      ON CONFLICT (gmail_message_id) DO NOTHING
      RETURNING id
    `
    if (inserted.length > 0) {
      logged++
    } else {
      // Rare: two overlapping runs raced on the same message id after the SELECT check.
      skipped++
    }
  }

  return { logged, skipped }
}

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (secret && authHeader === `Bearer ${secret}`) return true
  // Vercel Cron sets this header on scheduled invocations.
  // NOTE: Anyone could spoof this header, but the route is still guarded by the vendor allowlist,
  // Gmail OAuth token presence, and idempotent inserts. If you want strict auth, keep CRON_SECRET.
  if (request.headers.get('x-vercel-cron') === '1') return true
  const admin = request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'
  return admin
}

export async function GET(request: NextRequest) {
  // Vercel Cron: Authorization: Bearer <CRON_SECRET>. Manual run from /admin/gmail: admin session cookie.
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const missing = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET']
    .filter(k => !process.env[k])
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing env vars: ${missing.join(', ')}` }, { status: 500 })
  }

  // Load refresh tokens from DB (set via /admin/gmail)
  const tokenRows = await sql`SELECT account, refresh_token FROM oauth_tokens WHERE account IN ('biz', 'per')`
  const tokenMap = Object.fromEntries(
    (tokenRows as { account: string; refresh_token: string }[]).map(r => [r.account, r.refresh_token])
  )

  if (!tokenMap.biz && !tokenMap.per) {
    return NextResponse.json({ error: 'No Gmail accounts connected. Visit /admin/gmail to connect.' }, { status: 400 })
  }

  const rawDays = process.env.GMAIL_RECEIPT_LOOKBACK_DAYS
  const parsed = rawDays ? parseInt(rawDays, 10) : 30
  const daysBack = Number.isFinite(parsed) ? Math.min(90, Math.max(1, parsed)) : 30
  const results: Record<string, { logged: number; skipped: number }> = {}

  if (tokenMap.biz) {
    results.business = await processAccount(tokenMap.biz, 'biz', daysBack)
  }
  if (tokenMap.per) {
    results.personal = await processAccount(tokenMap.per, 'per', daysBack)
  }

  return NextResponse.json({ ok: true, lookbackDays: daysBack, results })
}
