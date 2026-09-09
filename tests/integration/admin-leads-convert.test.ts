import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mintAdminSessionToken } from '../helpers/admin-session'

const { sqlMock, prepareLeadProposalMock } = vi.hoisted(() => ({
  sqlMock: vi.fn(),
  prepareLeadProposalMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: sqlMock }))
vi.mock('@/lib/crm', () => ({ prepareLeadProposal: prepareLeadProposalMock }))

const PASSPHRASE = 'convert-workflow-test'

async function convert(body?: unknown) {
  const { POST } = await import('@/app/api/admin/leads/[id]/convert/route')
  return POST(new NextRequest('http://localhost/api/admin/leads/12/convert', {
    method: 'POST',
    headers: {
      Cookie: `av-admin-session=${mintAdminSessionToken(PASSPHRASE)}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), { params: Promise.resolve({ id: '12' }) })
}

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: 12,
    name: 'Opportunity',
    organization: 'Agency',
    service: null,
    stage: 'qualified',
    removed_at: null,
    workflow_version: 7,
    client_id: null,
    matching_client_id: null,
    proposal_project_id: null,
    ...overrides,
  }
}

describe('proposal preparation workflow guards', () => {
  beforeEach(() => {
    sqlMock.mockReset()
    prepareLeadProposalMock.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', PASSPHRASE)
    vi.stubEnv('ADMIN_SESSION_SECRET', '')
  })

  it('requires restoring a removed lead even when its stage remains qualified', async () => {
    sqlMock.mockResolvedValueOnce([lead({ removed_at: '2026-09-08T00:00:00Z' })])

    const response = await convert()

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'Restore this lead before preparing a proposal', code: 'LEAD_CONFLICT' })
    expect(prepareLeadProposalMock).not.toHaveBeenCalled()
  })

  it.each(['review', 'declined'])('requires pursuit before preparing a %s opportunity', async (stage) => {
    sqlMock.mockResolvedValueOnce([lead({ stage })])

    const response = await convert()

    expect(response.status).toBe(409)
    expect((await response.json()).error).toContain('Pursue this opportunity')
    expect(prepareLeadProposalMock).not.toHaveBeenCalled()
  })

  it.each(['lost', 'won'])('keeps the closed %s lead guard', async (stage) => {
    sqlMock.mockResolvedValueOnce([lead({ stage })])

    const response = await convert()

    expect(response.status).toBe(409)
    expect((await response.json()).error).toContain('closed lead')
    expect(prepareLeadProposalMock).not.toHaveBeenCalled()
  })

  it.each([-1, 1.2, 2_147_483_648, '7', null])('rejects invalid expected_version %s before querying', async (version) => {
    const response = await convert({ expected_version: version })

    expect(response.status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
    expect(prepareLeadProposalMock).not.toHaveBeenCalled()
  })

  it('rejects a stale client version without preparing a proposal', async () => {
    sqlMock.mockResolvedValueOnce([lead()])

    const response = await convert({ expected_version: 6 })

    expect(response.status).toBe(409)
    expect((await response.json()).error).toContain('This lead changed')
    expect(prepareLeadProposalMock).not.toHaveBeenCalled()
  })

  it('passes the expected version into the locked helper and preserves idempotent project results', async () => {
    const after = lead({ stage: 'proposal', client_id: 27, project_id: 48, workflow_version: 8 })
    sqlMock
      .mockResolvedValueOnce([lead({ client_id: 27, matching_client_id: 27, proposal_project_id: 48 })])
      .mockResolvedValueOnce([after])
    prepareLeadProposalMock.mockResolvedValueOnce({ clientId: 27, projectId: 48 })

    const response = await convert({ expected_version: 7 })

    expect(response.status).toBe(200)
    expect(prepareLeadProposalMock).toHaveBeenCalledWith({
      leadId: 12, projectName: 'Agency project', expectedVersion: 7,
    })
    expect(await response.json()).toEqual({
      lead: after, clientId: 27, projectId: 48, clientCreated: false, projectCreated: false,
    })
  })

  it('returns a conflict if removal wins between preflight and the locked transaction', async () => {
    sqlMock.mockResolvedValueOnce([lead()])
    prepareLeadProposalMock.mockRejectedValueOnce(new Error('Lead no longer eligible'))

    const response = await convert({ expected_version: 7 })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'The proposal could not be prepared from this lead', code: 'LEAD_CONFLICT' })
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })
})
