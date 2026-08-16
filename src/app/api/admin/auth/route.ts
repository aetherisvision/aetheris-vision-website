import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, getAdminSessionToken, safeEqual } from '@/lib/admin-auth'
import { rateLimit } from '@/lib/rate-limit'

const LOGIN_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000

function noStoreJson(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const limit = await rateLimit(ip, {
    limit: LOGIN_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
    prefix: 'admin-login',
  })

  if (!limit.success) {
    return noStoreJson(
      { error: 'Too many login attempts. Please wait before trying again.' },
      {
        status: 429,
        headers: { 'Retry-After': limit.retryAfterSeconds.toString() },
      },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return noStoreJson({ error: 'Invalid JSON request.' }, { status: 400 })
  }

  const passphrase = typeof body.passphrase === 'string' ? body.passphrase : ''
  const next = typeof body.next === 'string' ? body.next : ''
  const rememberMe = body.rememberMe === true

  // Constant-time comparison avoids a timing oracle on the passphrase.
  if (!safeEqual(passphrase, process.env.ADMIN_PASSPHRASE)) {
    return noStoreJson({ error: 'Incorrect passphrase' }, { status: 401 })
  }

  const token = getAdminSessionToken()
  if (!token) {
    // ADMIN_PASSPHRASE not configured — fail closed rather than setting an empty-key HMAC
    return noStoreJson({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const redirectTo = next && next.startsWith('/admin') && next !== '/admin' ? next : '/admin/leads'
  const response = noStoreJson({ ok: true, redirectTo })

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
  const response = noStoreJson({ ok: true })
  response.cookies.delete(ADMIN_COOKIE)
  return response
}
