import { NextRequest, NextResponse } from 'next/server'

export type GmailAccount = 'biz' | 'per'

// Per-account cookie: starting a second connect flow (e.g. `biz` and `per`
// in two tabs) must not clobber the other flow's pending nonce.
export function stateCookieName(account: GmailAccount): string {
  return `av-gmail-oauth-state-${account}`
}

export function setStateCookie(
  response: NextResponse,
  request: NextRequest,
  account: GmailAccount,
  nonce: string
): NextResponse {
  response.cookies.set(stateCookieName(account), nonce, {
    httpOnly: true,
    // Protocol-aware like the admin session cookie: a Secure cookie set over
    // plain-http dev is dropped by the browser, and the callback nonce check
    // could then never pass.
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  })
  return response
}

export function clearStateCookie(
  response: NextResponse,
  account: GmailAccount
): NextResponse {
  response.cookies.delete(stateCookieName(account))
  return response
}
