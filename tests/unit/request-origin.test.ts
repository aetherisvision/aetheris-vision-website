import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GCP_ORIGIN_HOST,
  allowedPublicHosts,
  getPublicHostname,
  getPublicOrigin,
  isForwardedOriginTrusted,
  publicUrl,
} from '@/lib/request-origin'
import { isSameOriginMutation } from '@/lib/same-origin'

// What Next.js standalone hands a route handler on Cloud Run: the listener
// address from HOSTNAME/PORT, with the visitor's host only in request headers.
const CONTAINER_URL = 'https://0.0.0.0:8080/api/contact'
const PUBLIC_ORIGIN = 'https://aetherisvision.com'

function request(headers: Record<string, string> = {}, url = CONTAINER_URL): Request {
  return new Request(url, { method: 'POST', headers })
}

// The GCP external HTTPS load balancer preserves the client Host header and
// sets X-Forwarded-Proto; it never sets or strips X-Forwarded-Host.
const viaLoadBalancer = { host: 'aetherisvision.com', 'x-forwarded-proto': 'https' }

function stubCloudRunBehindLoadBalancer() {
  vi.stubEnv('K_SERVICE', 'av-crm-web')
  vi.stubEnv('GCP_LOAD_BALANCER', 'true')
}

describe('getPublicOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('K_SERVICE', '')
    vi.stubEnv('GCP_LOAD_BALANCER', '')
    vi.stubEnv('TRUSTED_PROXY', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('ALLOWED_PUBLIC_HOSTS', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('ignores forwarded headers unless the ingress is trusted', () => {
    expect(isForwardedOriginTrusted()).toBe(false)
    const spoofed = request({ ...viaLoadBalancer, host: 'evil.example', 'x-forwarded-host': 'evil.example' })
    expect(getPublicOrigin(spoofed)).toBe(PUBLIC_ORIGIN)
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://preview.aetherisvision.com/')
    expect(getPublicOrigin(spoofed)).toBe('https://preview.aetherisvision.com')

    // Outside production the request URL is authoritative (next dev / next start).
    vi.stubEnv('NODE_ENV', 'test')
    expect(getPublicOrigin(spoofed)).toBe('https://0.0.0.0:8080')
  })

  it('requires both K_SERVICE and GCP_LOAD_BALANCER=true for the Cloud Run path', () => {
    vi.stubEnv('GCP_LOAD_BALANCER', 'true')
    expect(isForwardedOriginTrusted()).toBe(false)
    expect(getPublicOrigin(request({ host: 'www.aetherisvision.com', 'x-forwarded-proto': 'https' }))).toBe(
      PUBLIC_ORIGIN,
    )

    vi.stubEnv('K_SERVICE', 'av-crm-web')
    expect(isForwardedOriginTrusted()).toBe(true)
    expect(getPublicOrigin(request({ host: 'www.aetherisvision.com', 'x-forwarded-proto': 'https' }))).toBe(
      'https://www.aetherisvision.com',
    )
  })

  it('uses the preserved Host header behind the GCP load balancer', () => {
    stubCloudRunBehindLoadBalancer()
    expect(getPublicOrigin(request(viaLoadBalancer))).toBe(PUBLIC_ORIGIN)
    expect(getPublicHostname(request(viaLoadBalancer))).toBe('aetherisvision.com')
    expect(publicUrl(request(viaLoadBalancer), '/client/login?error=1').href).toBe(
      `${PUBLIC_ORIGIN}/client/login?error=1`,
    )
    expect(getPublicOrigin(request({ host: GCP_ORIGIN_HOST, 'x-forwarded-proto': 'https' }))).toBe(
      `https://${GCP_ORIGIN_HOST}`,
    )
  })

  it('ignores X-Forwarded-Host on the GCP path, even when its value is allowlisted', () => {
    stubCloudRunBehindLoadBalancer()
    // A client can send X-Forwarded-Host through the GCP LB untouched.
    expect(getPublicOrigin(request({ ...viaLoadBalancer, 'x-forwarded-host': 'evil.example' }))).toBe(PUBLIC_ORIGIN)
    expect(
      getPublicOrigin(request({ ...viaLoadBalancer, 'x-forwarded-host': 'www.aetherisvision.com' })),
    ).toBe(PUBLIC_ORIGIN)
  })

  it('never lets a trusted but unallowlisted host become the public origin', () => {
    stubCloudRunBehindLoadBalancer()
    const spoofed = request({ host: 'evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https' })
    expect(getPublicOrigin(spoofed)).toBe(PUBLIC_ORIGIN)
    expect(getPublicHostname(spoofed)).toBe('aetherisvision.com')
    expect(publicUrl(spoofed, '/client/dashboard').href).toBe(`${PUBLIC_ORIGIN}/client/dashboard`)

    vi.stubEnv('TRUSTED_PROXY', 'true')
    expect(getPublicOrigin(spoofed)).toBe(PUBLIC_ORIGIN)
  })

  it('never yields the container listener in production', () => {
    stubCloudRunBehindLoadBalancer()
    expect(getPublicOrigin(request({ host: '0.0.0.0:8080', 'x-forwarded-proto': 'https' }))).toBe(PUBLIC_ORIGIN)
    expect(getPublicOrigin(request({ host: '0.0.0.0:8080' }))).toBe(PUBLIC_ORIGIN)
    expect(getPublicOrigin(request({ 'x-forwarded-proto': 'https' }))).toBe(PUBLIC_ORIGIN)

    for (const bad of ['not a url', '0.0.0.0:8080', 'mailto:ops@aetherisvision.com', ' ']) {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', bad)
      expect(getPublicOrigin(request({ host: 'evil.example', 'x-forwarded-proto': 'https' }))).toBe(PUBLIC_ORIGIN)
      expect(getPublicOrigin(request())).toBe(PUBLIC_ORIGIN)
    }
  })

  it('normalizes case and default ports and takes the first header value', () => {
    stubCloudRunBehindLoadBalancer()
    expect(
      getPublicOrigin(request({ host: 'WWW.aetherisvision.com:443', 'x-forwarded-proto': 'https, http' })),
    ).toBe('https://www.aetherisvision.com')
    // A non-default port is part of the origin and must be allowlisted as such.
    expect(getPublicOrigin(request({ host: 'aetherisvision.com:8443', 'x-forwarded-proto': 'https' }))).toBe(
      PUBLIC_ORIGIN,
    )
  })

  it('requires https in production and never infers the scheme from request.url', () => {
    stubCloudRunBehindLoadBalancer()
    expect(getPublicOrigin(request({ host: 'aetherisvision.com', 'x-forwarded-proto': 'http' }))).toBe(PUBLIC_ORIGIN)
    expect(getPublicOrigin(request({ host: 'www.aetherisvision.com' }))).toBe(PUBLIC_ORIGIN)
    expect(getPublicOrigin(request({ host: 'www.aetherisvision.com' }, 'https://0.0.0.0:8080/x'))).toBe(
      PUBLIC_ORIGIN,
    )
    expect(getPublicOrigin(request({ host: 'aetherisvision.com', 'x-forwarded-proto': 'ftp' }))).toBe(PUBLIC_ORIGIN)
  })

  it('rejects malformed hosts even when trusted', () => {
    stubCloudRunBehindLoadBalancer()
    for (const host of ['evil.example/path', 'a b', 'host:port', 'https://aetherisvision.com', '', '-bad.example']) {
      expect(getPublicOrigin(request({ host, 'x-forwarded-proto': 'https' }))).toBe(PUBLIC_ORIGIN)
    }
  })

  it('accepts additional hosts from NEXT_PUBLIC_SITE_URL and ALLOWED_PUBLIC_HOSTS', () => {
    stubCloudRunBehindLoadBalancer()
    const preview = 'pr-12---av-crm-web-preview-abc-uc.a.run.app'
    expect(getPublicOrigin(request({ host: preview, 'x-forwarded-proto': 'https' }))).toBe(PUBLIC_ORIGIN)

    vi.stubEnv('ALLOWED_PUBLIC_HOSTS', ` ${preview.toUpperCase()} , staging.aetherisvision.com:8443,bad host`)
    expect(getPublicOrigin(request({ host: preview, 'x-forwarded-proto': 'https' }))).toBe(`https://${preview}`)
    expect(getPublicOrigin(request({ host: 'staging.aetherisvision.com:8443', 'x-forwarded-proto': 'https' }))).toBe(
      'https://staging.aetherisvision.com:8443',
    )
    expect(allowedPublicHosts().has('bad host')).toBe(false)

    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://preview.aetherisvision.com')
    expect(getPublicOrigin(request({ host: 'preview.aetherisvision.com', 'x-forwarded-proto': 'https' }))).toBe(
      'https://preview.aetherisvision.com',
    )
  })

  it('reads X-Forwarded-Host only behind an explicitly trusted proxy', () => {
    vi.stubEnv('TRUSTED_PROXY', 'true')
    expect(isForwardedOriginTrusted()).toBe(true)
    expect(
      getPublicOrigin(
        request({ host: 'internal.lb', 'x-forwarded-host': 'www.aetherisvision.com, internal.lb', 'x-forwarded-proto': 'https' }),
      ),
    ).toBe('https://www.aetherisvision.com')
    expect(getPublicOrigin(request(viaLoadBalancer))).toBe(PUBLIC_ORIGIN)
    expect(
      getPublicOrigin(request({ host: 'aetherisvision.com', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https' })),
    ).toBe(PUBLIC_ORIGIN)
  })

  it('allows localhost and plain http only outside production', () => {
    vi.stubEnv('TRUSTED_PROXY', 'true')
    const local = request({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }, 'http://0.0.0.0:8080/x')
    expect(getPublicOrigin(local)).toBe(PUBLIC_ORIGIN)
    expect(allowedPublicHosts().has('localhost')).toBe(false)

    vi.stubEnv('NODE_ENV', 'development')
    expect(getPublicOrigin(local)).toBe('http://localhost:3000')
    expect(getPublicOrigin(request({ host: '127.0.0.1:8080', 'x-forwarded-proto': 'https' }))).toBe(
      'https://127.0.0.1:8080',
    )
    // Without a trusted forwarded origin, local dev keeps the request URL.
    expect(getPublicOrigin(request({ host: 'evil.example', 'x-forwarded-proto': 'https' }, 'http://localhost:3000/x'))).toBe(
      'http://localhost:3000',
    )
  })
})

describe('isSameOriginMutation behind the GCP load balancer', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('K_SERVICE', 'av-crm-web')
    vi.stubEnv('GCP_LOAD_BALANCER', 'true')
    vi.stubEnv('TRUSTED_PROXY', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('ALLOWED_PUBLIC_HOSTS', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts the public origin and rejects the container address', () => {
    expect(isSameOriginMutation(request({ ...viaLoadBalancer, origin: PUBLIC_ORIGIN }))).toBe(true)
    expect(isSameOriginMutation(request({ ...viaLoadBalancer, origin: 'https://0.0.0.0:8080' }))).toBe(false)
    expect(isSameOriginMutation(request({ ...viaLoadBalancer, origin: 'http://aetherisvision.com' }))).toBe(false)
    expect(isSameOriginMutation(request({ ...viaLoadBalancer, origin: 'https://aetherisvision.com:8443' }))).toBe(false)
    expect(isSameOriginMutation(request({ ...viaLoadBalancer, origin: 'https://aetherisvision.com/' }))).toBe(false)
  })

  it('rejects an Origin that only matches a spoofed X-Forwarded-Host', () => {
    const spoofed = { ...viaLoadBalancer, 'x-forwarded-host': 'evil.example' }
    expect(isSameOriginMutation(request({ ...spoofed, origin: 'https://evil.example' }))).toBe(false)
    // The preserved Host still wins, so the real public origin is accepted.
    expect(isSameOriginMutation(request({ ...spoofed, origin: PUBLIC_ORIGIN }))).toBe(true)
  })

  it('rejects an Origin that only matches a spoofed, unallowlisted Host', () => {
    const headers = { host: 'evil.example', 'x-forwarded-proto': 'https' }
    expect(isSameOriginMutation(request({ ...headers, origin: 'https://evil.example' }))).toBe(false)
    // The configured origin remains the expected one.
    expect(isSameOriginMutation(request({ ...headers, origin: PUBLIC_ORIGIN }))).toBe(true)
  })

  it('does not let an attacker pick the expected origin when the ingress is untrusted', () => {
    vi.stubEnv('K_SERVICE', '')
    const spoofed = request({ host: 'evil.example', 'x-forwarded-proto': 'https', origin: 'https://evil.example' })
    expect(isSameOriginMutation(spoofed)).toBe(false)
    expect(isSameOriginMutation(request({ host: 'evil.example', 'x-forwarded-proto': 'https', origin: PUBLIC_ORIGIN }))).toBe(true)
  })
})
