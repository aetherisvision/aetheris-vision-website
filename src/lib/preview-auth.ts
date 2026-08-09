import type { NextRequest } from 'next/server'

export const PREVIEW_COOKIE = 'av-preview-session'

const PREVIEW_SESSION_MESSAGE = 'preview-session'

/**
 * Create the preview-session token without exposing PREVIEW_PASSWORD to the
 * browser. Web Crypto keeps this helper compatible with both Node and Edge.
 */
export async function getPreviewSessionToken(
  password = process.env.PREVIEW_PASSWORD,
): Promise<string | null> {
  if (!password) return null

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(PREVIEW_SESSION_MESSAGE),
  )

  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time comparison for preview credentials and session tokens. */
export function safePreviewEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false
  if (a.length !== b.length) return false

  let diff = 0
  for (let index = 0; index < a.length; index++) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return diff === 0
}

export async function hasPreviewSession(request: NextRequest): Promise<boolean> {
  const cookieValue = request.cookies.get(PREVIEW_COOKIE)?.value
  const expected = await getPreviewSessionToken()
  return safePreviewEqual(cookieValue, expected)
}

/**
 * Restrict post-login navigation to this origin and keep the login page from
 * redirecting back to itself.
 */
export function sanitizePreviewReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/'

  try {
    const base = new URL('https://aetherisvision.invalid')
    const target = new URL(value, base)
    if (target.origin !== base.origin || target.pathname === '/preview') return '/'
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return '/'
  }
}
