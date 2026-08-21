import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'av-admin-session'

/** Default session lifetime; the login route may extend it for "remember me". */
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60
export const ADMIN_SESSION_REMEMBER_TTL_SECONDS = 30 * 24 * 60 * 60

/**
 * Session tokens are `<sid>.<exp>.<sig>`: a random session id, a Unix-seconds
 * expiry, and HMAC-SHA256 over `sid.exp`. Every login mints a distinct token
 * and the expiry is enforced server-side, so a captured cookie is neither a
 * permanent credential nor an offline dictionary target for the passphrase.
 *
 * The signing key is ADMIN_SESSION_SECRET; when unset it is derived from the
 * passphrase so the system still fails closed rather than open. The Edge
 * verifier in src/proxy.ts must stay byte-for-byte compatible with this.
 */
export function getAdminSessionKey(): string | null {
  const dedicated = process.env.ADMIN_SESSION_SECRET
  if (dedicated) {
    if (dedicated.length < 32) {
      throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters')
    }
    return dedicated
  }
  if (!process.env.ADMIN_PASSPHRASE) return null
  return createHash('sha256').update(`av-admin-session-key|${process.env.ADMIN_PASSPHRASE}`).digest('hex')
}

const SID_RE = /^[a-f0-9]{32}$/
const EXP_RE = /^\d{1,12}$/
const SIG_RE = /^[a-f0-9]{64}$/

function sign(key: string, message: string): string {
  return createHmac('sha256', key).update(message).digest('hex')
}

/** Mint a fresh session token, or null when no signing key is configured. */
export function createAdminSessionToken(ttlSeconds = ADMIN_SESSION_TTL_SECONDS): string | null {
  const key = getAdminSessionKey()
  if (!key) return null
  const sid = randomBytes(16).toString('hex')
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, Math.floor(ttlSeconds))
  const message = `${sid}.${exp}`
  return `${message}.${sign(key, message)}`
}

/** Back-compatible alias: a currently valid token for the default lifetime. */
export function getAdminSessionToken(): string | null {
  return createAdminSessionToken()
}

/** True only for a well-formed, unexpired token with a valid signature. */
export function verifyAdminSessionToken(token: unknown): boolean {
  if (typeof token !== 'string') return false
  const key = getAdminSessionKey()
  if (!key) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [sid, exp, sig] = parts
  if (!SID_RE.test(sid) || !EXP_RE.test(exp) || !SIG_RE.test(sig)) return false
  if (Number(exp) <= Math.floor(Date.now() / 1000)) return false
  return safeEqual(sig, sign(key, `${sid}.${exp}`))
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
 * Returns true if the request carries a valid, unexpired admin session cookie.
 * The cookie is set by POST /api/admin/auth after passphrase verification.
 */
export function isAdmin(request: NextRequest): boolean {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE)?.value)
}

/** Standard 401 response for unauthenticated admin requests. */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  )
}
