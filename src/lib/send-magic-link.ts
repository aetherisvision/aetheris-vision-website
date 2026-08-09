/**
 * Shared helper: generate a magic link token, store it, and send the email.
 * Used by both the self-serve login page and the admin invite route.
 */
import { Resend } from 'resend'
import crypto from 'crypto'
import { sql } from './db'
import { hashMagicLinkToken } from './magic-link-token'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLink(email: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://aetherisvision.com'
  // The plaintext token travels only in the email link; only its hash is
  // persisted, so a DB read cannot recover a usable login token.
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashMagicLinkToken(token)
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // One active token per email at a time
  await sql`DELETE FROM verification_tokens WHERE identifier = ${email}`

  await sql`
    INSERT INTO verification_tokens (identifier, token, expires)
    VALUES (${email}, ${tokenHash}, ${expires})
  `

  const confirmUrl = `${baseUrl}/client/confirm?token=${token}&email=${encodeURIComponent(email)}`

  await resend.emails.send({
    from: 'Aetheris Vision <noreply@aetherisvision.com>',
    to: email,
    replyTo: 'contact@aetherisvision.com',
    subject: 'Your Aetheris Vision login link',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#0f172a;margin-bottom:8px;">Aetheris Vision LLC</h2>
        <p style="color:#334155;font-size:16px;margin-bottom:24px;">
          Click the button below to log in to your client portal.
          This link expires in 24 hours and can only be used once.
        </p>
        <a href="${confirmUrl}"
           style="display:inline-block;background:#29426C;color:#fff;text-decoration:none;
                  padding:14px 28px;border-radius:6px;font-size:16px;font-weight:600;">
          Log in to Client Portal
        </a>
        <p style="color:#94a3b8;font-size:13px;margin-top:32px;">
          If you did not request this link, you can safely ignore this email.<br>
          Aetheris Vision LLC · contact@aetherisvision.com
        </p>
      </div>
    `,
  })
}
