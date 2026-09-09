import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mintAdminSessionToken } from '../helpers/admin-session'

const { manageLeads } = vi.hoisted(() => ({ manageLeads: vi.fn() }))
vi.mock('@/lib/crm', () => ({ manageLeads }))
import { POST } from '@/app/api/admin/leads/manage/route'

const passphrase = 'workspace-management-test'
function request(body: unknown, authenticated = true) {
  return new NextRequest('http://localhost/api/admin/leads/manage', {
    method: 'POST', body: JSON.stringify(body), headers: {
      'Content-Type': 'application/json',
      ...(authenticated ? { Cookie: `av-admin-session=${mintAdminSessionToken(passphrase)}` } : {}),
    },
  })
}
describe('recoverable opportunity management API', () => {
  beforeEach(() => {
    manageLeads.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', passphrase)
    vi.stubEnv('ADMIN_SESSION_SECRET', '')
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it('requires admin authorization before processing a selection', async () => {
    const response = await POST(request({ action: 'remove', ids: [1] }, false))
    expect(response.status).toBe(401)
    expect(manageLeads).not.toHaveBeenCalled()
  })

  it.each([
    { action: 'delete', ids: [1] }, { action: 'remove', ids: [] },
    { action: 'remove', ids: [1, 1] }, { action: 'remove', ids: ['1'] },
    { action: 'remove', ids: [0] }, { action: 'remove', ids: [2_147_483_648] },
    { action: 'remove', ids: Array.from({ length: 101 }, (_, i) => i + 1) },
    { action: 'remove', ids: [1], reason: 'x'.repeat(1001) },
    { action: 'remove', ids: [1], stage: 'lost' },
  ])('rejects malformed batch %# without writes', async body => {
    expect((await POST(request(body))).status).toBe(400)
    expect(manageLeads).not.toHaveBeenCalled()
  })

  it.each(['remove', 'restore'])('returns complete lead records after %s', async action => {
    const leads = [{ id: 1, stage: 'contacted', workflow_version: 4, removed_at: action === 'remove' ? '2026-09-08T00:00:00Z' : null,
      activity_history: [], gmail_draft_id: 'existing-draft', project_id: 8 }]
    manageLeads.mockResolvedValueOnce(leads)
    const response = await POST(request({ action, ids: [1], reason: '  Duplicated opportunity  ' }))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ leads })
    expect(manageLeads).toHaveBeenCalledWith({ action, ids: [1], reason: 'Duplicated opportunity' })
  })

  it('reports atomic conflicts so the UI retains the selection', async () => {
    const error = new Error('busy draft')
    error.name = 'LeadWorkflowConflictError'
    manageLeads.mockRejectedValueOnce(error)
    const response = await POST(request({ action: 'remove', ids: [1, 2] }))
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'LEAD_CONFLICT', error: expect.stringContaining('No opportunities were changed') })
  })
})
