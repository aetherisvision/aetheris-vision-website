import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'av-admin-session'

/**
 * Returns true if the request carries a valid admin session cookie.
 * The cookie is set by POST /api/admin/auth after passphrase verification.
 */
export function isAdmin(request: NextRequest): boolean {
  return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'
}

/** Standard 401 response for unauthenticated admin requests. */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
