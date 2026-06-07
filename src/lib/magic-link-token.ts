import crypto from 'crypto'

/**
 * Magic-link tokens are high-entropy random strings (256 bits) sent to the user
 * by email. We store only their SHA-256 hash in `verification_tokens.token` so
 * that a read of the database (leak, backup, log) does not expose live login
 * tokens — an attacker would still need the original token from the email.
 *
 * Because the token is full-entropy and random, a plain (unsalted) SHA-256 is
 * sufficient: there is nothing to brute-force or rainbow-table. The hash is
 * deterministic, so verification re-hashes the presented token and compares.
 *
 * The hex digest is 64 chars — the same width as the previous plaintext token —
 * so no schema change is required.
 */
export function hashMagicLinkToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
