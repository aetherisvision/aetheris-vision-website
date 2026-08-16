export const TURNSTILE_ACTIONS = {
  contact: 'contact',
  intake: 'intake',
  review: 'review',
} as const

export type TurnstileAction = (typeof TURNSTILE_ACTIONS)[keyof typeof TURNSTILE_ACTIONS]

export type TurnstileFailureReason =
  | 'missing'
  | 'invalid'
  | 'action-mismatch'
  | 'hostname-mismatch'
  | 'timeout'
  | 'unavailable'
  | 'misconfigured'

export type TurnstileVerificationResult =
  | { ok: true }
  | { ok: false; reason: TurnstileFailureReason }

export interface VerifyTurnstileTokenInput {
  token: string | null | undefined
  expectedAction: TurnstileAction
  expectedHostname: string
}

interface SiteverifyResponse {
  success?: unknown
  action?: unknown
  hostname?: unknown
  metadata?: unknown
}

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Cloudflare's documented Turnstile testing secrets (dev/CI only). Siteverify
// answers for them always report hostname "example.com", omit the action echo,
// and carry metadata.result_with_testing_key: true, so the action/hostname
// binding below must be skipped for them or every dev submission 403s. Real
// secrets never produce that tag; both conditions must hold before relaxing.
const TESTING_SECRETS = new Set([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
])

function isTestingKeyResult(secret: string, result: SiteverifyResponse): boolean {
  return (
    TESTING_SECRETS.has(secret) &&
    typeof result.metadata === 'object' &&
    result.metadata !== null &&
    (result.metadata as { result_with_testing_key?: unknown }).result_with_testing_key === true
  )
}
const MAX_TOKEN_LENGTH = 2048
const SITEVERIFY_TIMEOUT_MS = 5_000

function isTurnstileAction(value: string): value is TurnstileAction {
  return (Object.values(TURNSTILE_ACTIONS) as string[]).includes(value)
}

function normalizeHostname(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const candidate = value.trim().toLowerCase()
  if (!candidate) return null

  try {
    const parsed = new URL(candidate.includes('://') ? candidate : `https://${candidate}`)
    if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      return null
    }
    return parsed.hostname.toLowerCase().replace(/\.$/, '') || null
  } catch {
    return null
  }
}

/** Validate a Turnstile token server-side and bind it to its route action and host. */
export async function verifyTurnstileToken(
  input: VerifyTurnstileTokenInput,
): Promise<TurnstileVerificationResult> {
  if (input.token === null || input.token === undefined || input.token === '') {
    return { ok: false, reason: 'missing' }
  }
  if (typeof input.token !== 'string') return { ok: false, reason: 'invalid' }
  if (input.token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: 'invalid' }
  const token = input.token?.trim()
  if (!token) return { ok: false, reason: 'missing' }
  if (token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: 'invalid' }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
  const expectedHostname = normalizeHostname(input.expectedHostname)
  if (!secret || !expectedHostname || !isTurnstileAction(input.expectedAction)) {
    return { ok: false, reason: 'misconfigured' }
  }

  const body = new URLSearchParams({ secret, response: token })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SITEVERIFY_TIMEOUT_MS)

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) return { ok: false, reason: 'unavailable' }

    let result: SiteverifyResponse
    try {
      result = (await response.json()) as SiteverifyResponse
    } catch {
      return { ok: false, reason: 'unavailable' }
    }

    if (result.success !== true) return { ok: false, reason: 'invalid' }
    if (!isTestingKeyResult(secret, result)) {
      if (result.action !== input.expectedAction) {
        return { ok: false, reason: 'action-mismatch' }
      }
      if (typeof result.hostname !== 'string') {
        return { ok: false, reason: 'hostname-mismatch' }
      }
      if (normalizeHostname(result.hostname) !== expectedHostname) {
        return { ok: false, reason: 'hostname-mismatch' }
      }
    }

    return { ok: true }
  } catch (error) {
    if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      return { ok: false, reason: 'timeout' }
    }
    return { ok: false, reason: 'unavailable' }
  } finally {
    clearTimeout(timeout)
  }
}
