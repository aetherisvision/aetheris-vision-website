/**
 * POST /api/admin/clients/impersonate
 * Creates a client session directly so admin can preview any client's portal.
 * Body: { clientId: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { sql } from '@/lib/db'

function isAdmin(req: NextRequest) {
  return req.cookies.get('av-admin-session')?.value === 'authenticated'
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const useSecure = new URL(request.url).protocol === 'https:'
  const cookieName = useSecure
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'

  const sessionToken = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
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
