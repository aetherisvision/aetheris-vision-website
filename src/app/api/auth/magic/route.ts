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
import { AUTH_SECRET, isSecureRequest, sessionCookieName } from '@/lib/auth-cookie'

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

  // Auth.js v5 cookie name (__Secure- prefix on HTTPS).
  const useSecure = isSecureRequest(request.url)
  const cookieName = sessionCookieName(useSecure)

  // Create an Auth.js v5 session JWT. v5 derives the encryption key from a
  // `salt`, which defaults to the cookie name — getToken()/auth() use the same
  // derivation when reading, so the salt MUST equal the cookie name.
  const sessionToken = await encode({
    secret: AUTH_SECRET!,
    salt: cookieName,
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
