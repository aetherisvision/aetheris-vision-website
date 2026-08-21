import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLink } from '@/lib/send-magic-link'
import { sql } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import {
  RequestSecurityError,
  assertSameOrigin,
  createOpaqueAbuseKey,
  getTrustedClientIp,
  readJsonBody,
} from '@/lib/request-security'

const MAX_BODY_BYTES = 2_048
const IP_LIMIT = 10
const EMAIL_LIMIT = 3
const WINDOW_MS = 15 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sent() {
  return NextResponse.json({ sent: true }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  let body: { email?: unknown }
  try {
    assertSameOrigin(request)
    body = await readJsonBody<{ email?: unknown }>(request, MAX_BODY_BYTES)
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: 'Request rejected' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  // Two budgets: per source IP, and per target address so one mailbox cannot
  // be flooded (or its live link repeatedly invalidated) from many sources.
  const distributed = process.env.NODE_ENV === 'production'
  const byIp = await rateLimit(getTrustedClientIp(request) ?? 'unknown', {
    limit: IP_LIMIT,
    windowMs: WINDOW_MS,
    prefix: 'magic-link-ip',
    requireDistributed: distributed,
  })
  if (!byIp.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': byIp.retryAfterSeconds.toString() } })
  }
  const byEmail = await rateLimit(createOpaqueAbuseKey('magic-link-email', email), {
    limit: EMAIL_LIMIT,
    windowMs: WINDOW_MS,
    prefix: 'magic-link-email',
    requireDistributed: distributed,
  })
  // Over the per-address budget: answer exactly as if sent, so the response
  // reveals nothing about whether the address is a client.
  if (!byEmail.success) return sent()

  // Only send to known clients; unknown addresses get the same reply and a
  // comparable delay so timing does not enumerate the client list.
  const started = Date.now()
  const clients = await sql`SELECT id FROM clients WHERE email = ${email}`
  if (clients.length > 0) {
    await sendMagicLink(email)
  } else {
    const elapsed = Date.now() - started
    const pad = 350 + Math.floor(Math.random() * 250) - elapsed
    if (pad > 0) await new Promise((r) => setTimeout(r, pad))
  }

  return sent()
}
