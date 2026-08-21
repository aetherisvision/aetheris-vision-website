import { createHash, createHmac, randomBytes } from 'crypto'

/**
 * Mint a valid admin session token exactly as src/lib/admin-auth.ts does when
 * no ADMIN_SESSION_SECRET is configured: `<sid>.<exp>.<HMAC(key, "sid.exp")>`
 * with key = sha256("av-admin-session-key|" + passphrase) as hex.
 */
export function mintAdminSessionToken(passphrase: string, ttlSeconds = 3600): string {
  const key = createHash('sha256').update(`av-admin-session-key|${passphrase}`).digest('hex')
  const sid = randomBytes(16).toString('hex')
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = createHmac('sha256', key).update(`${sid}.${exp}`).digest('hex')
  return `${sid}.${exp}.${sig}`
}
