import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPublicHostname, getPublicOrigin, isForwardedOriginTrusted, publicUrl } from '@/lib/request-origin'
import { isSameOriginMutation } from '@/lib/same-origin'

// What Next.js standalone hands a route handler on Cloud Run: the listener
// address from HOSTNAME/PORT, with the visitor's host only in request headers.
const CONTAINER_URL = 'https://0.0.0.0:8080/api/contact'

function request(headers: Record<string, string> = {}, url = CONTAINER_URL): Request {
  return new Request(url, { method: 'POST', headers })
}

const forwarded = {
  host: 'aetherisvision.com',
  'x-forwarded-host': 'aetherisvision.com',
  'x-forwarded-proto': 'https',
}

describe('getPublicOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('GCP_LOAD_BALANCER', '')
    vi.stubEnv('TRUSTED_PROXY', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('ignores forwarded headers unless the ingress is trusted', () => {
    expect(isForwardedOriginTrusted()).toBe(false)
    const spoofed = request({ ...forwarded, 'x-forwarded-host': 'evil.example' })
    // Outside production the request URL is authoritative (next dev / next start).
    expect(getPublicOrigin(spoofed)).toBe('https://0.0.0.0:8080')

    vi.stubEnv('NODE_ENV', 'production')
    // In production an untrusted deployment falls back to the configured site.
    expect(getPublicOrigin(spoofed)).toBe('https://aetherisvision.com')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://preview.aetherisvision.com/')
    expect(getPublicOrigin(spoofed)).toBe('https://preview.aetherisvision.com')
  })

  it.each([
    ['GCP_LOAD_BALANCER', 'true'],
    ['TRUSTED_PROXY', 'true'],
  ])('honours X-Forwarded-Host and X-Forwarded-Proto when %s=%s', (flag, value) => {
    vi.stubEnv(flag, value)
    expect(isForwardedOriginTrusted()).toBe(true)
    expect(getPublicOrigin(request(forwarded))).toBe('https://aetherisvision.com')
    expect(getPublicHostname(request(forwarded))).toBe('aetherisvision.com')
    expect(publicUrl(request(forwarded), '/client/login?error=1').href).toBe(
      'https://aetherisvision.com/client/login?error=1',
    )
  })

  it('uses the first forwarded value, falls back to Host, and normalizes default ports', () => {
    vi.stubEnv('GCP_LOAD_BALANCER', 'true')
    expect(
      getPublicOrigin(
        request({
          'x-forwarded-host': 'WWW.aetherisvision.com:443, internal.lb',
          'x-forwarded-proto': 'https, http',
        }),
      ),
    ).toBe('https://www.aetherisvision.com')
    expect(getPublicOrigin(request({ host: 'pr-12---av-crm-web-preview-abc-uc.a.run.app', 'x-forwarded-proto': 'https' }))).toBe(
      'https://pr-12---av-crm-web-preview-abc-uc.a.run.app',
    )
    // Without X-Forwarded-Proto the request URL's scheme is kept.
    expect(getPublicOrigin(request({ host: 'localhost:3000' }, 'http://0.0.0.0:8080/x'))).toBe(
      'http://localhost:3000',
    )
  })

  it('rejects malformed forwarded hosts and schemes even when trusted', () => {
    vi.stubEnv('GCP_LOAD_BALANCER', 'true')
    vi.stubEnv('NODE_ENV', 'production')
    for (const host of ['evil.example/path', 'a b', 'host:port', 'https://evil.example', '', '-bad.example']) {
      expect(getPublicOrigin(request({ 'x-forwarded-host': host, 'x-forwarded-proto': 'https' }))).toBe(
        'https://aetherisvision.com',
      )
    }
    expect(getPublicOrigin(request({ 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'ftp' }))).toBe(
      'https://aetherisvision.com',
    )
  })
})

describe('isSameOriginMutation behind a trusted load balancer', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('GCP_LOAD_BALANCER', 'true')
    vi.stubEnv('TRUSTED_PROXY', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts the public origin and rejects the container address', () => {
    expect(isSameOriginMutation(request({ ...forwarded, origin: 'https://aetherisvision.com' }))).toBe(true)
    expect(isSameOriginMutation(request({ ...forwarded, origin: 'https://0.0.0.0:8080' }))).toBe(false)
    expect(isSameOriginMutation(request({ ...forwarded, origin: 'http://aetherisvision.com' }))).toBe(false)
    expect(isSameOriginMutation(request({ ...forwarded, origin: 'https://aetherisvision.com:8443' }))).toBe(false)
    expect(isSameOriginMutation(request({ ...forwarded, origin: 'https://aetherisvision.com/' }))).toBe(false)
  })

  it('does not let an attacker pick the expected origin when the ingress is untrusted', () => {
    vi.stubEnv('GCP_LOAD_BALANCER', '')
    const spoofed = request({ ...forwarded, 'x-forwarded-host': 'evil.example', origin: 'https://evil.example' })
    expect(isSameOriginMutation(spoofed)).toBe(false)
    expect(isSameOriginMutation(request({ ...forwarded, origin: 'https://aetherisvision.com' }))).toBe(true)
  })
})
