import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * At-rest encryption for long-lived third-party credentials (Gmail refresh
 * tokens). AES-256-GCM with a per-value IV; the stored form is
 * `enc1:<iv>:<tag>:<ciphertext>` (base64url), so legacy plaintext rows are
 * recognizable and can be migrated lazily.
 *
 * Key: TOKEN_ENCRYPTION_KEY (32 bytes, base64 or hex). When unset, a key is
 * derived from NEXTAUTH_SECRET so the feature never silently stores
 * plaintext — but a dedicated key is the intended configuration.
 */
const PREFIX = 'enc1'

function keyBytes(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (raw) {
    const buf = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
    if (buf.length === 32) return buf
    throw new Error('TOKEN_ENCRYPTION_KEY must decode to 32 bytes')
  }
  const fallback = process.env.NEXTAUTH_SECRET
  if (!fallback) throw new Error('TOKEN_ENCRYPTION_KEY or NEXTAUTH_SECRET must be set')
  return createHash('sha256').update(`oauth-token-key|${fallback}`).digest()
}

export function isEncryptedToken(value: string): boolean {
  return value.startsWith(`${PREFIX}:`)
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyBytes(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join(':')
}

/** Decrypts an `enc1:` value; passes legacy plaintext through unchanged. */
export function decryptToken(stored: string): string {
  if (!isEncryptedToken(stored)) return stored
  const [, iv, tag, ciphertext] = stored.split(':')
  if (!iv || !tag || !ciphertext) throw new Error('Malformed encrypted token')
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
}
