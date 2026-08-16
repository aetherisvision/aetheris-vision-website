import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { verifyTurnstileToken } from '@/lib/turnstile'

const SECRET = 'turnstile-test-secret'

function siteverifyResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('Turnstile server verification', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('TURNSTILE_SECRET_KEY', SECRET)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('accepts a successful response only for the expected action and hostname', async () => {
    fetchMock.mockResolvedValueOnce(
      siteverifyResponse({
        success: true,
        action: 'contact',
        hostname: 'AETHERISVISION.COM.',
      }),
    )

    await expect(
      verifyTurnstileToken({
        token: ' verified-token ',
        expectedAction: 'contact',
        expectedHostname: 'https://aetherisvision.com',
      }),
    ).resolves.toEqual({ ok: true })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const body = init.body as URLSearchParams
    expect(body.get('secret')).toBe(SECRET)
    expect(body.get('response')).toBe('verified-token')
    expect(body.has('remoteip')).toBe(false)
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('rejects missing and oversized tokens without making an outbound request', async () => {
    await expect(
      verifyTurnstileToken({
        token: '   ',
        expectedAction: 'contact',
        expectedHostname: 'aetherisvision.com',
      }),
    ).resolves.toEqual({ ok: false, reason: 'missing' })

    await expect(
      verifyTurnstileToken({
        token: 'x'.repeat(2049),
        expectedAction: 'contact',
        expectedHostname: 'aetherisvision.com',
      }),
    ).resolves.toEqual({ ok: false, reason: 'invalid' })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('checks success, action, and hostname independently', async () => {
    fetchMock
      .mockResolvedValueOnce(siteverifyResponse({ success: false }))
      .mockResolvedValueOnce(
        siteverifyResponse({ success: true, action: 'intake', hostname: 'aetherisvision.com' }),
      )
      .mockResolvedValueOnce(
        siteverifyResponse({ success: true, action: 'contact', hostname: 'evil.example' }),
      )

    const input = {
      token: 'token',
      expectedAction: 'contact' as const,
      expectedHostname: 'aetherisvision.com',
    }
    await expect(verifyTurnstileToken(input)).resolves.toEqual({ ok: false, reason: 'invalid' })
    await expect(verifyTurnstileToken(input)).resolves.toEqual({
      ok: false,
      reason: 'action-mismatch',
    })
    await expect(verifyTurnstileToken(input)).resolves.toEqual({
      ok: false,
      reason: 'hostname-mismatch',
    })
  })

  it('fails closed on provider, parsing, timeout, and configuration failures', async () => {
    fetchMock
      .mockResolvedValueOnce(siteverifyResponse({}, 503))
      .mockResolvedValueOnce(new Response('not-json', { status: 200 }))
      .mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }))

    const input = {
      token: 'token',
      expectedAction: 'review' as const,
      expectedHostname: 'aetherisvision.com',
    }
    await expect(verifyTurnstileToken(input)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    })
    await expect(verifyTurnstileToken(input)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    })
    await expect(verifyTurnstileToken(input)).resolves.toEqual({ ok: false, reason: 'timeout' })

    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    await expect(verifyTurnstileToken(input)).resolves.toEqual({
      ok: false,
      reason: 'misconfigured',
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    vi.stubEnv('TURNSTILE_SECRET_KEY', SECRET)
    await expect(
      verifyTurnstileToken({ ...input, expectedHostname: 'https://user@example.com' }),
    ).resolves.toEqual({ ok: false, reason: 'misconfigured' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
