import { NextRequest } from 'next/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createReviewMock,
  ensureReviewsTableMock,
  getApprovedReviewsMock,
  rateLimitMock,
  sendMock,
  verifyTurnstileTokenMock,
} = vi.hoisted(() => ({
  createReviewMock: vi.fn(),
  ensureReviewsTableMock: vi.fn(),
  getApprovedReviewsMock: vi.fn(),
  rateLimitMock: vi.fn(),
  sendMock: vi.fn(),
  verifyTurnstileTokenMock: vi.fn(),
}))

vi.mock('@/lib/db/reviews', () => ({
  createReview: createReviewMock,
  ensureReviewsTable: ensureReviewsTableMock,
  getApprovedReviews: getApprovedReviewsMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: rateLimitMock,
  isRateLimitDistributed: () => false,
}))

vi.mock('@/lib/turnstile', () => ({
  TURNSTILE_ACTIONS: { contact: 'contact', intake: 'intake', review: 'review' },
  verifyTurnstileToken: verifyTurnstileTokenMock,
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

let GET: (request: NextRequest) => Promise<Response>
let POST: (request: NextRequest) => Promise<Response>

function postRequest(
  payload: Record<string, unknown> | string,
  headers: Record<string, string> = {},
) {
  return new NextRequest('http://localhost:3000/api/reviews', {
    method: 'POST',
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    headers: {
      Origin: 'http://localhost:3000',
      'Content-Type': 'application/json',
      'x-forwarded-for': '198.51.100.12',
      ...headers,
    },
  })
}

function validPayload() {
  return {
    client_name: 'Alex Client',
    client_role: 'Director',
    client_company: 'Example Agency',
    rating: 5,
    body: 'Aetheris Vision delivered careful, timely work for our project.',
    turnstileToken: 'verified-token',
    _gotcha: '',
  }
}

describe('/api/reviews', () => {
  beforeAll(async () => {
    vi.stubEnv('CONTACT_VERIFICATION_SECRET', 'a-test-secret-with-at-least-32-bytes-long')
    const route = await import('@/app/api/reviews/route')
    GET = route.GET
    POST = route.POST
  })

  beforeEach(() => {
    createReviewMock.mockReset()
    ensureReviewsTableMock.mockReset()
    getApprovedReviewsMock.mockReset()
    rateLimitMock.mockReset()
    sendMock.mockReset()
    verifyTurnstileTokenMock.mockReset()

    ensureReviewsTableMock.mockResolvedValue(undefined)
    createReviewMock.mockResolvedValue({ id: 99 })
    getApprovedReviewsMock.mockResolvedValue([])
    rateLimitMock.mockResolvedValue({ success: true, remaining: 2, retryAfterSeconds: 0 })
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null })
    verifyTurnstileTokenMock.mockResolvedValue({ ok: true })
  })

  it('requires same-origin JSON submissions with a bounded body', async () => {
    const crossSite = await POST(postRequest(validPayload(), { Origin: 'https://attacker.test' }))
    expect(crossSite.status).toBe(403)

    const wrongType = await POST(postRequest(validPayload(), { 'Content-Type': 'text/plain' }))
    expect(wrongType.status).toBe(415)

    const oversized = await POST(postRequest({ ...validPayload(), padding: 'x'.repeat(25 * 1024) }))
    expect(oversized.status).toBe(413)
    expect(createReviewMock).not.toHaveBeenCalled()
  })

  it('silently discards honeypot submissions without verification or persistence', async () => {
    const response = await POST(postRequest({ ...validPayload(), _gotcha: 'https://spam.test' }))

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ ok: true })
    expect(verifyTurnstileTokenMock).not.toHaveBeenCalled()
    expect(createReviewMock).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects failed Turnstile verification before persistence', async () => {
    verifyTurnstileTokenMock.mockResolvedValueOnce({ ok: false, reason: 'action-mismatch' })

    const response = await POST(postRequest(validPayload()))

    expect(response.status).toBe(400)
    expect(createReviewMock).not.toHaveBeenCalled()
    expect(verifyTurnstileTokenMock).toHaveBeenCalledWith(expect.objectContaining({
      token: 'verified-token',
      expectedAction: 'review',
    }))
    expect(verifyTurnstileTokenMock.mock.calls[0][0]).not.toHaveProperty('remoteIp')
  })

  it('fails closed when the verification service is unavailable', async () => {
    verifyTurnstileTokenMock.mockResolvedValueOnce({ ok: false, reason: 'timeout' })

    const response = await POST(postRequest(validPayload()))

    expect(response.status).toBe(503)
    expect(createReviewMock).not.toHaveBeenCalled()
  })

  it('stores a verified review without exposing its internal record', async () => {
    const response = await POST(postRequest(validPayload()))

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ ok: true })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(createReviewMock).toHaveBeenCalledWith({
      client_name: 'Alex Client',
      client_role: 'Director',
      client_company: 'Example Agency',
      rating: 5,
      body: 'Aetheris Vision delivered careful, timely work for our project.',
    })

    const email = sendMock.mock.calls[0][0]
    expect(email.subject).toBe('New client review awaiting approval')
    expect(email.subject).not.toContain('Alex Client')
    expect(email.to).toHaveLength(1)

    const rateIdentifier = rateLimitMock.mock.calls[0][0]
    expect(rateIdentifier).not.toContain('198.51.100.12')
  })

  it('returns only display fields from the approved public review feed', async () => {
    getApprovedReviewsMock.mockResolvedValueOnce([
      {
        id: 1,
        client_name: 'Taylor',
        client_role: null,
        client_company: 'Client Co',
        rating: 4,
        body: 'A sufficiently detailed and approved client review.',
        approved: true,
        created_at: '2026-08-16T00:00:00.000Z',
      },
    ])
    const request = new NextRequest('http://localhost:3000/api/reviews', {
      headers: { 'x-forwarded-for': '198.51.100.13' },
    })

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      reviews: [{
        client_name: 'Taylor',
        client_role: null,
        client_company: 'Client Co',
        rating: 4,
        body: 'A sufficiently detailed and approved client review.',
      }],
    })
  })

  it('returns Retry-After when review access is rate limited', async () => {
    rateLimitMock.mockResolvedValueOnce({ success: false, remaining: 0, retryAfterSeconds: 45 })
    const response = await POST(postRequest(validPayload()))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('45')
    expect(verifyTurnstileTokenMock).not.toHaveBeenCalled()
  })
})
