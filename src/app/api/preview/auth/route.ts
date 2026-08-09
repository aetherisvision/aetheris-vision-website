import { NextRequest, NextResponse } from 'next/server'
import {
  PREVIEW_COOKIE,
  getPreviewSessionToken,
  safePreviewEqual,
  sanitizePreviewReturnPath,
} from '@/lib/preview-auth'

const SESSION_MAX_AGE = 30 * 24 * 60 * 60

export async function POST(request: NextRequest) {
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
