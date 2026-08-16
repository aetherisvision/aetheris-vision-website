import { createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: mocks.sql }))

const TEST_PASSPHRASE = 'admin-project-lifecycle-test'

function adminCookie(): string {
  const token = createHmac('sha256', TEST_PASSPHRASE)
    .update('admin-session')
    .digest('hex')
  return `av-admin-session=${token}`
}

function request(path: string, authenticated = true): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'DELETE',
    headers: authenticated ? { Cookie: adminCookie() } : {},
  })
}

describe('admin project deletion lifecycle safeguards', () => {
  beforeEach(() => {
    mocks.sql.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('rejects unauthenticated deletion without querying and prevents caching', async () => {
    const { DELETE } = await import('@/app/api/admin/projects/[id]/route')
    const response = await DELETE(
      request('/api/admin/projects/12', false),
      { params: Promise.resolve({ id: '12' }) },
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it.each(['0', '-1', '1.5', '12x', '2147483648'])('rejects invalid project id %s', async (id) => {
    const { DELETE } = await import('@/app/api/admin/projects/[id]/route')
    const response = await DELETE(
      request(`/api/admin/projects/${id}`),
      { params: Promise.resolve({ id }) },
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Project id must be a positive integer' })
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('deletes only a completely unused and unlinked proposal', async () => {
    mocks.sql.mockResolvedValueOnce([{ id: 12 }])

    const { DELETE } = await import('@/app/api/admin/projects/[id]/route')
    const response = await DELETE(
      request('/api/admin/projects/12'),
      { params: Promise.resolve({ id: '12' }) },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(mocks.sql).toHaveBeenCalledTimes(1)

    const query = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain("project.status = 'proposal'")
    expect(query).toContain('project.client_id IS NULL')
    expect(query).toContain('project.lead_id IS NULL')
    expect(query).toContain('project.proposal_sent_at IS NULL')
    expect(query).toContain('project.docuseal_submission_id IS NULL')
    expect(query).toContain('project.signed_at IS NULL')
    expect(query).toContain('project.deposit_amount_cents IS NULL')
    expect(query).toContain('FROM intake_submissions AS intake')
    expect(query).toContain('FROM invoices AS invoice')
    expect(query).toContain('FROM documents AS document')
    expect(mocks.sql.mock.calls[0].slice(1)).toEqual([12])
  })

  it('refuses to delete an existing project when any lifecycle safeguard fails', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 12 }])

    const { DELETE } = await import('@/app/api/admin/projects/[id]/route')
    const response = await DELETE(
      request('/api/admin/projects/12'),
      { params: Promise.resolve({ id: '12' }) },
    )

    expect(response.status).toBe(409)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      error: 'Only unused proposals with no client, CRM, delivery, or billing links can be deleted',
    })
  })

  it('returns not found when no project exists', async () => {
    mocks.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { DELETE } = await import('@/app/api/admin/projects/[id]/route')
    const response = await DELETE(
      request('/api/admin/projects/12'),
      { params: Promise.resolve({ id: '12' }) },
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Project not found' })
  })

  it('exposes the same strict deletion eligibility to the admin UI', async () => {
    mocks.sql.mockResolvedValueOnce([])

    const { GET } = await import('@/app/api/admin/projects/route')
    const response = await GET(new NextRequest('http://localhost/api/admin/projects', {
      headers: { Cookie: adminCookie() },
    }))

    expect(response.status).toBe(200)
    const query = (mocks.sql.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain('AS can_delete')
    expect(query).toContain("p.status = 'proposal'")
    expect(query).toContain('p.client_id IS NULL')
    expect(query).toContain('p.lead_id IS NULL')
    expect(query).toContain('FROM intake_submissions i')
    expect(query).toContain('FROM invoices invoice')
    expect(query).toContain('FROM documents document')
  })
})
