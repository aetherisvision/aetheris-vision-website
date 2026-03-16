import type { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { Resend } from 'resend'
import { NeonAdapter } from './auth-adapter'

const resend = new Resend(process.env.RESEND_API_KEY)

export const authOptions: NextAuthOptions = {
  adapter: NeonAdapter(),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/client/login',
    verifyRequest: '/client/login?sent=1',
    error: '/client/login?error=1',
  },
  providers: [
    EmailProvider({
      from: 'Aetheris Vision <noreply@aetherisvision.com>',
      async sendVerificationRequest({ identifier: email, url }) {
        // Route through /client/confirm so scanners can't consume the token
        const urlObj = new URL(url)
        const token = urlObj.searchParams.get('token') ?? ''
        const confirmUrl = `${urlObj.origin}/client/confirm?token=${token}&email=${encodeURIComponent(email)}`

        await resend.emails.send({
          from: 'Aetheris Vision <noreply@aetherisvision.com>',
          to: email,
          subject: 'Your Aetheris Vision login link',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
              <h2 style="color:#0f172a;margin-bottom:8px;">Aetheris Vision LLC</h2>
              <p style="color:#334155;font-size:16px;margin-bottom:24px;">
                Click the button below to log in to your client portal.
                This link expires in 24 hours and can only be used once.
              </p>
              <a href="${confirmUrl}"
                 style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;
                        padding:14px 28px;border-radius:6px;font-size:16px;font-weight:600;">
                Log in to Client Portal
              </a>
              <p style="color:#94a3b8;font-size:13px;margin-top:32px;">
                If you did not request this link, you can safely ignore this email.<br>
                Aetheris Vision LLC · marston@aetherisvision.com
              </p>
            </div>
          `,
        })
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.clientId = user.id
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.clientId as string
      }
      return session
    },
    async redirect() {
      return '/client/dashboard'
    },
  },
}
