import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { captureGovconLeadMock, updateGovconLeadMock } = vi.hoisted(() => ({
  captureGovconLeadMock: vi.fn(),
  updateGovconLeadMock: vi.fn(),
}))

class MockLeadConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LeadConflictError'
  }
}

vi.mock('@/lib/crm', () => ({
  captureGovconLead: captureGovconLeadMock,
  updateGovconLead: updateGovconLeadMock,
  LeadConflictError: MockLeadConflictError,
  LEAD_STAGES: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
}))

const TEST_SECRET = 'radar-integration-test-secret'

function request(
  method: 'POST' | 'PATCH',
  body: unknown,
  authHeader: string | null = `Bearer ${TEST_SECRET}`,
): NextRequest {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (authHeader !== null) headers.set('Authorization', authHeader)
  return new NextRequest('http://localhost/api/integrations/radar/leads', {
    method,
    body: JSON.stringify(body),
    headers,
  })
}

function expectNoStore(response: Response): void {
  expect(response.headers.get('cache-control')).toBe('no-store')
}

describe('opportunity-radar leads integration API contract', () => {
  beforeEach(() => {
    captureGovconLeadMock.mockReset()
    updateGovconLeadMock.mockReset()
    vi.stubEnv('RADAR_SECRET', TEST_SECRET)
    vi.resetModules()
  })

  it('rejects a request with no Authorization header', async () => {
    const { POST } = await import('@/app/api/integrations/radar/leads/route')
    const response = await POST(request('POST', { title: 'x', externalRef: 'y' }, null))
    expect(response.status).toBe(401)
    expectNoStore(response)
    expect(captureGovconLeadMock).not.toHaveBeenCalled()
  })

  it('rejects a wrong secret', async () => {
    const { POST } = await import('@/app/api/integrations/radar/leads/route')
    const response = await POST(
      request('POST', { title: 'x', externalRef: 'y' }, 'Bearer wrong-secret'),
    )
    expect(response.status).toBe(401)
  })

  it('fails closed when RADAR_SECRET is unset, even with a matching-looking header', async () => {
    vi.stubEnv('RADAR_SECRET', '')
    const { POST } = await import('@/app/api/integrations/radar/leads/route')
    const response = await POST(request('POST', { title: 'x', externalRef: 'y' }, 'Bearer '))
    expect(response.status).toBe(401)
  })

  it('creates a lead and returns 201 when captureGovconLead reports created:true', async () => {
    captureGovconLeadMock.mockResolvedValueOnce({ leadId: 5, stage: 'new', created: true })
    const { POST } = await import('@/app/api/integrations/radar/leads/route')

    const response = await POST(
      request('POST', {
        title: 'Consulting Flood Hydrologist Services',
        externalRef: 'SAM.gov:abc123',
        agency: 'FERC',
        govcon: { naics: '541620' },
      }),
    )

    expect(response.status).toBe(201)
    expectNoStore(response)
    await expect(response.json()).resolves.toEqual({ leadId: 5, stage: 'new', created: true })
    expect(captureGovconLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Consulting Flood Hydrologist Services', agency: 'FERC' }),
    )
  })

  it('returns 400 when title is missing', async () => {
    const { POST } = await import('@/app/api/integrations/radar/leads/route')
    const response = await POST(request('POST', { externalRef: 'SAM.gov:abc123' }))
    expect(response.status).toBe(400)
    expect(captureGovconLeadMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid stage on PATCH before calling updateGovconLead', async () => {
    const { PATCH } = await import('@/app/api/integrations/radar/leads/route')
    const response = await PATCH(
      request('PATCH', { externalRef: 'SAM.gov:abc123', stage: 'not-a-real-stage' }),
    )
    expect(response.status).toBe(400)
    expect(updateGovconLeadMock).not.toHaveBeenCalled()
  })

  it('returns 404 when updateGovconLead finds no matching lead', async () => {
    updateGovconLeadMock.mockResolvedValueOnce(null)
    const { PATCH } = await import('@/app/api/integrations/radar/leads/route')
    const response = await PATCH(
      request('PATCH', { externalRef: 'SAM.gov:missing', stage: 'contacted' }),
    )
    expect(response.status).toBe(404)
  })

  it('patches a lead successfully', async () => {
    updateGovconLeadMock.mockResolvedValueOnce({ leadId: 5, stage: 'contacted' })
    const { PATCH } = await import('@/app/api/integrations/radar/leads/route')
    const response = await PATCH(
      request('PATCH', {
        externalRef: 'SAM.gov:abc123',
        stage: 'contacted',
        govconPatch: { drive_folder: 'AV-2026-0011' },
      }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ leadId: 5, stage: 'contacted' })
  })

  it('maps a LeadConflictError to 409', async () => {
    captureGovconLeadMock.mockRejectedValueOnce(new MockLeadConflictError('conflict'))
    const { POST } = await import('@/app/api/integrations/radar/leads/route')
    const response = await POST(request('POST', { title: 'x', externalRef: 'SAM.gov:abc123' }))
    expect(response.status).toBe(409)
  })

  it('maps a plain validation Error to 400, not 409', async () => {
    captureGovconLeadMock.mockRejectedValueOnce(new Error('estimatedValueCents is invalid'))
    const { POST } = await import('@/app/api/integrations/radar/leads/route')
    const response = await POST(request('POST', { title: 'x', externalRef: 'SAM.gov:abc123' }))
    expect(response.status).toBe(400)
  })

  it('rejects a non-JSON Content-Type', async () => {
    const { POST } = await import('@/app/api/integrations/radar/leads/route')
    const response = await POST(
      new NextRequest('http://localhost/api/integrations/radar/leads', {
        method: 'POST',
        body: 'title=x',
        headers: new Headers({
          'Content-Type': 'text/plain',
          Authorization: `Bearer ${TEST_SECRET}`,
        }),
      }),
    )
    expect(response.status).toBe(415)
    expect(captureGovconLeadMock).not.toHaveBeenCalled()
  })

  it('rejects an oversized body', async () => {
    const { POST } = await import('@/app/api/integrations/radar/leads/route')
    const response = await POST(
      request('POST', { title: 'x'.repeat(20_000), externalRef: 'SAM.gov:abc123' }),
    )
    expect(response.status).toBe(413)
    expect(captureGovconLeadMock).not.toHaveBeenCalled()
  })
})
