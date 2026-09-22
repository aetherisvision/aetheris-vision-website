import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mintAdminSessionToken } from '../helpers/admin-session'

const { sqlMock, transactionMock, txMock } = vi.hoisted(() => {
  const txMock = vi.fn()
  const transactionMock = vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>[]) =>
    Promise.all(callback(txMock)))
  const sqlMock = Object.assign(vi.fn(), { transaction: transactionMock })
  return { sqlMock, transactionMock, txMock }
})
vi.mock('@/lib/db', () => ({ sql: sqlMock }))
import { POST } from '@/app/api/admin/leads/research-prospects/route'

const passphrase = 'research-prospect-test'
const prospect = {
  rank: 1, tier: 'A', score: 85, organization: 'University of Oklahoma — CADRE',
  contact_name: 'Dr. Xuguang Wang', type: 'University research center', state: 'OK',
  contact_role: 'Director, CADRE', email: 'xuguang.wang@ou.edu',
  email_route: 'xuguang.wang@ou.edu', why_fit: 'Relevant data assimilation workflows.',
  opener: 'Ask about data preparation.', wave: 'Sent', next_step: 'Follow up next week.',
  source_url: 'https://www.ou.edu/cadre', verified_at: '2026-09-22', existing_lead_id: 8,
}
function request(body: unknown, authenticated = true) {
  return new NextRequest('http://localhost/api/admin/leads/research-prospects', {
    method: 'POST', body: JSON.stringify(body), headers: {
      'Content-Type': 'application/json',
      ...(authenticated ? { Cookie: `av-admin-session=${mintAdminSessionToken(passphrase)}` } : {}),
    },
  })
}

describe('research prospect CRM import', () => {
  beforeEach(() => {
    sqlMock.mockReset(); transactionMock.mockClear(); txMock.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', passphrase)
    vi.stubEnv('ADMIN_SESSION_SECRET', '')
  })

  it('rejects unauthenticated and malformed imports without writes', async () => {
    expect((await POST(request({ campaign: 'test', prospects: [prospect] }, false))).status).toBe(401)
    expect((await POST(request({ campaign: 'test', prospects: [{ ...prospect, source_url: 'javascript:bad' }] }))).status).toBe(400)
    expect((await POST(request({ campaign: 'test', prospects: [prospect, prospect] }))).status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it('attaches OU to its sent-mail CRM record and inserts other prospects for review', async () => {
    sqlMock.mockResolvedValue([{ id: 8 }])
    txMock.mockResolvedValueOnce([{ id: 8, created: false }])
      .mockResolvedValueOnce([{ id: 100, created: true }])
    const other = { ...prospect, rank: 2, contact_name: 'Other researcher',
      organization: 'Other institute', email: 'other@example.edu', email_route: 'other@example.edu',
      existing_lead_id: undefined, wave: 'Wave 1' }
    const response = await POST(request({ campaign: 'atmospheric-harmonization-2026-09-22', prospects: [prospect, other] }))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ count: 2, created: 1 })
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(txMock).toHaveBeenCalledTimes(2)
    const updateSql = (txMock.mock.calls[0][0] as TemplateStringsArray).join(' ')
    const insertSql = (txMock.mock.calls[1][0] as TemplateStringsArray).join(' ')
    expect(updateSql).toContain('UPDATE leads SET govcon')
    expect(updateSql).not.toContain('stage =')
    expect(insertSql).toContain("'research-prospect'")
    expect(insertSql).toContain("'review'")
    expect(insertSql).toContain('ON CONFLICT')
  })
})
