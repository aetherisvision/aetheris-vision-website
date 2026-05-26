import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'av-admin-session'

/**
 * Returns the expected admin session token — an HMAC-SHA256 of the fixed
 * string "admin-session" keyed by ADMIN_PASSPHRASE.  A fixed-string cookie
 * value ("authenticated") is trivially forgeable; using HMAC ties validity
 * to knowledge of the passphrase without storing it in the cookie itself.
 */
export function getAdminSessionToken(): string {
  return createHmac('sha256', process.env.ADMIN_PASSPHRASE ?? '')
    .update('admin-session')
    .digest('hex')
}

/**
 * Returns true if the request carries a valid admin session cookie.
 * The cookie is set by POST /api/admin/auth after passphrase verification.
 */
export function isAdmin(request: NextRequest): boolean {
  return request.cookies.get(ADMIN_COOKIE)?.value === getAdminSessionToken()
}

/** Standard 401 response for unauthenticated admin requests. */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
