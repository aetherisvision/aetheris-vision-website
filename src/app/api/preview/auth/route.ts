import { NextRequest, NextResponse } from 'next/server'
import {
  PREVIEW_COOKIE,
  getPreviewSessionToken,
  safePreviewEqual,
  sanitizePreviewReturnPath,
} from '@/lib/preview-auth'
import { rateLimit } from '@/lib/rate-limit'
import { getTrustedClientIp } from '@/lib/request-security'

const SESSION_MAX_AGE = 30 * 24 * 60 * 60
const ATTEMPT_LIMIT = 5
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: NextRequest) {
  // Keyed on the platform-trusted IP (spoofable X-Forwarded-For is ignored);
  // production requires the distributed store so instance spread cannot
  // multiply the budget.
  const limit = await rateLimit(getTrustedClientIp(request) ?? 'unknown', {
    limit: ATTEMPT_LIMIT,
    windowMs: ATTEMPT_WINDOW_MS,
    prefix: 'preview-login',
    requireDistributed: process.env.NODE_ENV === 'production',
  })
  if (!limit.success) {
    return new NextResponse('Too many attempts. Please wait before trying again.', {
      status: 429,
      headers: { 'Retry-After': limit.retryAfterSeconds.toString(), 'Cache-Control': 'no-store' },
    })
  }

  const form = await request.formData()
  const password = form.get('password')
  const next = sanitizePreviewReturnPath(form.get('next'))
  const configuredPassword = process.env.PREVIEW_PASSWORD

  // If the lock was removed between rendering and submission, continue rather
  // than trapping the visitor on a login page that is no longer required.
  if (!configuredPassword) {
    return NextResponse.redirect(new URL(next, request.url), 303)
  }

  if (!safePreviewEqual(password, configuredPassword)) {
    const loginUrl = new URL('/preview', request.url)
    loginUrl.searchParams.set('error', 'incorrect')
    loginUrl.searchParams.set('next', next)
    return NextResponse.redirect(loginUrl, 303)
  }

  const token = await getPreviewSessionToken(configuredPassword)
  if (!token) {
    return new NextResponse('Preview access is not configured.', { status: 500 })
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303)
  response.cookies.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  return response
}
