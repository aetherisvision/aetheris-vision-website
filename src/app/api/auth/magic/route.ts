/**
 * POST /api/auth/magic
 * Custom magic link verification endpoint.
 * Receives form data (token + email), verifies against DB,
 * creates a NextAuth-compatible JWT session, and redirects to dashboard.
 * POST-only so link scanners (which do GET) cannot consume tokens.
 */
import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = (formData.get('token') ?? '') as string
  const email = (formData.get('email') ?? '') as string

  const errorUrl = new URL('/client/login?error=1', request.url)
  const dashboardUrl = new URL('/client/dashboard', request.url)

  if (!token || !email) {
    return NextResponse.redirect(errorUrl, { status: 303 })
  }

  // Verify and consume the token atomically
  const rows = await sql`
    DELETE FROM verification_tokens
    WHERE identifier = ${email}
      AND token = ${token}
      AND expires > NOW()
    RETURNING identifier
  `

  if (rows.length === 0) {
    return NextResponse.redirect(errorUrl, { status: 303 })
  }

  // Look up the client record
  const clients = await sql`
    SELECT id, contact_name AS name, email
    FROM clients
    WHERE email = ${email}
  `

  if (clients.length === 0) {
    return NextResponse.redirect(errorUrl, { status: 303 })
  }

  const client = clients[0]

  // Determine cookie name — NextAuth uses __Secure- prefix on HTTPS
  const useSecure = new URL(request.url).protocol === 'https:'
  const cookieName = useSecure
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'

  // Create NextAuth-compatible JWT.
  // NextAuth internally calls decode({ ...jwtOptions, token }) where jwtOptions
  // has no `salt` field, so the effective salt is "" — we must match that.
  const sessionToken = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    token: {
      email: client.email as string,
      name: client.name as string,
      sub: String(client.id),
      clientId: String(client.id),
    },
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  const response = NextResponse.redirect(dashboardUrl, { status: 303 })
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
