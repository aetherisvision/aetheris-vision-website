import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

import { isRateLimitDistributed } from '@/lib/rate-limit'

export type RequestSecurityErrorCode =
  | 'invalid-origin'
  | 'invalid-content-type'
  | 'invalid-body'
  | 'body-too-large'
  | 'rate-limit-unavailable'

export class RequestSecurityError extends Error {
  readonly status: 400 | 403 | 413 | 415 | 503
  readonly code: RequestSecurityErrorCode

  constructor(
    code: RequestSecurityErrorCode,
    status: 400 | 403 | 413 | 415 | 503,
    message: string,
  ) {
    super(message)
    this.name = 'RequestSecurityError'
    this.code = code
    this.status = status
  }
}

const JSON_MEDIA_TYPE = /^application\/(?:[a-z0-9!#$&^_.+-]+\+)?json$/i
const MINIMUM_HMAC_SECRET_BYTES = 32

function requestSecurityError(
  code: RequestSecurityErrorCode,
  status: RequestSecurityError['status'],
): RequestSecurityError {
  const messages: Record<RequestSecurityErrorCode, string> = {
    'invalid-origin': 'Request origin is not allowed',
    'invalid-content-type': 'Request content type is not supported',
    'invalid-body': 'Request body is invalid',
    'body-too-large': 'Request body is too large',
    'rate-limit-unavailable': 'Request protection is temporarily unavailable',
  }

  return new RequestSecurityError(code, status, messages[code])
}

/**
 * Require browser mutation requests to originate from the exact public origin
 * represented by the Request URL. Missing Origin headers fail closed.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  let expectedOrigin: string

  try {
    expectedOrigin = new URL(request.url).origin
  } catch {
    throw requestSecurityError('invalid-origin', 403)
  }

  if (!origin) throw requestSecurityError('invalid-origin', 403)

  try {
    if (new URL(origin).origin !== expectedOrigin || origin !== new URL(origin).origin) {
      throw requestSecurityError('invalid-origin', 403)
    }
  } catch (error) {
    if (error instanceof RequestSecurityError) throw error
    throw requestSecurityError('invalid-origin', 403)
  }

  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin') {
    throw requestSecurityError('invalid-origin', 403)
  }
}

function validatedMaximum(maxBytes: number): number {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new TypeError('maxBytes must be a positive safe integer')
  }
  return maxBytes
}

function assertJsonContentType(request: Request): void {
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim()
  if (!mediaType || !JSON_MEDIA_TYPE.test(mediaType)) {
    throw requestSecurityError('invalid-content-type', 415)
  }
}

function declaredBodyLength(request: Request): number | null {
  const value = request.headers.get('content-length')
  if (value === null) return null
  if (!/^\d+$/.test(value.trim())) throw requestSecurityError('invalid-body', 400)

  const length = Number(value)
  if (!Number.isSafeInteger(length)) throw requestSecurityError('invalid-body', 400)
  return length
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  if (!request.body) throw requestSecurityError('invalid-body', 400)

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined)
        throw requestSecurityError('body-too-large', 413)
      }
      chunks.push(value)
    }
  } catch (error) {
    if (error instanceof RequestSecurityError) throw error
    throw requestSecurityError('invalid-body', 400)
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

/** Parse a JSON body while enforcing both declared and streamed byte limits. */
export async function readJsonBody<T = unknown>(request: Request, maxBytes: number): Promise<T> {
  const maximum = validatedMaximum(maxBytes)
  assertJsonContentType(request)

  const declaredLength = declaredBodyLength(request)
  if (declaredLength !== null && declaredLength > maximum) {
    throw requestSecurityError('body-too-large', 413)
  }

  const body = await readLimitedBody(request, maximum)
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body)
    return JSON.parse(text) as T
  } catch {
    throw requestSecurityError('invalid-body', 400)
  }
}

function firstValidIp(value: string | null): string | null {
  if (!value) return null
  const candidate = value.split(',', 1)[0]?.trim()
  return candidate && isIP(candidate) !== 0 ? candidate : null
}

/**
 * Resolve a client address only from a header replaced by Vercel's trusted
 * ingress. Local/test fallback exists solely to make request defenses testable;
 * generic non-Vercel production deployments deliberately return null.
 */
export function getTrustedClientIp(request: Request): string | null {
  if (process.env.VERCEL === '1') {
    return firstValidIp(request.headers.get('x-vercel-forwarded-for'))
  }

  if (process.env.NODE_ENV !== 'production') {
    return (
      firstValidIp(request.headers.get('x-forwarded-for')) ??
      firstValidIp(request.headers.get('x-real-ip'))
    )
  }

  return null
}

function hmacSecret(): Buffer {
  const secret = process.env.CONTACT_VERIFICATION_SECRET
  if (!secret || Buffer.byteLength(secret, 'utf8') < MINIMUM_HMAC_SECRET_BYTES) {
    throw new Error(
      `CONTACT_VERIFICATION_SECRET must contain at least ${MINIMUM_HMAC_SECRET_BYTES} bytes`,
    )
  }
  return Buffer.from(secret, 'utf8')
}

function opaqueIdentifier(kind: string, scope: string, value: string): string {
  const normalizedScope = scope.trim()
  if (!normalizedScope) throw new TypeError('scope is required')

  return createHmac('sha256', hmacSecret())
    .update('aetherisvision-request-security-v1\0', 'utf8')
    .update(kind, 'utf8')
    .update('\0', 'utf8')
    .update(normalizedScope, 'utf8')
    .update('\0', 'utf8')
    .update(value, 'utf8')
    .digest('base64url')
}

/** Return a non-reversible per-scope key; the raw address must never be stored. */
export function createOpaqueRateLimitKey(scope: string, clientIp: string | null): string {
  return opaqueIdentifier('rate-limit', scope, clientIp ?? 'no-trusted-client-ip')
}

/** Hash an abuse signal before it is used by logs, counters, or persistence. */
export function createOpaqueAbuseKey(scope: string, value: string): string {
  return opaqueIdentifier('abuse', scope, value)
}

/** Production public endpoints must not silently start without shared counters. */
export function assertDistributedRateLimitAvailable(): void {
  if (process.env.NODE_ENV === 'production' && !isRateLimitDistributed()) {
    throw requestSecurityError('rate-limit-unavailable', 503)
  }
}
