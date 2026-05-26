import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, getAdminSessionToken } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const { passphrase, next, rememberMe } = await request.json()

  if (!passphrase || passphrase !== process.env.ADMIN_PASSPHRASE) {
    return NextResponse.json({ error: 'Incorrect passphrase' }, { status: 401 })
  }

  const token = getAdminSessionToken()
  if (!token) {
    // ADMIN_PASSPHRASE not configured — fail closed rather than setting an empty-key HMAC
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const redirectTo = next && next.startsWith('/admin') && next !== '/admin' ? next : '/admin/clients'
  const response = NextResponse.json({ ok: true, redirectTo })

  const useSecure = new URL(request.url).protocol === 'https:'
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60,
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(ADMIN_COOKIE)
  return response
}
