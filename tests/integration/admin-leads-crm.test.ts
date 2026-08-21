import { mintAdminSessionToken } from '../helpers/admin-session'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prepareLeadProposalMock, sqlMock, updateLeadMock } = vi.hoisted(() => ({
  prepareLeadProposalMock: vi.fn(),
  sqlMock: vi.fn(),
  updateLeadMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: sqlMock }))
vi.mock('@/lib/crm', () => ({
  prepareLeadProposal: prepareLeadProposalMock,
  updateLead: updateLeadMock,
}))

const TEST_PASSPHRASE = 'admin-leads-contract-test'
const MANUAL_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'lost'] as const

function adminCookie(): string {
  const token = mintAdminSessionToken(TEST_PASSPHRASE)
  return `av-admin-session=${token}`
}

function request(
  path: string,
  init: {
    method?: string
    body?: BodyInit | null
    headers?: HeadersInit
  } = {},
  authenticated = true,
): NextRequest {
  const headers = new Headers(init.headers)
  if (authenticated) headers.set('Cookie', adminCookie())

  return new NextRequest(`http://localhost${path}`, {
    ...init,
    headers,
  })
}

function jsonRequest(
  path: string,
  method: 'PATCH' | 'POST',
  body: unknown,
  authenticated = true,
): NextRequest {
  return request(
    path,
    {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    },
    authenticated,
  )
}

function expectNoStore(response: Response): void {
  expect(response.headers.get('cache-control')).toBe('no-store')
}

describe('admin leads CRM API contract', () => {
  beforeEach(() => {
    sqlMock.mockReset()
    updateLeadMock.mockReset()
    prepareLeadProposalMock.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('rejects an unauthenticated GET before querying the database', async () => {
    const { GET } = await import('@/app/api/admin/leads/route')
    const response = await GET(
      request('/api/admin/leads', { method: 'GET' }, false),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expectNoStore(response)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns the authenticated lead collection without caching it', async () => {
    const leads = [
      {
        id: 12,
        name: 'Example lead',
        email: 'lead@example.com',
        stage: 'qualified',
      },
    ]
    sqlMock.mockResolvedValueOnce(leads)

    const { GET } = await import('@/app/api/admin/leads/route')
    const response = await GET(request('/api/admin/leads', { method: 'GET' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ leads })
    expectNoStore(response)
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed PATCH JSON without querying or updating', async () => {
    const { PATCH } = await import('@/app/api/admin/leads/route')
    const response = await PATCH(
      request('/api/admin/leads', {
        method: 'PATCH',
        body: '{',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request body' })
    expectNoStore(response)
    expect(sqlMock).not.toHaveBeenCalled()
    expect(updateLeadMock).not.toHaveBeenCalled()
  })

  it.each([
    {
      label: 'omitted field',
      body: {
        id: 12,
        stage: 'qualified',
        estimated_value_cents: 125_000,
        next_follow_up: null,
      },
    },
    {
      label: 'extra field',
      body: {
        id: 12,
        stage: 'qualified',
        estimated_value_cents: 125_000,
        next_follow_up: null,
        notes: null,
        owner: 'unexpected',
      },
    },
  ])('rejects a PATCH body with an $label', async ({ body }) => {
    const { PATCH } = await import('@/app/api/admin/leads/route')
    const response = await PATCH(
      jsonRequest('/api/admin/leads', 'PATCH', body),
    )

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain(
      'id, stage, estimated_value_cents, next_follow_up, and notes are required',
    )
    expectNoStore(response)
    expect(sqlMock).not.toHaveBeenCalled()
    expect(updateLeadMock).not.toHaveBeenCalled()
  })

  it('rejects won as a manual stage', async () => {
    const { PATCH } = await import('@/app/api/admin/leads/route')
    const response = await PATCH(
      jsonRequest('/api/admin/leads', 'PATCH', {
        id: 12,
        stage: 'won',
        estimated_value_cents: 125_000,
        next_follow_up: null,
        notes: null,
      }),
    )

    expect(response.status).toBe(400)
    expect((await response.json()).error).toContain(
      'new, contacted, qualified, proposal, lost',
    )
    expectNoStore(response)
    expect(sqlMock).not.toHaveBeenCalled()
    expect(updateLeadMock).not.toHaveBeenCalled()
  })

  it.each(MANUAL_STAGES)('updates the supported manual stage %s', async (stage) => {
    const lead = {
      id: 12,
      name: 'Example lead',
      email: 'lead@example.com',
      stage,
      estimated_value_cents: 125_000,
      next_follow_up: '2026-08-20T15:00:00.000Z',
      notes: 'Follow up with the program office',
    }
    sqlMock.mockResolvedValueOnce([{ id: 12 }]).mockResolvedValueOnce([lead])
    updateLeadMock.mockResolvedValueOnce({ leadId: 12, stage })

    const { PATCH } = await import('@/app/api/admin/leads/route')
    const response = await PATCH(
      jsonRequest('/api/admin/leads', 'PATCH', {
        id: 12,
        stage,
        estimated_value_cents: 125_000,
        next_follow_up: '2026-08-20T15:00:00Z',
        notes: '  Follow up with the program office  ',
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ lead })
    expectNoStore(response)
    expect(updateLeadMock).toHaveBeenCalledWith({
      leadId: 12,
      stage,
      estimatedValueCents: 125_000,
      nextFollowUp: '2026-08-20T15:00:00.000Z',
      notes: 'Follow up with the program office',
    })
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it('rejects an unauthenticated proposal preparation before querying', async () => {
    const { POST } = await import('@/app/api/admin/leads/[id]/convert/route')
    const response = await POST(
      request('/api/admin/leads/12/convert', { method: 'POST' }, false),
      { params: Promise.resolve({ id: '12' }) },
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expectNoStore(response)
    expect(sqlMock).not.toHaveBeenCalled()
    expect(prepareLeadProposalMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid proposal-preparation lead ID', async () => {
    const { POST } = await import('@/app/api/admin/leads/[id]/convert/route')
    const response = await POST(
      request('/api/admin/leads/not-an-id/convert', { method: 'POST' }),
      { params: Promise.resolve({ id: 'not-an-id' }) },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid lead ID' })
    expectNoStore(response)
    expect(sqlMock).not.toHaveBeenCalled()
    expect(prepareLeadProposalMock).not.toHaveBeenCalled()
  })

  it.each(['won', 'lost'])('does not prepare a closed %s lead', async (stage) => {
    sqlMock.mockResolvedValueOnce([
      {
        id: 12,
        name: 'Example lead',
        organization: 'Example Org',
        service: 'Applied AI',
        stage,
        client_id: null,
        matching_client_id: null,
        proposal_project_id: null,
      },
    ])

    const { POST } = await import('@/app/api/admin/leads/[id]/convert/route')
    const response = await POST(
      request('/api/admin/leads/12/convert', { method: 'POST' }),
      { params: Promise.resolve({ id: '12' }) },
    )

    expect(response.status).toBe(409)
    expect((await response.json()).error).toContain('closed lead')
    expectNoStore(response)
    expect(prepareLeadProposalMock).not.toHaveBeenCalled()
  })

  it('prepares a proposal without marking the lead won', async () => {
    const lead = {
      id: 12,
      name: 'Example lead',
      email: 'lead@example.com',
      organization: 'Example Org',
      service: 'Applied AI',
      stage: 'proposal',
      client_id: 27,
      project_id: 48,
    }
    sqlMock
      .mockResolvedValueOnce([
        {
          id: 12,
          name: 'Example lead',
          organization: 'Example Org',
          service: 'Applied AI',
          stage: 'qualified',
          client_id: null,
          matching_client_id: null,
          proposal_project_id: null,
        },
      ])
      .mockResolvedValueOnce([lead])
    prepareLeadProposalMock.mockResolvedValueOnce({ clientId: 27, projectId: 48 })

    const { POST } = await import('@/app/api/admin/leads/[id]/convert/route')
    const response = await POST(
      request('/api/admin/leads/12/convert', { method: 'POST' }),
      { params: Promise.resolve({ id: '12' }) },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({
      lead,
      clientId: 27,
      projectId: 48,
      clientCreated: true,
      projectCreated: true,
    })
    expect(body.lead.stage).toBe('proposal')
    expect(body.lead.stage).not.toBe('won')
    expectNoStore(response)
    expect(prepareLeadProposalMock).toHaveBeenCalledWith({
      leadId: 12,
      projectName: 'Example Org — Applied AI',
    })
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })
})
