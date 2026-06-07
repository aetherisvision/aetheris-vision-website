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
 */
export const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
