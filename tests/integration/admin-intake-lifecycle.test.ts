import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  buildSignatureBlock: vi.fn(),
  downloadSignedPdf: vi.fn(),
  getSubmission: vi.fn(),
  isAdmin: vi.fn(),
  markEngagementSigned: vi.fn(),
  markProposalSent: vi.fn(),
  isRetrySafeDocuSealError: vi.fn(),
  sendForSigning: vi.fn(),
  sql: vi.fn(),
}))

vi.mock('@/lib/admin-auth', () => ({
  isAdmin: mocks.isAdmin,
  unauthorizedResponse: () =>
    NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    ),
}))
vi.mock('@/lib/crm', () => ({
  markEngagementSigned: mocks.markEngagementSigned,
  markProposalSent: mocks.markProposalSent,
}))
vi.mock('@/lib/db', () => ({ sql: mocks.sql }))
vi.mock('@/lib/docuseal', () => ({
  buildSignatureBlock: mocks.buildSignatureBlock,
  downloadSignedPdf: mocks.downloadSignedPdf,
  getSubmission: mocks.getSubmission,
  isRetrySafeDocuSealError: mocks.isRetrySafeDocuSealError,
  sendForSigning: mocks.sendForSigning,
}))

function jsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function baseIntake(overrides: Record<string, unknown> = {}) {
  return {
    intake_id: 41,
    company_name: 'Example Research',
    contact_name: 'Ada Client',
    contact_email: 'ada@example.com',
    project_id: 73,
    project_status: 'proposal',
    docuseal_submission_id: null,
    proposal_sent_at: null,
    ...overrides,
  }
}

describe('admin intake lifecycle routes', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset()
    mocks.isAdmin.mockReturnValue(true)
    mocks.buildSignatureBlock.mockReturnValue('<signature-field></signature-field>')
    mocks.markEngagementSigned.mockResolvedValue({ projectId: 73 })
    mocks.markProposalSent.mockResolvedValue({ projectId: 73 })
    mocks.isRetrySafeDocuSealError.mockReturnValue(false)
  })

  it('reserves a proposal send, escapes draft HTML, and records the lifecycle result', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseIntake()])
      .mockResolvedValueOnce([{ proposal_sent_at: '2026-08-16T12:00:00.000Z' }])
      .mockResolvedValueOnce([])
    mocks.sendForSigning.mockResolvedValueOnce([{ submission_id: 'sub_123' }])

    const { POST } = await import(
      '@/app/api/admin/intake/send-for-signature/route'
    )
    const response = await POST(
      jsonRequest('/api/admin/intake/send-for-signature', {
        intake_id: 41,
        sow_content: '# Scope\n\n<script>alert("x")</script>',
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      submission_id: 'sub_123',
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mocks.sendForSigning).toHaveBeenCalledTimes(1)
    const sendInput = mocks.sendForSigning.mock.calls[0][0]
    expect(sendInput.html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    expect(sendInput.html).not.toContain('<script>')
    expect(mocks.markProposalSent).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 73,
        docusealSubmissionId: 'sub_123',
      }),
    )
    expect(mocks.sql).toHaveBeenCalledTimes(3)
  })

  it('repairs an existing DocuSeal send without creating a duplicate submission', async () => {
    mocks.sql
      .mockResolvedValueOnce([
        baseIntake({
          docuseal_submission_id: 'sub_existing',
          proposal_sent_at: '2026-08-15T18:00:00.000Z',
        }),
      ])
      .mockResolvedValueOnce([])

    const { POST } = await import(
      '@/app/api/admin/intake/send-for-signature/route'
    )
    const response = await POST(
      jsonRequest('/api/admin/intake/send-for-signature', {
        intake_id: 41,
        sow_content: 'Scope',
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      already_sent: true,
      submission_id: 'sub_existing',
    })
    expect(mocks.sendForSigning).not.toHaveBeenCalled()
    expect(mocks.markProposalSent).toHaveBeenCalledWith({
      projectId: 73,
      docusealSubmissionId: 'sub_existing',
      sentAt: '2026-08-15T18:00:00.000Z',
    })
  })

  it('does not send when another request already holds the durable reservation', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseIntake()])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          docuseal_submission_id: null,
          proposal_sent_at: '2026-08-16T12:00:00.000Z',
        },
      ])

    const { POST } = await import(
      '@/app/api/admin/intake/send-for-signature/route'
    )
    const response = await POST(
      jsonRequest('/api/admin/intake/send-for-signature', {
        intake_id: 41,
        sow_content: 'Scope',
      }),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'A signature request may already exist. Verify DocuSeal before trying again.',
      reconciliation_required: true,
    })
    expect(mocks.sendForSigning).not.toHaveBeenCalled()
    expect(mocks.markProposalSent).not.toHaveBeenCalled()
  })

  it('releases its reservation after a definitive DocuSeal rejection', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseIntake()])
      .mockResolvedValueOnce([{ proposal_sent_at: '2026-08-16T12:00:00.000Z' }])
      .mockResolvedValueOnce([{ id: 73 }])
    mocks.sendForSigning.mockRejectedValueOnce(new Error('rejected'))
    mocks.isRetrySafeDocuSealError.mockReturnValueOnce(true)

    const { POST } = await import(
      '@/app/api/admin/intake/send-for-signature/route'
    )
    const response = await POST(
      jsonRequest('/api/admin/intake/send-for-signature', {
        intake_id: 41,
        sow_content: 'Scope',
      }),
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'DocuSeal rejected the signature request. Review the document and try again.',
      retryable: true,
    })
    expect(mocks.sql).toHaveBeenCalledTimes(3)
    expect(mocks.markProposalSent).not.toHaveBeenCalled()
  })

  it('retains its reservation when the DocuSeal outcome is ambiguous', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseIntake()])
      .mockResolvedValueOnce([{ proposal_sent_at: '2026-08-16T12:00:00.000Z' }])
    mocks.sendForSigning.mockRejectedValueOnce(new TypeError('network failure'))

    const { POST } = await import(
      '@/app/api/admin/intake/send-for-signature/route'
    )
    const response = await POST(
      jsonRequest('/api/admin/intake/send-for-signature', {
        intake_id: 41,
        sow_content: 'Scope',
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'The signature request could not be confirmed. Verify DocuSeal before trying again.',
      reconciliation_required: true,
    })
    expect(mocks.sql).toHaveBeenCalledTimes(2)
    expect(mocks.markProposalSent).not.toHaveBeenCalled()
  })

  it('returns the provider submission ID when lifecycle persistence fails', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseIntake()])
      .mockResolvedValueOnce([{ proposal_sent_at: '2026-08-16T12:00:00.000Z' }])
    mocks.sendForSigning.mockResolvedValueOnce([{ submission_id: 'sub_reconcile' }])
    mocks.markProposalSent.mockRejectedValueOnce(new Error('database unavailable'))

    const { POST } = await import(
      '@/app/api/admin/intake/send-for-signature/route'
    )
    const response = await POST(
      jsonRequest('/api/admin/intake/send-for-signature', {
        intake_id: 41,
        sow_content: 'Scope',
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'The signature request was created but could not be recorded. Reconcile it before trying again.',
      submission_id: 'sub_reconcile',
      reconciliation_required: true,
    })
    expect(mocks.sql).toHaveBeenCalledTimes(2)
  })

  it('retains its reservation when DocuSeal omits the submission ID', async () => {
    mocks.sql
      .mockResolvedValueOnce([baseIntake()])
      .mockResolvedValueOnce([{ proposal_sent_at: '2026-08-16T12:00:00.000Z' }])
    mocks.sendForSigning.mockResolvedValueOnce({ status: 'accepted' })

    const { POST } = await import(
      '@/app/api/admin/intake/send-for-signature/route'
    )
    const response = await POST(
      jsonRequest('/api/admin/intake/send-for-signature', {
        intake_id: 41,
        sow_content: 'Scope',
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      reconciliation_required: true,
    })
    expect(mocks.sql).toHaveBeenCalledTimes(2)
    expect(mocks.markProposalSent).not.toHaveBeenCalled()
  })

  it('rejects malformed send JSON before querying the database', async () => {
    const { POST } = await import(
      '@/app/api/admin/intake/send-for-signature/route'
    )
    const response = await POST(
      new NextRequest('http://localhost/api/admin/intake/send-for-signature', {
        method: 'POST',
        body: '{',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    expect(response.status).toBe(400)
    expect(mocks.sql).not.toHaveBeenCalled()
    expect(mocks.sendForSigning).not.toHaveBeenCalled()
  })

  it('rejects a manual won transition because signing owns that state', async () => {
    const { PATCH } = await import('@/app/api/admin/intake/route')
    const response = await PATCH(
      new NextRequest('http://localhost/api/admin/intake', {
        method: 'PATCH',
        body: JSON.stringify({ id: 41, status: 'won' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    expect(response.status).toBe(409)
    expect((await response.json()).error).toContain('automatically')
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('rejects manual won even when the request also contains another editable field', async () => {
    const { PATCH } = await import('@/app/api/admin/intake/route')
    const response = await PATCH(
      new NextRequest('http://localhost/api/admin/intake', {
        method: 'PATCH',
        body: JSON.stringify({ id: 41, status: 'won', pro_bono: true }),
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    expect(response.status).toBe(409)
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('uses polling to repair a completed signed engagement idempotently', async () => {
    const submission = { id: 41, status: 'won' }
    mocks.sql
      .mockResolvedValueOnce([
        {
          project_id: 73,
          docuseal_submission_id: 'sub_123',
          has_signed_pdf: false,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([submission])
    mocks.getSubmission.mockResolvedValueOnce({ status: 'completed' })
    mocks.downloadSignedPdf.mockResolvedValueOnce(Buffer.from('signed-pdf'))

    const { GET } = await import('@/app/api/admin/intake/route')
    const response = await GET(
      new NextRequest('http://localhost/api/admin/intake'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ submissions: [submission] })
    expect(mocks.downloadSignedPdf).toHaveBeenCalledWith('sub_123')
    expect(mocks.markEngagementSigned).toHaveBeenCalledWith({
      projectId: 73,
      docusealSubmissionId: 'sub_123',
    })
    expect(mocks.sql).toHaveBeenCalledTimes(3)
  })
})
