import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLink } from '@/lib/send-magic-link'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { email } = await request.json()

  const trimmed = typeof email === 'string' ? email.trim() : ''
  // RFC 5322-compatible basic check: local@domain.tld — rejects whitespace-only values
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!trimmed || !EMAIL_RE.test(trimmed)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  await sendMagicLink(trimmed)

  return NextResponse.json({ sent: true })
}
