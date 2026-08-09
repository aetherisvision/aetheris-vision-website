import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const TEST_PASSWORD = 'private-preview-password'

function expectedToken(password = TEST_PASSWORD): string {
  return createHmac('sha256', password).update('preview-session').digest('hex')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('preview authentication', () => {
  it('creates an HMAC session token tied to PREVIEW_PASSWORD', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', TEST_PASSWORD)
    const { getPreviewSessionToken } = await import('@/lib/preview-auth')

    await expect(getPreviewSessionToken()).resolves.toBe(expectedToken())
  })

  it('recognizes a valid preview cookie', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', TEST_PASSWORD)
    const { hasPreviewSession } = await import('@/lib/preview-auth')
    const request = new NextRequest('http://localhost/', {
      headers: { Cookie: `av-preview-session=${expectedToken()}` },
    })

    await expect(hasPreviewSession(request)).resolves.toBe(true)
  })

  it('rejects an invalid preview cookie', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', TEST_PASSWORD)
    const { hasPreviewSession } = await import('@/lib/preview-auth')
    const request = new NextRequest('http://localhost/', {
      headers: { Cookie: 'av-preview-session=not-valid' },
    })

    await expect(hasPreviewSession(request)).resolves.toBe(false)
  })

  it('sets the secure preview cookie after a correct password', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', TEST_PASSWORD)
    const { POST } = await import('@/app/api/preview/auth/route')
    const form = new FormData()
    form.set('password', TEST_PASSWORD)
    form.set('next', '/capabilities?from=preview')
    const request = new NextRequest('https://aetherisvision.com/api/preview/auth', {
      method: 'POST',
      body: form,
    })

    const response = await POST(request)

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://aetherisvision.com/capabilities?from=preview',
    )
    expect(response.headers.get('set-cookie')).toContain(
      `av-preview-session=${expectedToken()}`,
    )
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
    expect(response.headers.get('set-cookie')).toContain('Secure')
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax')
  })

  it('returns to the login page after an incorrect password', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', TEST_PASSWORD)
    const { POST } = await import('@/app/api/preview/auth/route')
    const form = new FormData()
    form.set('password', 'wrong')
    form.set('next', '/about')
    const request = new NextRequest('https://aetherisvision.com/api/preview/auth', {
      method: 'POST',
      body: form,
    })

    const response = await POST(request)
    const location = new URL(response.headers.get('location')!)

    expect(response.status).toBe(303)
    expect(location.pathname).toBe('/preview')
    expect(location.searchParams.get('error')).toBe('incorrect')
    expect(location.searchParams.get('next')).toBe('/about')
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('prevents an external post-login redirect', async () => {
    vi.stubEnv('PREVIEW_PASSWORD', TEST_PASSWORD)
    const { POST } = await import('@/app/api/preview/auth/route')
    const form = new FormData()
    form.set('password', TEST_PASSWORD)
    form.set('next', '//attacker.example/path')
    const request = new NextRequest('https://aetherisvision.com/api/preview/auth', {
      method: 'POST',
      body: form,
    })

    const response = await POST(request)

    expect(response.headers.get('location')).toBe('https://aetherisvision.com/')
  })
})
