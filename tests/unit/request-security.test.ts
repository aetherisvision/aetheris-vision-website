import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { distributedMock } = vi.hoisted(() => ({ distributedMock: vi.fn() }))

vi.mock('@/lib/rate-limit', () => ({
  isRateLimitDistributed: distributedMock,
}))

import {
  assertDistributedRateLimitAvailable,
  assertSameOrigin,
  createOpaqueAbuseKey,
  createOpaqueRateLimitKey,
  getTrustedClientIp,
  readJsonBody,
} from '@/lib/request-security'

const LONG_SECRET = 'request-security-test-secret-that-is-at-least-32-bytes'

function request(
  body: BodyInit | null = JSON.stringify({ ok: true }),
  headers: Record<string, string> = {},
): Request {
  return new Request('https://aetherisvision.com/api/contact', {
    method: 'POST',
    body,
    headers: {
      origin: 'https://aetherisvision.com',
      'content-type': 'application/json',
      ...headers,
    },
  })
}

describe('request security helpers', () => {
  beforeEach(() => {
    vi.stubEnv('CONTACT_VERIFICATION_SECRET', LONG_SECRET)
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('VERCEL', '')
    distributedMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts only an exact same-origin browser mutation', () => {
    expect(() =>
      assertSameOrigin(request(null, { 'sec-fetch-site': 'same-origin' })),
    ).not.toThrow()

    for (const origin of ['', 'https://evil.example', 'https://aetherisvision.com.evil.example']) {
      const candidate = request(null, origin ? { origin } : { origin: '' })
      expect(() => assertSameOrigin(candidate)).toThrowError(
        expect.objectContaining({ code: 'invalid-origin', status: 403 }),
      )
    }

    expect(() =>
      assertSameOrigin(request(null, { 'sec-fetch-site': 'cross-site' })),
    ).toThrowError(expect.objectContaining({ code: 'invalid-origin', status: 403 }))
  })

  it('parses JSON only within the declared and streamed byte limit', async () => {
    await expect(readJsonBody<{ ok: boolean }>(request(), 64)).resolves.toEqual({ ok: true })

    await expect(
      readJsonBody(request('{}', { 'content-type': 'text/plain' }), 64),
    ).rejects.toMatchObject({ code: 'invalid-content-type', status: 415 })

    await expect(
      readJsonBody(request('{}', { 'content-length': '100' }), 64),
    ).rejects.toMatchObject({ code: 'body-too-large', status: 413 })

    await expect(readJsonBody(request(JSON.stringify({ value: 'x'.repeat(80) })), 64)).rejects
      .toMatchObject({ code: 'body-too-large', status: 413 })

    await expect(readJsonBody(request('{'), 64)).rejects.toMatchObject({
      code: 'invalid-body',
      status: 400,
    })
    await expect(readJsonBody(request('{}'), 0)).rejects.toThrow(TypeError)
  })

  it('trusts only the Vercel-replaced address header in production', () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('NODE_ENV', 'production')
    const vercelRequest = request(null, {
      'x-vercel-forwarded-for': '203.0.113.7, 10.0.0.1',
      'x-forwarded-for': '198.51.100.44',
    })
    expect(getTrustedClientIp(vercelRequest)).toBe('203.0.113.7')

    vi.stubEnv('VERCEL', '')
    expect(getTrustedClientIp(vercelRequest)).toBeNull()

    vi.stubEnv('NODE_ENV', 'test')
    expect(getTrustedClientIp(vercelRequest)).toBe('198.51.100.44')
    expect(getTrustedClientIp(request(null, { 'x-forwarded-for': 'not-an-ip' }))).toBeNull()
  })

  it('creates stable, scoped, non-reversible identifiers', () => {
    const first = createOpaqueRateLimitKey('contact', '203.0.113.7')
    expect(first).toBe(createOpaqueRateLimitKey('contact', '203.0.113.7'))
    expect(first).not.toBe(createOpaqueRateLimitKey('intake', '203.0.113.7'))
    expect(first).not.toContain('203.0.113.7')
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/)

    const abuse = createOpaqueAbuseKey('email', 'person@example.com')
    expect(abuse).not.toBe(first)
    expect(abuse).not.toContain('person@example.com')

    vi.stubEnv('CONTACT_VERIFICATION_SECRET', 'too-short')
    expect(() => createOpaqueRateLimitKey('contact', null)).toThrow(/at least 32 bytes/)
  })

  it('fails closed when production has no distributed rate limiter', () => {
    vi.stubEnv('NODE_ENV', 'production')
    distributedMock.mockReturnValue(false)
    expect(() => assertDistributedRateLimitAvailable()).toThrowError(
      expect.objectContaining({ code: 'rate-limit-unavailable', status: 503 }),
    )

    distributedMock.mockReturnValue(true)
    expect(() => assertDistributedRateLimitAvailable()).not.toThrow()

    vi.stubEnv('NODE_ENV', 'development')
    distributedMock.mockReturnValue(false)
    expect(() => assertDistributedRateLimitAvailable()).not.toThrow()
  })
})
