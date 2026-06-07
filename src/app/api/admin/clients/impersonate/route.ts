/**
 * POST /api/admin/clients/impersonate
 * Creates a client session directly so admin can preview any client's portal.
 * Body: { clientId: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { sql } from '@/lib/db'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { isSecureRequest, requireAuthSecret, sessionCookieName } from '@/lib/auth-cookie'

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { clientId } = await request.json()

  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 })
  }

  const clients = await sql`
    SELECT id, contact_name AS name, email
    FROM clients
    WHERE id = ${Number(clientId)}
  `

  if (clients.length === 0) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const client = clients[0]

  const useSecure = isSecureRequest(request.url)
  const cookieName = sessionCookieName(useSecure)

  let secret: string
  try {
    secret = requireAuthSecret()
  } catch {
    return NextResponse.json({ error: 'Auth secret not configured' }, { status: 500 })
  }

  const sessionToken = await encode({
    secret,
    salt: cookieName,
    token: {
      email: client.email as string,
      name: client.name as string,
      sub: String(client.id),
      clientId: String(client.id),
    },
    maxAge: 60 * 60, // 1 hour — short-lived for impersonation
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  })

  return response
}
