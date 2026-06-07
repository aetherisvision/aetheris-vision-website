import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'av-admin-session'

/**
 * Returns the expected admin session token — an HMAC-SHA256 of the fixed
 * string "admin-session" keyed by ADMIN_PASSPHRASE.  A fixed-string cookie
 * value ("authenticated") is trivially forgeable; using HMAC ties validity
 * to knowledge of the passphrase without storing it in the cookie itself.
 *
 * Returns null when ADMIN_PASSPHRASE is unset so the caller can fail closed
 * rather than accepting a deterministic empty-key HMAC.
 */
export function getAdminSessionToken(): string | null {
  if (!process.env.ADMIN_PASSPHRASE) return null
  return createHmac('sha256', process.env.ADMIN_PASSPHRASE)
    .update('admin-session')
    .digest('hex')
}

/**
 * Constant-time string comparison. Returns false on length mismatch (which is
 * not itself secret) without leaking byte-by-byte timing for equal-length
 * inputs. Use for any secret comparison (session cookie, passphrase).
 */
export function safeEqual(a: unknown, b: unknown): boolean {
  // Fail closed on missing or non-string input (e.g. a JSON body field that is
  // an object/number) rather than letting Buffer.from throw a 500.
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  // Lengths must match first to avoid timingSafeEqual throwing on mismatch
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

/**
 * Returns true if the request carries a valid admin session cookie.
 * The cookie is set by POST /api/admin/auth after passphrase verification.
 *
 * Uses timingSafeEqual to prevent timing-based oracle attacks.
 */
export function isAdmin(request: NextRequest): boolean {
  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value
  const expected = getAdminSessionToken()
  return safeEqual(cookieValue, expected)
}

/** Standard 401 response for unauthenticated admin requests. */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
