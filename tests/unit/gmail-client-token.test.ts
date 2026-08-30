import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getGmailAccessToken, GmailApiError } from '@/lib/gmail-client'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('getGmailAccessToken', () => {
  beforeEach(() => {
    vi.stubEnv('GMAIL_CLIENT_ID', 'client-id')
    vi.stubEnv('GMAIL_CLIENT_SECRET', 'client-secret')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns the access token on a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { access_token: 'tok-123' })))
    await expect(getGmailAccessToken('refresh')).resolves.toBe('tok-123')
  })

  it('throws GmailApiError with the HTTP status and error_description on a revoked token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }),
      ),
    )
    await expect(getGmailAccessToken('refresh')).rejects.toMatchObject({
      name: 'GmailApiError',
      status: 400,
      message: 'Token has been expired or revoked.',
    })
  })

  it('does not throw a raw JSON-parse error when Google returns a non-JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>Service unavailable</html>', { status: 503 })),
    )
    let caught: unknown
    try {
      await getGmailAccessToken('refresh')
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(GmailApiError)
    expect((caught as GmailApiError).status).toBe(503)
  })
})
