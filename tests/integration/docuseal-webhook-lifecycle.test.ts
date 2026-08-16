import { createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  allocateInvoiceNumber: vi.fn(),
  customersCreate: vi.fn(),
  downloadSignedPdf: vi.fn(),
  invoiceItemsCreate: vi.fn(),
  invoicesCreate: vi.fn(),
  invoicesFinalize: vi.fn(),
  invoicesRetrieve: vi.fn(),
  invoicesSend: vi.fn(),
  linkDepositInvoice: vi.fn(),
  markEngagementSigned: vi.fn(),
  markInvoiceNotificationSent: vi.fn(),
  resendSend: vi.fn(),
  reserveDepositInvoice: vi.fn(),
  reserveInvoiceNotification: vi.fn(),
  sql: vi.fn(),
}))

vi.mock('@/lib/crm', () => ({
  allocateInvoiceNumber: mocks.allocateInvoiceNumber,
  linkDepositInvoice: mocks.linkDepositInvoice,
  markEngagementSigned: mocks.markEngagementSigned,
  markInvoiceNotificationSent: mocks.markInvoiceNotificationSent,
  reserveDepositInvoice: mocks.reserveDepositInvoice,
  reserveInvoiceNotification: mocks.reserveInvoiceNotification,
}))
vi.mock('@/lib/db', () => ({ sql: mocks.sql }))
vi.mock('@/lib/docuseal', () => ({
  downloadSignedPdf: mocks.downloadSignedPdf,
}))
vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: { create: mocks.customersCreate },
    invoiceItems: { create: mocks.invoiceItemsCreate },
    invoices: {
      create: mocks.invoicesCreate,
      finalizeInvoice: mocks.invoicesFinalize,
      retrieve: mocks.invoicesRetrieve,
      sendInvoice: mocks.invoicesSend,
    },
  },
}))
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mocks.resendSend }
  },
}))

const WEBHOOK_SECRET = 'docuseal-webhook-contract-test'

function signedRequest(
  payload: unknown,
  options: { timestamp?: number; signature?: string } = {},
): NextRequest {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000))
  const digest = createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex')
  const signature = options.signature ?? `${timestamp}.${digest}`
  return new NextRequest('http://localhost/api/webhooks/docuseal', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'x-docuseal-signature': signature,
    },
  })
}

function completedPayload(submissionId = 'sub_123') {
  return {
    event_type: 'submission.completed',
    data: { id: submissionId },
  }
}

function baseProject(overrides: Record<string, unknown> = {}) {
  return {
    project_id: 73,
    project_name: 'Forecast modernization',
    project_status: 'proposal',
    has_signed_pdf: true,
    deposit_amount_cents: null,
    client_id: 19,
    client_name: 'Example Research',
    client_email: 'ada@example.com',
    contact_name: 'Ada Client',
    stripe_customer_id: 'cus_existing',
    pro_bono: false,
    ...overrides,
  }
}

function draftInvoice() {
  return {
    id: 'in_deposit',
    status: 'draft',
    hosted_invoice_url: null,
    due_date: null,
    lines: { data: [] },
  }
}

function openInvoice() {
  return {
    id: 'in_deposit',
    status: 'open',
    hosted_invoice_url: 'https://invoice.stripe.test/in_deposit',
    due_date: 1_787_001_600,
    lines: {
      data: [{ metadata: { local_invoice_id: '301' } }],
    },
  }
}

describe('DocuSeal signed-engagement webhook', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset()
    vi.stubEnv('DOCUSEAL_WEBHOOK_SECRET', WEBHOOK_SECRET)
    vi.stubEnv('RESEND_API_KEY', 're_test')

    mocks.allocateInvoiceNumber.mockResolvedValue('INV-202608-0001')
    mocks.linkDepositInvoice.mockResolvedValue({ invoiceId: 301 })
    mocks.markEngagementSigned.mockResolvedValue({ projectId: 73 })
    mocks.markInvoiceNotificationSent.mockResolvedValue({ invoiceId: 301 })
    mocks.resendSend.mockResolvedValue({ data: { id: 'email_1' }, error: null })
    mocks.reserveDepositInvoice.mockResolvedValue({
      invoiceId: 301,
      projectId: 73,
      clientId: 19,
      purpose: 'deposit',
      amountCents: 125_000,
      status: 'draft',
      stripeInvoiceId: null,
      created: true,
    })
    mocks.reserveInvoiceNotification.mockResolvedValue({
      invoiceId: 301,
      idempotencyKey: 'av-deposit-send-301-v1',
      notificationSentAt: null,
      reserved: true,
      shouldSend: true,
    })
  })

  it('stores the signed PDF and updates lifecycle without billing when no deposit is configured', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseProject({ has_signed_pdf: false })])
      .mockResolvedValueOnce([])
    mocks.downloadSignedPdf.mockResolvedValueOnce(Buffer.from('signed-pdf'))

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(signedRequest(completedPayload()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ received: true })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mocks.downloadSignedPdf).toHaveBeenCalledWith('sub_123')
    expect(mocks.markEngagementSigned).toHaveBeenCalledWith({
      projectId: 73,
      docusealSubmissionId: 'sub_123',
    })
    expect(mocks.reserveDepositInvoice).not.toHaveBeenCalled()
    expect(mocks.invoicesCreate).not.toHaveBeenCalled()
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'SOW Signed — Example Research' }),
      { idempotencyKey: 'docuseal-completed-sub_123' },
    )
  })

  it('bills exactly the explicit project deposit through the reserved local invoice', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseProject({ deposit_amount_cents: 125_000 })])
      .mockResolvedValueOnce([])
    mocks.invoicesCreate.mockResolvedValueOnce(draftInvoice())
    mocks.invoiceItemsCreate.mockResolvedValueOnce({ id: 'ii_deposit' })
    mocks.invoicesFinalize.mockResolvedValueOnce(openInvoice())
    mocks.invoicesSend.mockResolvedValueOnce(openInvoice())

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(signedRequest(completedPayload()))

    expect(response.status).toBe(200)
    expect(mocks.reserveDepositInvoice).toHaveBeenCalledWith({
      projectId: 73,
      invoiceNumber: 'INV-202608-0001',
      amountCents: 125_000,
      description: 'Forecast modernization — Project deposit',
    })
    expect(mocks.invoiceItemsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice: 'in_deposit',
        amount: 125_000,
        currency: 'usd',
      }),
      { idempotencyKey: 'av-deposit-item-301-v1' },
    )
    expect(mocks.invoicesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing',
        auto_advance: false,
        pending_invoice_items_behavior: 'exclude',
        metadata: expect.objectContaining({ invoice_id: '301', purpose: 'deposit' }),
      }),
      { idempotencyKey: 'av-deposit-invoice-301-v1' },
    )
    expect(mocks.invoicesSend).toHaveBeenCalledWith(
      'in_deposit',
      {},
      { idempotencyKey: 'av-deposit-send-301-v1' },
    )
    expect(mocks.markInvoiceNotificationSent).toHaveBeenCalledWith({
      invoiceId: 301,
      idempotencyKey: 'av-deposit-send-301-v1',
    })

    const projectQuery = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(projectQuery).toContain('p.deposit_amount_cents')
    expect(projectQuery).not.toContain('budget_range')
  })

  it('recovers the same linked invoice on a webhook retry without recreating or resending it', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseProject({ deposit_amount_cents: 125_000 })])
      .mockResolvedValueOnce([])
    mocks.reserveDepositInvoice.mockResolvedValueOnce({
      invoiceId: 301,
      projectId: 73,
      clientId: 19,
      purpose: 'deposit',
      amountCents: 125_000,
      status: 'sent',
      stripeInvoiceId: 'in_deposit',
      created: false,
    })
    mocks.invoicesRetrieve.mockResolvedValueOnce(openInvoice())
    mocks.reserveInvoiceNotification.mockResolvedValueOnce({
      invoiceId: 301,
      idempotencyKey: 'av-deposit-send-301-v1',
      notificationSentAt: '2026-08-16T12:00:00.000Z',
      reserved: false,
      shouldSend: false,
    })

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(signedRequest(completedPayload()))

    expect(response.status).toBe(200)
    expect(mocks.markEngagementSigned).toHaveBeenCalledTimes(1)
    expect(mocks.invoicesRetrieve).toHaveBeenCalledWith('in_deposit')
    expect(mocks.invoicesCreate).not.toHaveBeenCalled()
    expect(mocks.invoiceItemsCreate).not.toHaveBeenCalled()
    expect(mocks.invoicesFinalize).not.toHaveBeenCalled()
    expect(mocks.invoicesSend).not.toHaveBeenCalled()
    expect(mocks.markInvoiceNotificationSent).not.toHaveBeenCalled()
  })

  it('does not bill an explicitly pro bono engagement', async () => {
    mocks.sql.mockResolvedValueOnce([
      baseProject({ deposit_amount_cents: 125_000, pro_bono: true }),
    ])

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(signedRequest(completedPayload()))

    expect(response.status).toBe(200)
    expect(mocks.markEngagementSigned).toHaveBeenCalledTimes(1)
    expect(mocks.allocateInvoiceNumber).not.toHaveBeenCalled()
    expect(mocks.reserveDepositInvoice).not.toHaveBeenCalled()
    expect(mocks.invoicesCreate).not.toHaveBeenCalled()
  })

  it('acknowledges a late completion for a canceled project without reviving it', async () => {
    mocks.sql.mockResolvedValueOnce([
      baseProject({ project_status: 'canceled', deposit_amount_cents: 125_000 }),
    ])

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(signedRequest(completedPayload()))

    expect(response.status).toBe(200)
    expect(mocks.downloadSignedPdf).not.toHaveBeenCalled()
    expect(mocks.markEngagementSigned).not.toHaveBeenCalled()
    expect(mocks.reserveDepositInvoice).not.toHaveBeenCalled()
  })

  it('returns a controlled error for malformed but correctly signed JSON', async () => {
    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(signedRequest('{'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON' })
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('rejects the legacy untimestamped signature contract', async () => {
    const payload = completedPayload()
    const body = JSON.stringify(payload)
    const legacySignature = createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(signedRequest(payload, { signature: legacySignature }))

    expect(response.status).toBe(401)
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('rejects a correctly signed webhook outside the five-minute replay window', async () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 301

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(
      signedRequest(completedPayload(), { timestamp: staleTimestamp }),
    )

    expect(response.status).toBe(401)
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('rejects a correctly signed webhook too far in the future', async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 301

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(
      signedRequest(completedPayload(), { timestamp: futureTimestamp }),
    )

    expect(response.status).toBe(401)
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('rejects the obsolete submission envelope even when correctly signed', async () => {
    const legacyPayload = {
      event_type: 'submission.completed',
      submission: { id: 'sub_123' },
    }

    const { POST } = await import('@/app/api/webhooks/docuseal/route')
    const response = await POST(signedRequest(legacyPayload))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid submission' })
    expect(mocks.sql).not.toHaveBeenCalled()
  })
})
