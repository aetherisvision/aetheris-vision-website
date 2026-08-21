import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_REMEMBER_TTL_SECONDS,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  safeEqual,
} from '@/lib/admin-auth'
import { rateLimit } from '@/lib/rate-limit'
import { getTrustedClientIp } from '@/lib/request-security'

const LOGIN_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000

function noStoreJson(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request) ?? 'unknown'
  const limit = await rateLimit(ip, {
    limit: LOGIN_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
    prefix: 'admin-login',
    requireDistributed: process.env.NODE_ENV === 'production',
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

  const ttl = rememberMe ? ADMIN_SESSION_REMEMBER_TTL_SECONDS : ADMIN_SESSION_TTL_SECONDS
  const token = createAdminSessionToken(ttl)
  if (!token) {
    // No signing key configured — fail closed rather than minting an unsigned session
    return noStoreJson({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const redirectTo = next && next.startsWith('/admin') && next !== '/admin' ? next : '/admin/leads'
  const response = noStoreJson({ ok: true, redirectTo })

  const useSecure = new URL(request.url).protocol === 'https:'
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: ttl,
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = noStoreJson({ ok: true })
  response.cookies.delete(ADMIN_COOKIE)
  return response
}
