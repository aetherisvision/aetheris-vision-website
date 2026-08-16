import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rateLimitMock } = vi.hoisted(() => ({ rateLimitMock: vi.fn() }))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: rateLimitMock,
  isRateLimitDistributed: () => false,
}))

function request(query: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000/api/places?${query}`, {
    headers: {
      'x-forwarded-for': '203.0.113.9',
      ...headers,
    },
  })
}

describe('GET /api/places', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('CONTACT_VERIFICATION_SECRET', 'a-test-secret-with-at-least-32-bytes-long')
    rateLimitMock.mockReset()
    rateLimitMock.mockResolvedValue({ success: true, remaining: 29, retryAfterSeconds: 0 })
  })

  it('uses an opaque rate-limit key and a bounded, non-identifying upstream request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            display_name: 'Oklahoma City, Oklahoma, United States',
            address: {
              city: 'Oklahoma City',
              state: 'Oklahoma',
              country_code: 'us',
              'ISO3166-2-lvl4': 'US-OK',
            },
          },
          {
            display_name: 'Oklahoma City duplicate',
            address: {
              city: 'Oklahoma City',
              state: 'Oklahoma',
              country_code: 'us',
              'ISO3166-2-lvl4': 'US-OK',
            },
          },
        ]),
        { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
      ),
    )
    const { GET } = await import('@/app/api/places/route')

    const response = await GET(request('q=Oklahoma%20City'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ short: 'Oklahoma City, OK' }])
    expect(response.headers.get('cache-control')).toBe('no-store')
    const identifier = rateLimitMock.mock.calls[0][0]
    expect(identifier).not.toContain('203.0.113.9')
    expect(identifier).toMatch(/^[A-Za-z0-9_-]{40,}$/)

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/^https:\/\/nominatim\.openstreetmap\.org\/search\?/)
    expect(String(url)).toContain('q=Oklahoma+City')
    expect(init?.headers).not.toEqual(expect.objectContaining({
      'User-Agent': expect.stringContaining('@'),
    }))
    expect(init?.cache).toBe('no-store')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('rejects cross-site, duplicate, unknown, and oversized queries before lookup', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const { GET } = await import('@/app/api/places/route')

    const responses = await Promise.all([
      GET(request('q=Norman', { 'sec-fetch-site': 'cross-site' })),
      GET(request('q=Norman&q=Moore')),
      GET(request('q=Norman&limit=100')),
      GET(request(`q=${'a'.repeat(101)}`)),
    ])

    expect(responses.map((response) => response.status)).toEqual([403, 400, 400, 400])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns Retry-After when the distributed limiter denies a search', async () => {
    rateLimitMock.mockResolvedValueOnce({ success: false, remaining: 0, retryAfterSeconds: 37 })
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const { GET } = await import('@/app/api/places/route')

    const response = await GET(request('q=Norman'))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('37')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('discards oversized, malformed, and invalid upstream responses', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const { GET } = await import('@/app/api/places/route')

    fetchMock.mockResolvedValueOnce(
      new Response('x'.repeat(256 * 1024 + 1), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const oversized = await GET(request('q=Edmond'))
    expect(await oversized.json()).toEqual([])

    fetchMock.mockResolvedValueOnce(
      new Response('{malformed', { headers: { 'Content-Type': 'application/json' } }),
    )
    const malformed = await GET(request('q=Yukon'))
    expect(await malformed.json()).toEqual([])

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([
        { display_name: 'Invalid place', address: { city: 123 } },
        { display_name: 'Stillwater, Oklahoma', address: { city: 'Stillwater', state: 'Oklahoma' } },
      ]), { headers: { 'Content-Type': 'application/json' } }),
    )
    const invalidObject = await GET(request('q=Stillwater'))
    expect(await invalidObject.json()).toEqual([{ short: 'Stillwater, Oklahoma' }])
  })
})
