import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sqlMock, isAdminMock } = vi.hoisted(() => ({
  sqlMock: vi.fn(),
  isAdminMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: sqlMock }))
vi.mock('@/lib/admin-auth', () => ({ isAdmin: isAdminMock }))

import { GET, POST } from '@/app/api/cron/receipts/route'

function request(method: 'GET' | 'POST', headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/cron/receipts', { method, headers })
}

describe('receipt scan authorization', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret')
    vi.stubEnv('GMAIL_CLIENT_ID', '')
    vi.stubEnv('GMAIL_CLIENT_SECRET', '')
    sqlMock.mockReset()
    isAdminMock.mockReset()
    isAdminMock.mockReturnValue(false)
  })

  it('rejects GET without the cron secret, including an admin session', async () => {
    expect((await GET(request('GET'))).status).toBe(401)
    isAdminMock.mockReturnValue(true)
    expect((await GET(request('GET'))).status).toBe(401)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('accepts GET with the bearer secret', async () => {
    const response = await GET(request('GET', { authorization: 'Bearer test-cron-secret' }))
    expect(response.status).toBe(500)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('accepts an admin POST only from this origin', async () => {
    isAdminMock.mockReturnValue(true)
    const crossSite = await POST(request('POST', {
      origin: 'https://evil.example',
      'sec-fetch-site': 'cross-site',
    }))
    expect(crossSite.status).toBe(403)

    const sameOrigin = await POST(request('POST', {
      origin: 'http://localhost',
      'sec-fetch-site': 'same-origin',
    }))
    expect(sameOrigin.status).toBe(500)
    expect(sqlMock).not.toHaveBeenCalled()
  })
})
