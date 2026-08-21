import { mintAdminSessionToken } from '../helpers/admin-session'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }))

vi.mock('@/lib/db', () => ({ sql: sqlMock }))

const TEST_PASSPHRASE = 'admin-client-contract-test'

function adminCookie(): string {
  const token = mintAdminSessionToken(TEST_PASSPHRASE)
  return `av-admin-session=${token}`
}

function request(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/clients/7', {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      Cookie: adminCookie(),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
  })
}

function requestWithoutJsonContentType(method: string, body: string): NextRequest {
  return new NextRequest('http://localhost/api/admin/clients/7', {
    method,
    body,
    headers: { Cookie: adminCookie() },
  })
}

describe('admin client CRM contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('lists lifecycle fields and the most relevant CRM links', async () => {
    const client = {
      id: 7,
      name: 'Example client',
      relationship_status: 'prospect',
      next_touch: null,
      notes: 'Proposal requested',
      lead_id: 11,
      intake_id: 12,
      project_id: 13,
      project_status: 'proposal',
    }
    sqlMock.mockResolvedValueOnce([client])

    const { GET } = await import('@/app/api/admin/clients/route')
    const response = await GET(request('GET'))

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ clients: [client] })

    const query = (sqlMock.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain('c.relationship_status')
    expect(query).toContain('c.next_touch')
    expect(query).toContain('recent_lead')
    expect(query).toContain('recent_intake.id AS intake_id')
    expect(query).toContain('recent_project.status AS project_status')
  })

  it('rejects PATCH without a valid admin session before querying', async () => {
    const { PATCH } = await import('@/app/api/admin/clients/[id]/route')
    const response = await PATCH(
      new NextRequest('http://localhost/api/admin/clients/7', {
        method: 'PATCH',
        body: JSON.stringify({ notes: 'Private note' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: '7' }) },
    )

    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('creates a normalized prospect and does not cache the response', async () => {
    const client = {
      id: 7,
      name: 'Example client',
      contact_name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: null,
      relationship_status: 'prospect',
      next_touch: null,
      notes: null,
    }
    sqlMock.mockResolvedValueOnce([client])

    const { POST } = await import('@/app/api/admin/clients/route')
    const response = await POST(request('POST', {
      name: '  Example client  ',
      contact_name: '  Ada Lovelace  ',
      email: '  ADA@EXAMPLE.COM  ',
      phone: '   ',
    }))

    expect(response.status).toBe(201)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ client })

    const values = sqlMock.mock.calls[0].slice(1)
    expect(values).toContain('Example client')
    expect(values).toContain('Ada Lovelace')
    expect(values).toContain('ada@example.com')
    expect(values).toContain(null)
  })

  it('requires JSON when creating a prospect', async () => {
    const { POST } = await import('@/app/api/admin/clients/route')
    const response = await POST(requestWithoutJsonContentType('POST', '{}'))

    expect(response.status).toBe(415)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it.each([
    [{ name: 'Example', contact_name: 'Ada', email: 'ada@example.com', role: 'owner' }, 'Only name'],
    [{ contact_name: 'Ada', email: 'ada@example.com' }, 'Business name is required'],
    [{ name: 'Example', email: 'ada@example.com' }, 'Contact name is required'],
    [{ name: 'Example', contact_name: 'Ada' }, 'Email address is required'],
    [{ name: 'Example', contact_name: 'Ada', email: 'not-an-email' }, 'Enter a valid email address'],
    [{ name: 'x'.repeat(201), contact_name: 'Ada', email: 'ada@example.com' }, 'Business name must be'],
    [{ name: 'Example', contact_name: 'Ada', email: 'ada@example.com', phone: 42 }, 'Phone must be'],
  ])('rejects an invalid POST payload %#', async (body, message) => {
    const { POST } = await import('@/app/api/admin/clients/route')
    const response = await POST(request('POST', body))

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain(message)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns a conflict for a duplicate client email', async () => {
    sqlMock.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: '23505' }))
    const { POST } = await import('@/app/api/admin/clients/route')
    const response = await POST(request('POST', {
      name: 'Example',
      contact_name: 'Ada',
      email: 'ada@example.com',
    }))

    expect(response.status).toBe(409)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect((await response.json()).error).toContain('already uses this email')
  })

  it('updates only the supported lifecycle fields and returns the client', async () => {
    const client = {
      id: 7,
      name: 'Example client',
      relationship_status: 'on_hold',
      next_touch: '2026-08-20T00:00:00.000Z',
      notes: 'Follow up after review',
    }
    sqlMock.mockResolvedValueOnce([client])

    const { PATCH } = await import('@/app/api/admin/clients/[id]/route')
    const response = await PATCH(
      request('PATCH', {
        relationship_status: 'on_hold',
        next_touch: '2026-08-20',
        notes: '  Follow up after review  ',
      }),
      { params: Promise.resolve({ id: '7' }) },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ client })

    const values = sqlMock.mock.calls[0].slice(1)
    expect(values).toContain('on_hold')
    expect(values).toContain('2026-08-20T00:00:00.000Z')
    expect(values).toContain('Follow up after review')
    expect(values).toContain(7)
  })

  it.each([
    [{ relationship_status: 'won' }, 'relationship_status must be one of'],
    [{ next_touch: 'not-a-date' }, 'next_touch must be a valid'],
    [{ notes: 42 }, 'notes must be a string'],
    [{ email: 'changed@example.com' }, 'Only relationship_status'],
    [{}, 'Only relationship_status'],
  ])('rejects an invalid PATCH payload %#', async (body, message) => {
    const { PATCH } = await import('@/app/api/admin/clients/[id]/route')
    const response = await PATCH(request('PATCH', body), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain(message)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns 404 when the client no longer exists', async () => {
    sqlMock.mockResolvedValueOnce([])
    const { PATCH } = await import('@/app/api/admin/clients/[id]/route')
    const response = await PATCH(request('PATCH', { notes: null }), {
      params: Promise.resolve({ id: '999' }),
    })

    expect(response.status).toBe(404)
  })

  it('requires JSON when updating a client relationship', async () => {
    const { PATCH } = await import('@/app/api/admin/clients/[id]/route')
    const response = await PATCH(requestWithoutJsonContentType('PATCH', '{}'), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(response.status).toBe(415)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns a safe error when a lifecycle update fails', async () => {
    sqlMock.mockRejectedValueOnce(new Error('private database detail'))
    const { PATCH } = await import('@/app/api/admin/clients/[id]/route')
    const response = await PATCH(request('PATCH', { notes: 'Follow up' }), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Unable to update client record' })
  })

  it('deletes only an unused prospect', async () => {
    sqlMock.mockResolvedValueOnce([{ id: 7 }])
    const { DELETE } = await import('@/app/api/admin/clients/[id]/route')
    const response = await DELETE(request('DELETE'), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(sqlMock).toHaveBeenCalledTimes(1)

    const query = (sqlMock.mock.calls[0][0] as TemplateStringsArray).join(' ')
    expect(query).toContain("relationship_status = 'prospect'")
    expect(query).toContain('NOT EXISTS')
  })

  it('preserves a client that has history and directs the admin to archive it', async () => {
    sqlMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 7, relationship_status: 'active' }])

    const { DELETE } = await import('@/app/api/admin/clients/[id]/route')
    const response = await DELETE(request('DELETE'), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(response.status).toBe(409)
    expect((await response.json()).error).toContain('Archive records with history')
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it('returns 404 when deleting an unknown client', async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([])

    const { DELETE } = await import('@/app/api/admin/clients/[id]/route')
    const response = await DELETE(request('DELETE'), {
      params: Promise.resolve({ id: '999' }),
    })

    expect(response.status).toBe(404)
  })

  it('returns a safe error when guarded deletion fails', async () => {
    sqlMock.mockRejectedValueOnce(new Error('private database detail'))

    const { DELETE } = await import('@/app/api/admin/clients/[id]/route')
    const response = await DELETE(request('DELETE'), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Unable to delete client record' })
  })
})
