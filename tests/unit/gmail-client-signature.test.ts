import { afterEach, describe, expect, it, vi } from 'vitest'

import { getGmailDefaultSignature, GmailApiError } from '@/lib/gmail-client'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('getGmailDefaultSignature', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the signature of the entry marked isDefault', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          sendAs: [
            { sendAsEmail: 'other@aetherisvision.com', isDefault: false, signature: '<p>wrong</p>' },
            { sendAsEmail: 'marston@aetherisvision.com', isDefault: true, signature: '<table>AV2</table>' },
          ],
        }),
      ),
    )
    await expect(getGmailDefaultSignature('token')).resolves.toBe('<table>AV2</table>')
  })

  it('falls back to matching sendAsEmail when no entry is marked default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          sendAs: [
            { sendAsEmail: 'other@aetherisvision.com', signature: '<p>wrong</p>' },
            { sendAsEmail: 'marston@aetherisvision.com', signature: '<table>fallback</table>' },
          ],
        }),
      ),
    )
    await expect(
      getGmailDefaultSignature('token', 'marston@aetherisvision.com'),
    ).resolves.toBe('<table>fallback</table>')
  })

  it('returns null (not an error) when the default entry has no signature configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, { sendAs: [{ sendAsEmail: 'marston@aetherisvision.com', isDefault: true }] }),
      ),
    )
    await expect(getGmailDefaultSignature('token')).resolves.toBeNull()
  })

  it('returns null when the signature is whitespace-only', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, { sendAs: [{ isDefault: true, signature: '   ' }] }),
      ),
    )
    await expect(getGmailDefaultSignature('token')).resolves.toBeNull()
  })

  it('throws GmailApiError with the HTTP status on an API failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(403, { error: { message: 'insufficient scope' } })),
    )
    await expect(getGmailDefaultSignature('token')).rejects.toMatchObject({
      name: 'GmailApiError',
      status: 403,
      message: 'insufficient scope',
    })
  })

  it('does not throw a raw JSON-parse error on a non-JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>oops</html>', { status: 500 })))
    let caught: unknown
    try {
      await getGmailDefaultSignature('token')
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(GmailApiError)
    expect((caught as GmailApiError).status).toBe(500)
  })
})
