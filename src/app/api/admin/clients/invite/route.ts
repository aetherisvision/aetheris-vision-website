import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { sql } from '@/lib/db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://aetherisvision.com'
  const secret = process.env.NEXTAUTH_SECRET ?? ''
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // NextAuth v4 hashes tokens as sha256(token + secret) before storing.
  // We must match that so the callback can verify the token.
  const hashedToken = crypto
    .createHash('sha256')
    .update(`${token}${secret}`)
    .digest('hex')

  // Store the hashed token (same table NextAuth uses for magic links)
  await sql`
    INSERT INTO verification_tokens (identifier, token, expires)
    VALUES (${email}, ${hashedToken}, ${expires})
    ON CONFLICT (identifier, token) DO NOTHING
  `

  const loginUrl = `${baseUrl}/client/confirm?token=${token}&email=${encodeURIComponent(email)}`

  await resend.emails.send({
    from: 'Aetheris Vision <noreply@aetherisvision.com>',
    to: email,
    subject: 'You\'ve been invited to the Aetheris Vision Client Portal',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#0f172a;margin-bottom:8px;">Aetheris Vision LLC</h2>
        <p style="color:#334155;font-size:16px;margin-bottom:8px;">
          You have been invited to the Aetheris Vision client portal, where you can view
          your project status and sign documents.
        </p>
        <p style="color:#334155;font-size:16px;margin-bottom:24px;">
          Click the button below to log in. This link expires in 24 hours.
        </p>
        <a href="${loginUrl}"
           style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;
                  padding:14px 28px;border-radius:6px;font-size:16px;font-weight:600;">
          Access Client Portal
        </a>
        <p style="color:#94a3b8;font-size:13px;margin-top:32px;">
          Questions? Reply to this email or contact marston@aetherisvision.com<br>
          Aetheris Vision LLC · (346) 381-9629
        </p>
      </div>
    `,
  })

  return NextResponse.json({ sent: true })
}
