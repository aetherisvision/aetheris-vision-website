/**
 * Creates a Gmail draft (never sends -- gmail.compose only, see
 * src/app/api/auth/gmail/start/route.ts) addressed to a lead, with the
 * capability statement attached and the AV signature embedded (the Gmail
 * API does not apply a mailbox's configured signature to drafts it
 * creates). Marston reviews and sends it himself from Gmail.
 *
 * Always drafts from the 'biz' mailbox connected at /admin/gmail -- there is
 * no per-lead mailbox choice.
 */
import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin-auth'
import {
  CAPABILITY_STATEMENT_FILENAME,
  loadEncodedCapabilityStatement,
} from '@/lib/capability-statement'
import { sql } from '@/lib/db'
import { loadEmailSignatureHtml } from '@/lib/email-signature'
import { escapeHtml } from '@/lib/escape-html'
import {
  buildDraftRawMessage,
  createGmailDraft,
  getGmailAccessToken,
  GmailApiError,
} from '@/lib/gmail-client'
import { decryptToken } from '@/lib/token-crypto'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }
const GMAIL_ACCOUNT = 'biz'

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: NO_STORE_HEADERS })
}

function parseLeadId(value: string): number | null {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

interface LeadForDraft {
  id: number
  name: string
  email: string
  organization: string | null
}

async function findLeadForDraft(id: number): Promise<LeadForDraft | null> {
  const rows = await sql`
    SELECT id, name, email, organization
    FROM leads
    WHERE id = ${id}
  `
  return (rows as LeadForDraft[])[0] ?? null
}

function buildEmailBody(lead: LeadForDraft, signatureHtml: string): string {
  const context = lead.organization ? ` at ${escapeHtml(lead.organization)}` : ''
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.6;">
      <p>Hi,</p>
      <p>Thank you for the opportunity to follow up regarding ${escapeHtml(lead.name)}${context}. I've attached our capability statement for your review.</p>
      <p>Please let me know if you have any questions.</p>
      <p>Best regards,</p>
    </div>
    ${signatureHtml}
  `
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idValue } = await params
  const id = parseLeadId(idValue)
  if (id === null) return json({ error: 'Invalid lead ID' }, { status: 400 })

  const lead = await findLeadForDraft(id)
  if (!lead) return json({ error: 'Lead not found' }, { status: 404 })

  if (!lead.email.trim()) {
    return json({ error: 'This lead has no contact email on file' }, { status: 400 })
  }

  const tokenRows = await sql`
    SELECT refresh_token FROM oauth_tokens WHERE account = ${GMAIL_ACCOUNT}
  `
  const encryptedToken = (tokenRows as { refresh_token: string }[])[0]?.refresh_token
  if (!encryptedToken) {
    return json(
      { error: 'Connect the Aetheris Vision Gmail mailbox at /admin/gmail first' },
      { status: 409 },
    )
  }

  let refreshToken: string
  try {
    refreshToken = decryptToken(encryptedToken)
  } catch (error) {
    console.error(
      'Unable to decrypt stored Gmail refresh token',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json(
      { error: 'The stored Gmail connection is unreadable -- reconnect at /admin/gmail' },
      { status: 500 },
    )
  }

  let pdf: string
  let signatureHtml: string
  try {
    ;[pdf, signatureHtml] = await Promise.all([
      loadEncodedCapabilityStatement(),
      loadEmailSignatureHtml(),
    ])
  } catch (error) {
    console.error(
      'Unable to load draft-email attachments',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({ error: 'The draft could not be prepared' }, { status: 500 })
  }

  const subject = `Aetheris Vision -- following up${lead.organization ? ` with ${lead.organization}` : ''}`
  const raw = buildDraftRawMessage({
    to: lead.email,
    subject,
    htmlBody: buildEmailBody(lead, signatureHtml),
    attachment: {
      filename: CAPABILITY_STATEMENT_FILENAME,
      mimeType: 'application/pdf',
      base64Content: pdf,
    },
  })

  try {
    const accessToken = await getGmailAccessToken(refreshToken)
    const { draftId } = await createGmailDraft(accessToken, raw)

    const draftedAt = new Date().toISOString()
    await sql`
      UPDATE leads
      SET gmail_draft_id = ${draftId}, gmail_draft_created_at = ${draftedAt}::timestamptz
      WHERE id = ${id}
    `

    return json({
      draftId,
      draftUrl: `https://mail.google.com/mail/u/0/#drafts/${draftId}`,
      draftedAt,
    })
  } catch (error) {
    if (error instanceof GmailApiError && error.status === 403) {
      console.error('Gmail draft creation failed -- insufficient scope', error.message)
      return json(
        {
          error:
            'The connected Gmail mailbox needs to be reconnected with drafting permission at /admin/gmail',
        },
        { status: 409 },
      )
    }
    console.error(
      'Unable to create Gmail draft',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({ error: 'The draft could not be created' }, { status: 502 })
  }
}
