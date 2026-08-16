import { createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  invoiceItemsCreate: vi.fn(),
  invoicesCreate: vi.fn(),
  invoicesFinalize: vi.fn(),
  invoicesRetrieve: vi.fn(),
  linkStripeInvoice: vi.fn(),
  markInvoiceNotificationSent: vi.fn(),
  reserveInvoiceNotification: vi.fn(),
  resendSend: vi.fn(),
  sql: vi.fn(),
}))

vi.mock('@/lib/crm', () => ({
  linkStripeInvoice: mocks.linkStripeInvoice,
  markInvoiceNotificationSent: mocks.markInvoiceNotificationSent,
  reserveInvoiceNotification: mocks.reserveInvoiceNotification,
}))
vi.mock('@/lib/db', () => ({ sql: mocks.sql }))
vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: { create: vi.fn() },
    invoiceItems: { create: mocks.invoiceItemsCreate },
    invoices: {
      create: mocks.invoicesCreate,
      finalizeInvoice: mocks.invoicesFinalize,
      retrieve: mocks.invoicesRetrieve,
    },
  },
}))
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mocks.resendSend }
  },
}))

const TEST_PASSPHRASE = 'invoice-delivery-contract-test'

function adminCookie(): string {
  const token = createHmac('sha256', TEST_PASSPHRASE)
    .update('admin-session')
    .digest('hex')
  return `av-admin-session=${token}`
}

function request(authenticated = true): NextRequest {
  return new NextRequest('http://localhost/api/admin/invoices/29/send', {
    method: 'POST',
    headers: authenticated ? { Cookie: adminCookie() } : {},
  })
}

function localInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 29,
    client_id: 4,
    project_id: 8,
    purpose: null,
    number: 'INV-202608-0042',
    description: 'Curated meteorological dataset',
    amount_cents: 125_000,
    status: 'draft',
    stripe_invoice_id: null,
    stripe_customer_id: 'cus_4',
    client_name: 'Example Research',
    client_email: 'billing@example.test',
    project_name: 'Data delivery',
    due_date: '2026-09-01',
    ...overrides,
  }
}

function remoteInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'in_29',
    customer: 'cus_4',
    metadata: { invoice_id: '29', client_id: '4', project_id: '8' },
    status: 'open',
    hosted_invoice_url: 'https://invoice.stripe.com/i/acct_test/in_29',
    ...overrides,
  }
}

describe('admin invoice delivery contract', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
    vi.stubEnv('RESEND_API_KEY', 're_test')
    mocks.linkStripeInvoice.mockResolvedValue({
      invoiceId: 29,
      projectId: 8,
      stripeInvoiceId: 'in_29',
    })
    mocks.reserveInvoiceNotification.mockResolvedValue({
      invoiceId: 29,
      idempotencyKey: 'av:invoice:29:notification:v1',
      notificationSentAt: null,
      reserved: true,
      shouldSend: true,
    })
    mocks.markInvoiceNotificationSent.mockResolvedValue({ invoiceId: 29 })
    mocks.resendSend.mockResolvedValue({ data: { id: 'email_29' }, error: null })
  })

  it('requires an admin session before reading an invoice', async () => {
    const { POST } = await import('@/app/api/admin/invoices/[id]/send/route')
    const response = await POST(request(false), {
      params: Promise.resolve({ id: '29' }),
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('creates, links, finalizes, and notifies with local-invoice idempotency keys', async () => {
    mocks.sql
      .mockResolvedValueOnce([{ status: 'sent' }])
      .mockResolvedValueOnce([localInvoice({ status: 'sent' })])
    mocks.invoicesCreate.mockResolvedValueOnce(remoteInvoice({
      status: 'draft',
      hosted_invoice_url: null,
    }))
    mocks.invoiceItemsCreate.mockResolvedValueOnce({ id: 'ii_29' })
    mocks.invoicesFinalize.mockResolvedValueOnce(remoteInvoice())

    const { POST } = await import('@/app/api/admin/invoices/[id]/send/route')
    const response = await POST(request(), {
      params: Promise.resolve({ id: '29' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(String(mocks.sql.mock.calls[0]?.[0])).toContain('UPDATE invoices')
    expect(String(mocks.sql.mock.calls[1]?.[0])).toContain('SELECT i.*')
    await expect(response.json()).resolves.toEqual({
      ok: true,
      invoice_url: 'https://invoice.stripe.com/i/acct_test/in_29',
      notification_sent: true,
    })
    expect(mocks.invoicesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_4',
        metadata: expect.objectContaining({ invoice_id: '29' }),
      }),
      { idempotencyKey: 'av:invoice:29:invoice' },
    )
    expect(mocks.invoiceItemsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice: 'in_29',
        amount: 125_000,
        metadata: { invoice_id: '29' },
      }),
      { idempotencyKey: 'av:invoice:29:item' },
    )
    expect(mocks.invoicesFinalize).toHaveBeenCalledWith(
      'in_29',
      {},
      { idempotencyKey: 'av:invoice:29:finalize' },
    )
    expect(mocks.linkStripeInvoice).toHaveBeenCalledTimes(2)
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'billing@example.test' }),
      { idempotencyKey: 'av:invoice:29:notification:v1' },
    )
    expect(mocks.markInvoiceNotificationSent).toHaveBeenCalledWith({
      invoiceId: 29,
      idempotencyKey: 'av:invoice:29:notification:v1',
    })
  })

  it('resumes the linked Stripe invoice without creating duplicate provider objects', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'sent' }])
      .mockResolvedValueOnce([localInvoice({ status: 'sent', stripe_invoice_id: 'in_29' })])
    mocks.invoicesRetrieve.mockResolvedValueOnce(remoteInvoice())
    mocks.reserveInvoiceNotification.mockResolvedValueOnce({
      invoiceId: 29,
      idempotencyKey: 'av:invoice:29:notification:v1',
      notificationSentAt: '2026-08-16T12:00:00.000Z',
      reserved: false,
      shouldSend: false,
    })

    const { POST } = await import('@/app/api/admin/invoices/[id]/send/route')
    const response = await POST(request(), {
      params: Promise.resolve({ id: '29' }),
    })

    expect(response.status).toBe(200)
    expect((await response.json()).notification_sent).toBe(true)
    expect(mocks.invoicesRetrieve).toHaveBeenCalledWith('in_29')
    expect(mocks.invoicesCreate).not.toHaveBeenCalled()
    expect(mocks.invoiceItemsCreate).not.toHaveBeenCalled()
    expect(mocks.invoicesFinalize).not.toHaveBeenCalled()
    expect(mocks.resendSend).not.toHaveBeenCalled()
    expect(mocks.markInvoiceNotificationSent).not.toHaveBeenCalled()
  })

  it('keeps a completed Stripe delivery successful when email must be retried', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'sent' }])
      .mockResolvedValueOnce([localInvoice({ status: 'sent', stripe_invoice_id: 'in_29' })])
    mocks.invoicesRetrieve.mockResolvedValueOnce(remoteInvoice())
    mocks.resendSend.mockResolvedValueOnce({ data: null, error: { message: 'Unavailable' } })

    const { POST } = await import('@/app/api/admin/invoices/[id]/send/route')
    const response = await POST(request(), {
      params: Promise.resolve({ id: '29' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      ok: true,
      notification_sent: false,
      warning: expect.any(String),
    }))
    expect(mocks.markInvoiceNotificationSent).not.toHaveBeenCalled()
  })

  it('rejects a linked Stripe invoice whose metadata identifies another invoice', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'sent' }])
      .mockResolvedValueOnce([localInvoice({ status: 'sent', stripe_invoice_id: 'in_29' })])
    mocks.invoicesRetrieve.mockResolvedValueOnce(remoteInvoice({
      metadata: { invoice_id: '30' },
    }))

    const { POST } = await import('@/app/api/admin/invoices/[id]/send/route')
    const response = await POST(request(), {
      params: Promise.resolve({ id: '29' }),
    })

    expect(response.status).toBe(409)
    expect(mocks.linkStripeInvoice).not.toHaveBeenCalled()
    expect(mocks.resendSend).not.toHaveBeenCalled()
  })

  it('does not deliver an invoice that is already paid', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'paid' }])

    const { POST } = await import('@/app/api/admin/invoices/[id]/send/route')
    const response = await POST(request(), {
      params: Promise.resolve({ id: '29' }),
    })

    expect(response.status).toBe(409)
    expect(mocks.invoicesCreate).not.toHaveBeenCalled()
    expect(mocks.invoicesRetrieve).not.toHaveBeenCalled()
  })
})
