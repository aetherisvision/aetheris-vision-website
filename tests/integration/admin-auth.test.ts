import { createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PASSPHRASE = 'super-secret-test-passphrase'

function hmacToken(passphrase: string): string {
  return createHmac('sha256', passphrase).update('admin-session').digest('hex')
}

/** Build a NextRequest with an optional av-admin-session cookie. */
function makeAdminRequest(
  url: string,
  method = 'GET',
  cookieValue?: string,
): NextRequest {
  const headers: Record<string, string> = {}
  if (cookieValue !== undefined) {
    headers['Cookie'] = `av-admin-session=${cookieValue}`
  }
  return new NextRequest(url, { method, headers })
}

// ---------------------------------------------------------------------------
// Tests: admin-auth helpers (unit)
// ---------------------------------------------------------------------------

describe('getAdminSessionToken()', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns hex HMAC-SHA256 of "admin-session" keyed by ADMIN_PASSPHRASE', async () => {
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
    const { getAdminSessionToken } = await import('@/lib/admin-auth')
    expect(getAdminSessionToken()).toBe(hmacToken(TEST_PASSPHRASE))
  })

  it('returns a different token when ADMIN_PASSPHRASE changes', async () => {
    vi.stubEnv('ADMIN_PASSPHRASE', 'passphrase-a')
    const { getAdminSessionToken: tokenA } = await import('@/lib/admin-auth')
    const a = tokenA()

    vi.stubEnv('ADMIN_PASSPHRASE', 'passphrase-b')
    vi.resetModules()
    const { getAdminSessionToken: tokenB } = await import('@/lib/admin-auth')
    const b = tokenB()

    expect(a).not.toBe(b)
  })
})

describe('isAdmin()', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('returns true when cookie carries the correct HMAC token', async () => {
    const { isAdmin } = await import('@/lib/admin-auth')
    const req = makeAdminRequest(
      'http://localhost/admin',
      'GET',
      hmacToken(TEST_PASSPHRASE),
    )
    expect(isAdmin(req)).toBe(true)
  })

  it('returns false when cookie is absent', async () => {
    const { isAdmin } = await import('@/lib/admin-auth')
    const req = makeAdminRequest('http://localhost/admin')
    expect(isAdmin(req)).toBe(false)
  })

  it('returns false for the legacy fixed string "authenticated"', async () => {
    const { isAdmin } = await import('@/lib/admin-auth')
    const req = makeAdminRequest('http://localhost/admin', 'GET', 'authenticated')
    expect(isAdmin(req)).toBe(false)
  })

  it('returns false for an arbitrary wrong token', async () => {
    const { isAdmin } = await import('@/lib/admin-auth')
    const req = makeAdminRequest(
      'http://localhost/admin',
      'GET',
      'deadbeefdeadbeef',
    )
    expect(isAdmin(req)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests: POST /api/admin/auth
// ---------------------------------------------------------------------------

describe('POST /api/admin/auth', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('returns 401 when passphrase is wrong', async () => {
    const { POST } = await import('@/app/api/admin/auth/route')
    const req = new NextRequest('http://localhost/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ passphrase: 'wrong-passphrase' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when passphrase is missing', async () => {
    const { POST } = await import('@/app/api/admin/auth/route')
    const req = new NextRequest('http://localhost/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 and sets HMAC cookie on correct passphrase', async () => {
    const { POST } = await import('@/app/api/admin/auth/route')
    const req = new NextRequest('http://localhost/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ passphrase: TEST_PASSPHRASE }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.ok).toBe(true)

    // Cookie must carry the HMAC token, not the bare string 'authenticated'
    const setCookie = res.headers.get('set-cookie') ?? ''
    const expectedToken = hmacToken(TEST_PASSPHRASE)
    expect(setCookie).toContain(`av-admin-session=${expectedToken}`)
    expect(setCookie).not.toContain('authenticated')
  })

  it('redirects to /admin/clients by default', async () => {
    const { POST } = await import('@/app/api/admin/auth/route')
    const req = new NextRequest('http://localhost/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ passphrase: TEST_PASSPHRASE }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.redirectTo).toBe('/admin/clients')
  })

  it('respects a safe `next` redirect within /admin', async () => {
    const { POST } = await import('@/app/api/admin/auth/route')
    const req = new NextRequest('http://localhost/api/admin/auth', {
      method: 'POST',
      body: JSON.stringify({ passphrase: TEST_PASSPHRASE, next: '/admin/invoices' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.redirectTo).toBe('/admin/invoices')
  })
})

// ---------------------------------------------------------------------------
// Tests: admin resource routes — must return 401 without valid cookie
// ---------------------------------------------------------------------------

vi.mock('@/lib/db', () => ({
  sql: new Proxy(
    async () => [],
    {
      get: (_target, prop) => {
        if (prop === 'then') return undefined // prevent auto-await
        return async () => []
      },
    },
  ),
}))

describe('GET /api/admin/clients — 401 guard', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('returns 401 with no cookie', async () => {
    const { GET } = await import('@/app/api/admin/clients/route')
    const req = makeAdminRequest('http://localhost/api/admin/clients')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 with the legacy "authenticated" cookie value', async () => {
    const { GET } = await import('@/app/api/admin/clients/route')
    const req = makeAdminRequest(
      'http://localhost/api/admin/clients',
      'GET',
      'authenticated',
    )
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 with a random wrong token', async () => {
    const { GET } = await import('@/app/api/admin/clients/route')
    const req = makeAdminRequest(
      'http://localhost/api/admin/clients',
      'GET',
      'not-a-valid-token',
    )
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/admin/projects — 401 guard', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('returns 401 with no cookie', async () => {
    const { GET } = await import('@/app/api/admin/projects/route')
    const req = makeAdminRequest('http://localhost/api/admin/projects')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 with the legacy "authenticated" cookie value', async () => {
    const { GET } = await import('@/app/api/admin/projects/route')
    const req = makeAdminRequest(
      'http://localhost/api/admin/projects',
      'GET',
      'authenticated',
    )
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/admin/documents — 401 guard', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
  })

  it('returns 401 with no cookie', async () => {
    const { GET } = await import('@/app/api/admin/documents/route')
    const req = makeAdminRequest('http://localhost/api/admin/documents')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 with the legacy "authenticated" cookie value', async () => {
    const { GET } = await import('@/app/api/admin/documents/route')
    const req = makeAdminRequest(
      'http://localhost/api/admin/documents',
      'GET',
      'authenticated',
    )
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
