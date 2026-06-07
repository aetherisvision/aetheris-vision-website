/**
 * Auth.js v5 cookie naming + secret helpers.
 *
 * v5 renamed the session cookie from `next-auth.session-token` to
 * `authjs.session-token` (`__Secure-` prefixed over HTTPS) and now derives the
 * JWT encryption key from a `salt` that defaults to the cookie name. The manual
 * `encode()` sites (magic-link login, admin impersonation) and the `getToken()`
 * readers MUST agree on both the cookie name and the salt, so that derivation
 * lives here in one place.
 */

/** True when the incoming request is served over HTTPS (production). */
export function isSecureRequest(requestUrl: string): boolean {
  return new URL(requestUrl).protocol === 'https:'
}

/** Auth.js v5 session cookie name for the given transport security. */
export function sessionCookieName(secure: boolean): string {
  return secure ? '__Secure-authjs.session-token' : 'authjs.session-token'
}

/**
 * Shared secret for JWT encode/decode. v5's convention is `AUTH_SECRET`; we keep
 * reading the existing `NEXTAUTH_SECRET` (falling back to `AUTH_SECRET`) so no
 * Vercel env rename is required during the migration.
 *
 * May be `undefined` at build time (page-data collection runs without runtime
 * secrets). Read paths (`getToken`) treat that as "no session"; mint paths must
 * use {@link requireAuthSecret} to fail fast with a clear message.
 */
export const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

/**
 * Returns the auth secret or throws a descriptive error. Use this on the
 * session-minting paths (magic-link login, admin impersonation) so a missing
 * env var surfaces as a controlled failure instead of an opaque crash.
 */
export function requireAuthSecret(): string {
  if (!AUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET (or AUTH_SECRET) is not set; cannot mint a session token.')
  }
  return AUTH_SECRET
}
