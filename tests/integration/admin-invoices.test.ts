import { mintAdminSessionToken } from '../helpers/admin-session'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  allocateInvoiceNumber: vi.fn(),
  sql: vi.fn(),
}))

vi.mock('@/lib/crm', () => ({
  allocateInvoiceNumber: mocks.allocateInvoiceNumber,
}))
vi.mock('@/lib/db', () => ({ sql: mocks.sql }))

const TEST_PASSPHRASE = 'admin-invoice-contract-test'

function adminCookie(): string {
  const token = mintAdminSessionToken(TEST_PASSPHRASE)
  return `av-admin-session=${token}`
}

function request(
  path: string,
  method: string,
  body?: unknown,
  authenticated = true,
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(authenticated ? { Cookie: adminCookie() } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
  })
}

describe('admin invoice contracts', () => {
  beforeEach(() => {
    mocks.allocateInvoiceNumber.mockReset()
    mocks.sql.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('rejects unauthenticated reads without querying and prevents caching', async () => {
    const { GET } = await import('@/app/api/admin/invoices/route')
    const response = await GET(request('/api/admin/invoices', 'GET', undefined, false))

    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it.each([
    [{ client_id: 4, description: 'Analysis', amount_cents: 5000, status: 'sent' }, 'Unknown field'],
    [{ client_id: '4', description: 'Analysis', amount_cents: 5000 }, 'client_id'],
    [{ client_id: 4, project_id: 0, description: 'Analysis', amount_cents: 5000 }, 'project_id'],
    [{ client_id: 4, description: ' ', amount_cents: 5000 }, 'description'],
    [{ client_id: 4, description: 'Analysis', amount_cents: 4.5 }, 'amount_cents'],
    [{ client_id: 4, description: 'Analysis', amount_cents: 5000, due_date: '2026-02-30' }, 'due_date'],
  ])('rejects an invalid create payload before allocating a number %#', async (body, message) => {
    const { POST } = await import('@/app/api/admin/invoices/route')
    const response = await POST(request('/api/admin/invoices', 'POST', body))

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain(message)
    expect(mocks.sql).not.toHaveBeenCalled()
    expect(mocks.allocateInvoiceNumber).not.toHaveBeenCalled()
  })

  it('rejects a project belonging to another client before allocating a number', async () => {
    mocks.sql.mockResolvedValueOnce([{ client_exists: true, project_matches_client: false }])

    const { POST } = await import('@/app/api/admin/invoices/route')
    const response = await POST(request('/api/admin/invoices', 'POST', {
      client_id: 4,
      project_id: 8,
      description: 'Analysis',
      amount_cents: 5000,
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Project does not belong to the selected client',
    })
    expect(mocks.allocateInvoiceNumber).not.toHaveBeenCalled()
  })

  it('uses the allocated number only after validating client and project ownership', async () => {
    const invoice = { id: 29, number: 'INV-202608-0042', status: 'draft' }
    mocks.sql
      .mockResolvedValueOnce([{ client_exists: true, project_matches_client: true }])
      .mockResolvedValueOnce([invoice])
    mocks.allocateInvoiceNumber.mockResolvedValueOnce('INV-202608-0042')

    const { POST } = await import('@/app/api/admin/invoices/route')
    const response = await POST(request('/api/admin/invoices', 'POST', {
      client_id: 4,
      project_id: 8,
      description: '  Curated dataset  ',
      amount_cents: 125_000,
      due_date: '2026-09-01',
    }))

    expect(response.status).toBe(201)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ invoice })
    expect(mocks.allocateInvoiceNumber).toHaveBeenCalledTimes(1)
    expect(mocks.sql.mock.calls[1].slice(1)).toEqual([
      4,
      8,
      'INV-202608-0042',
      'Curated dataset',
      125_000,
      '2026-09-01',
    ])
  })

  it('does not permit status changes through the draft edit endpoint', async () => {
    const { PATCH } = await import('@/app/api/admin/invoices/[id]/route')
    const response = await PATCH(
      request('/api/admin/invoices/29', 'PATCH', { status: 'paid' }),
      { params: Promise.resolve({ id: '29' }) },
    )

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain('Unknown field')
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('updates only a draft invoice', async () => {
    const invoice = { id: 29, description: 'Revised scope', status: 'draft' }
    mocks.sql.mockResolvedValueOnce([invoice])

    const { PATCH } = await import('@/app/api/admin/invoices/[id]/route')
    const response = await PATCH(
      request('/api/admin/invoices/29', 'PATCH', { description: ' Revised scope ' }),
      { params: Promise.resolve({ id: '29' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ invoice })
    const query = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain("status = 'draft'")
    expect(query).toContain('purpose IS NULL')
    expect(mocks.sql.mock.calls[0].slice(1)).toContain('Revised scope')
  })

  it('refuses to edit a draft deposit invoice through the generic endpoint', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'draft', purpose: 'deposit' }])

    const { PATCH } = await import('@/app/api/admin/invoices/[id]/route')
    const response = await PATCH(
      request('/api/admin/invoices/29', 'PATCH', { description: 'Changed deposit' }),
      { params: Promise.resolve({ id: '29' }) },
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'Deposit invoices are managed by the signed-engagement workflow',
    })
    const query = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain("status = 'draft'")
    expect(query).toContain('purpose IS NULL')
  })

  it('refuses any other lifecycle-owned invoice purpose through the generic endpoint', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'draft', purpose: 'milestone' }])

    const { PATCH } = await import('@/app/api/admin/invoices/[id]/route')
    const response = await PATCH(
      request('/api/admin/invoices/29', 'PATCH', { description: 'Changed milestone' }),
      { params: Promise.resolve({ id: '29' }) },
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'Lifecycle-owned invoices are managed by their engagement workflow',
    })
  })

  it('refuses to delete a non-draft invoice', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'sent' }])

    const { DELETE } = await import('@/app/api/admin/invoices/[id]/route')
    const response = await DELETE(
      request('/api/admin/invoices/29', 'DELETE'),
      { params: Promise.resolve({ id: '29' }) },
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'Only draft invoices can be changed' })
    const query = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain("status = 'draft'")
    expect(query).toContain('purpose IS NULL')
  })

  it('refuses to delete a lifecycle-owned draft invoice through the generic endpoint', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'draft', purpose: 'deposit' }])

    const { DELETE } = await import('@/app/api/admin/invoices/[id]/route')
    const response = await DELETE(
      request('/api/admin/invoices/29', 'DELETE'),
      { params: Promise.resolve({ id: '29' }) },
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'Deposit invoices are managed by the signed-engagement workflow',
    })
    const query = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain('purpose IS NULL')
  })

  it('refuses to delete any other lifecycle-owned invoice purpose through the generic endpoint', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ status: 'draft', purpose: 'milestone' }])

    const { DELETE } = await import('@/app/api/admin/invoices/[id]/route')
    const response = await DELETE(
      request('/api/admin/invoices/29', 'DELETE'),
      { params: Promise.resolve({ id: '29' }) },
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'Lifecycle-owned invoices are managed by their engagement workflow',
    })
  })
})
