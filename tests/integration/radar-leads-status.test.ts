import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('@/lib/db', () => ({ sql }))
import { POST } from '@/app/api/integrations/radar/leads/status/route'

function request(body: unknown, token = 'radar-status-test') {
  return new NextRequest('http://localhost/api/integrations/radar/leads/status', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })
}
describe('radar workflow feedback', () => {
  beforeEach(() => { sql.mockReset(); vi.stubEnv('RADAR_SECRET', 'radar-status-test') })
  afterEach(() => { vi.unstubAllEnvs() })

  it('fails closed for missing configuration and invalid credentials', async () => {
    expect((await POST(request({ externalRefs: ['SAM:1'] }, 'wrong'))).status).toBe(401)
    vi.stubEnv('RADAR_SECRET', '')
    expect((await POST(request({ externalRefs: ['SAM:1'] }))).status).toBe(401)
    expect(sql).not.toHaveBeenCalled()
  })

  it.each([{}, { externalRefs: [] }, { externalRefs: [null] }, { externalRefs: [' '] },
    { externalRefs: ['SAM:1'], source: 'contact' },
    { externalRefs: Array.from({ length: 101 }, (_, i) => `SAM:${i}`) },
  ])('rejects invalid reference selection %#', async body => {
    expect((await POST(request(body))).status).toBe(400)
    expect(sql).not.toHaveBeenCalled()
  })

  it('returns only workflow status and scopes the lookup to radar source', async () => {
    sql.mockResolvedValueOnce([{ id: 1, external_id: 'SAM:1', stage: 'contacted', removed_at: '2026-09-08T00:00:00Z',
      email: 'private@example.com', notes: 'Private', gmail_draft_id: 'private-draft' }])
    const response = await POST(request({ externalRefs: [' SAM:1 ', 'SAM:missing'] }))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ leads: [{ leadId: 1, externalRef: 'SAM:1', stage: 'contacted', removedAt: '2026-09-08T00:00:00Z' }] })
    const [strings, ...values] = sql.mock.calls[0]
    expect(strings.join(' ')).toContain("WHERE source = 'opportunity-radar' AND external_id = ANY(")
    expect(values).toEqual([['SAM:1', 'SAM:missing']])
  })
})
