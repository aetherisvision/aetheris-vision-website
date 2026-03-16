import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'av-admin-session'

export async function POST(request: NextRequest) {
  const { passphrase, next } = await request.json()

  if (!passphrase || passphrase !== process.env.ADMIN_PASSPHRASE) {
    return NextResponse.json({ error: 'Incorrect passphrase' }, { status: 401 })
  }

  const redirectTo = next && next.startsWith('/admin') ? next : '/admin/clients'
  const response = NextResponse.json({ ok: true, redirectTo })

  const useSecure = new URL(request.url).protocol === 'https:'
  response.cookies.set(ADMIN_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  })

  return response
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('av-admin-session')
  return response
}
