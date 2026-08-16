import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  sql: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: mocks.sql }))
vi.mock('@/lib/stripe', () => ({
  stripe: { webhooks: { constructEvent: mocks.constructEvent } },
}))

function request(): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: '{}',
    headers: { 'stripe-signature': 'sig_test' },
  })
}

function event(type: string, invoiceId: string | undefined) {
  return {
    type,
    data: {
      object: {
        id: 'in_29',
        metadata: invoiceId === undefined ? {} : { invoice_id: invoiceId },
      },
    },
  }
}

describe('Stripe invoice webhook contract', () => {
  beforeEach(() => {
    mocks.constructEvent.mockReset()
    mocks.sql.mockReset()
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
  })

  it.each([undefined, '0', '-1', '1abc', '2147483648']) (
    'acknowledges an invalid local invoice id without touching the database (%s)',
    async (invoiceId) => {
      mocks.constructEvent.mockReturnValueOnce(event('invoice.paid', invoiceId))

      const { POST } = await import('@/app/api/webhooks/stripe/route')
      const response = await POST(request())

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(mocks.sql).not.toHaveBeenCalled()
    },
  )

  it('marks paid only when both the local id and remote Stripe id match', async () => {
    mocks.constructEvent.mockReturnValueOnce(event('invoice.paid', '29'))
    mocks.sql.mockResolvedValueOnce([])

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(request())

    expect(response.status).toBe(200)
    const query = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain('WHERE id =')
    expect(query).toContain('stripe_invoice_id =')
    expect(query).toContain('paid_at = COALESCE(paid_at, NOW())')
    expect(mocks.sql.mock.calls[0].slice(1)).toEqual([29, 'in_29'])
  })

  it('does not let payment failure downgrade paid or repeatedly update overdue', async () => {
    mocks.constructEvent.mockReturnValueOnce(event('invoice.payment_failed', '29'))
    mocks.sql.mockResolvedValueOnce([])

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(request())

    expect(response.status).toBe(200)
    const query = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain("status NOT IN ('paid', 'overdue')")
    expect(mocks.sql.mock.calls[0].slice(1)).toEqual([29, 'in_29'])
  })

  it('returns a retriable error when persistence fails', async () => {
    mocks.constructEvent.mockReturnValueOnce(event('invoice.paid', '29'))
    mocks.sql.mockRejectedValueOnce(new Error('database unavailable'))

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(request())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Unable to process Stripe event' })
  })

  it('rejects an invalid Stripe signature before querying', async () => {
    mocks.constructEvent.mockImplementationOnce(() => {
      throw new Error('invalid signature')
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(request())

    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mocks.sql).not.toHaveBeenCalled()
  })
})
