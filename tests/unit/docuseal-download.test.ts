import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const API_KEY = 'docuseal-api-contract-test'
const SUBMISSION_ID = 'sub/123'
const DOCUMENT_URL = 'https://docuseal.com/file/signed-document.pdf?token=test'

function metadataResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('DocuSeal signed PDF download', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('DOCUSEAL_API_KEY', API_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('retrieves the current merged-documents response and downloads its temporary URL', async () => {
    const signedPdf = Buffer.from('%PDF-1.7 signed')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        metadataResponse({
          id: 123,
          documents: [{ name: 'signed-document', url: DOCUMENT_URL }],
        }),
      )
      .mockResolvedValueOnce(
        new Response(signedPdf, {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { downloadSignedPdf } = await import('@/lib/docuseal')
    await expect(downloadSignedPdf(SUBMISSION_ID)).resolves.toEqual(signedPdf)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.docuseal.com/submissions/sub%2F123/documents?merge=true',
      {
        headers: { 'X-Auth-Token': API_KEY },
        cache: 'no-store',
      },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, DOCUMENT_URL, {
      cache: 'no-store',
    })
  })

  it.each([
    ['missing documents', { id: 123 }],
    ['empty documents', { id: 123, documents: [] }],
    [
      'ambiguous documents',
      {
        id: 123,
        documents: [
          { name: 'one', url: DOCUMENT_URL },
          { name: 'two', url: 'https://docuseal.com/file/two.pdf' },
        ],
      },
    ],
    [
      'an insecure document URL',
      { id: 123, documents: [{ name: 'signed', url: 'http://example.com/file.pdf' }] },
    ],
    [
      'a credential-bearing document URL',
      {
        id: 123,
        documents: [{ name: 'signed', url: 'https://user:pass@example.com/file.pdf' }],
      },
    ],
  ])('rejects %s without making a document request', async (_label, payload) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(metadataResponse(payload))
    vi.stubGlobal('fetch', fetchMock)

    const { downloadSignedPdf } = await import('@/lib/docuseal')
    await expect(downloadSignedPdf('123')).rejects.toThrow(
      'Signed PDF is unavailable for 123',
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed metadata without exposing its response body', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response('sensitive malformed response', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { downloadSignedPdf } = await import('@/lib/docuseal')
    await expect(downloadSignedPdf('123')).rejects.toThrow(
      'Invalid signed PDF metadata for 123',
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not include a failed temporary document URL in its error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        metadataResponse({
          id: 123,
          documents: [{ name: 'signed-document', url: DOCUMENT_URL }],
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
    vi.stubGlobal('fetch', fetchMock)

    const { downloadSignedPdf } = await import('@/lib/docuseal')
    let caught: unknown
    try {
      await downloadSignedPdf('123')
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toBe('Failed to download signed PDF for 123')
    expect((caught as Error).message).not.toContain(DOCUMENT_URL)
  })
})
