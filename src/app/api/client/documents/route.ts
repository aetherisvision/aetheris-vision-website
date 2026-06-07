import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { sql } from '@/lib/db'
import { AUTH_SECRET, isSecureRequest } from '@/lib/auth-cookie'

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: AUTH_SECRET,
    secureCookie: isSecureRequest(request.url),
  })
  const clientId = token?.clientId as string | undefined

  if (!clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const docs = await sql`
    SELECT id, title, created_at, updated_at
    FROM documents
    WHERE client_id = ${Number(clientId)}
    ORDER BY updated_at DESC
  `

  return NextResponse.json({ documents: docs })
}
