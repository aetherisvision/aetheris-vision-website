import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mintAdminSessionToken } from '../helpers/admin-session'

const mocks = vi.hoisted(() => ({ sql: vi.fn() }))

vi.mock('@/lib/db', () => ({ sql: mocks.sql }))

// Cloud Run: Next.js builds request.url from HOSTNAME/PORT, so every absolute
// URL a handler emits must come from the forwarded public host instead.
const CONTAINER = 'https://0.0.0.0:8080'
const PUBLIC_HOST = 'aetherisvision.com'
const ADMIN_PASSPHRASE = 'public-origin-test-passphrase'

// The GCP external HTTPS load balancer preserves the client Host and sets
// X-Forwarded-Proto; X-Forwarded-Host passes through from the client untouched.
function cloudRunRequest(path: string, init: { method?: string; body?: BodyInit; headers?: Record<string, string> } = {}) {
  return new NextRequest(`${CONTAINER}${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: {
      host: PUBLIC_HOST,
      'x-forwarded-proto': 'https',
      ...init.headers,
    },
  })
}

const SPOOFED_HEADERS = { host: 'evil.example', 'x-forwarded-host': 'evil.example' }

describe('absolute URLs behind the GCP load balancer', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.sql.mockReset()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('K_SERVICE', 'av-crm-web')
    vi.stubEnv('GCP_LOAD_BALANCER', 'true')
    vi.stubEnv('TRUSTED_PROXY', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('ALLOWED_PUBLIC_HOSTS', '')
    vi.stubEnv('NEXTAUTH_SECRET', 'test-authjs-v5-secret-at-least-32-characters-long')
    vi.stubEnv('ADMIN_PASSPHRASE', ADMIN_PASSPHRASE)
    vi.stubEnv('ADMIN_SESSION_SECRET', '')
    vi.stubEnv('GMAIL_CLIENT_ID', 'gmail-client-id.apps.googleusercontent.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('redirects a failed magic-link login to the public host', async () => {
    const { POST } = await import('@/app/api/auth/magic/route')
    const response = await POST(
      cloudRunRequest('/api/auth/magic', {
        method: 'POST',
        body: new URLSearchParams({ token: '', email: '' }),
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }),
    )
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(`https://${PUBLIC_HOST}/client/login?error=1`)
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('keeps magic-link redirects on the site when a trusted request carries a spoofed host', async () => {
    const { POST } = await import('@/app/api/auth/magic/route')
    const spoofs: Record<string, string>[] = [
      SPOOFED_HEADERS,
      { 'x-forwarded-host': 'evil.example' },
      { host: '0.0.0.0:8080' },
    ]
    for (const headers of spoofs) {
      const response = await POST(
        cloudRunRequest('/api/auth/magic', {
          method: 'POST',
          body: new URLSearchParams({ token: '', email: '' }),
          headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
        }),
      )
      expect(response.status).toBe(303)
      expect(response.headers.get('location')).toBe(`https://${PUBLIC_HOST}/client/login?error=1`)
    }
  })

  it('builds the Gmail OAuth redirect_uri from the public origin', async () => {
    const { GET } = await import('@/app/api/auth/gmail/start/route')
    const response = await GET(
      cloudRunRequest('/api/auth/gmail/start?account=biz&debug=1', {
        headers: { cookie: `av-admin-session=${mintAdminSessionToken(ADMIN_PASSPHRASE)}` },
      }),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { origin: string; redirectUri: string; authUrl: string }
    expect(body.origin).toBe(`https://${PUBLIC_HOST}`)
    expect(body.redirectUri).toBe(`https://${PUBLIC_HOST}/api/auth/gmail/callback`)
    expect(new URL(body.authUrl).searchParams.get('redirect_uri')).toBe(body.redirectUri)
    expect(body.authUrl).not.toContain('0.0.0.0')
  })

  it('cannot have its Gmail OAuth redirect_uri poisoned through X-Forwarded-Host', async () => {
    const { GET } = await import('@/app/api/auth/gmail/start/route')
    const response = await GET(
      cloudRunRequest('/api/auth/gmail/start?account=biz&debug=1', {
        headers: { ...SPOOFED_HEADERS, cookie: `av-admin-session=${mintAdminSessionToken(ADMIN_PASSPHRASE)}` },
      }),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { redirectUri: string }
    expect(body.redirectUri).toBe(`https://${PUBLIC_HOST}/api/auth/gmail/callback`)
  })

  it('redirects the Gmail OAuth callback errors to the public host', async () => {
    const { GET } = await import('@/app/api/auth/gmail/callback/route')
    const response = await GET(
      cloudRunRequest('/api/auth/gmail/callback?state=biz:nonce&error=access_denied', {
        headers: { cookie: `av-admin-session=${mintAdminSessionToken(ADMIN_PASSPHRASE)}` },
      }),
    )
    expect(response.headers.get('location')).toBe(`https://${PUBLIC_HOST}/admin/gmail?error=access_denied`)
  })

  it('sends preview sign-in redirects to the public host', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', 'preview-secret')
    vi.stubEnv('NODE_ENV', 'test')
    const { POST } = await import('@/app/api/preview/auth/route')
    const response = await POST(
      cloudRunRequest('/api/preview/auth', {
        method: 'POST',
        body: new URLSearchParams({ password: 'wrong', next: '/about' }),
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '203.0.113.9' },
      }),
    )
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(`https://${PUBLIC_HOST}/preview?error=incorrect&next=%2Fabout`)
  })

  it('sends proxy admin redirects to the public host', async () => {
    const { proxy } = await import('@/proxy')
    const response = await proxy(cloudRunRequest('/admin/leads'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(`https://${PUBLIC_HOST}/admin/login?next=%2Fadmin%2Fleads`)
  })
})
