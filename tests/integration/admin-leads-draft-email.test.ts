import { mintAdminSessionToken } from '../helpers/admin-session'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  sqlMock,
  decryptTokenMock,
  getGmailAccessTokenMock,
  createGmailDraftMock,
  loadEncodedCapabilityStatementMock,
  loadEmailSignatureHtmlMock,
} = vi.hoisted(() => ({
  sqlMock: vi.fn(),
  decryptTokenMock: vi.fn(),
  getGmailAccessTokenMock: vi.fn(),
  createGmailDraftMock: vi.fn(),
  loadEncodedCapabilityStatementMock: vi.fn(),
  loadEmailSignatureHtmlMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: sqlMock }))
vi.mock('@/lib/token-crypto', () => ({ decryptToken: decryptTokenMock }))
vi.mock('@/lib/capability-statement', () => ({
  CAPABILITY_STATEMENT_FILENAME: 'Aetheris-Vision-Capability-Statement.pdf',
  loadEncodedCapabilityStatement: loadEncodedCapabilityStatementMock,
}))
vi.mock('@/lib/email-signature', () => ({
  loadEmailSignatureHtml: loadEmailSignatureHtmlMock,
}))

class MockGmailApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'GmailApiError'
    this.status = status
  }
}

vi.mock('@/lib/gmail-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/gmail-client')>('@/lib/gmail-client')
  return {
    ...actual,
    getGmailAccessToken: getGmailAccessTokenMock,
    createGmailDraft: createGmailDraftMock,
    GmailApiError: MockGmailApiError,
  }
})

const TEST_PASSPHRASE = 'draft-email-contract-test'

function adminCookie(): string {
  return `av-admin-session=${mintAdminSessionToken(TEST_PASSPHRASE)}`
}

function request(id: string, authenticated = true): NextRequest {
  const headers = new Headers()
  if (authenticated) headers.set('Cookie', adminCookie())
  return new NextRequest(`http://localhost/api/admin/leads/${id}/draft-email`, {
    method: 'POST',
    headers,
  })
}

async function callRoute(id: string, authenticated = true) {
  const { POST } = await import('@/app/api/admin/leads/[id]/draft-email/route')
  return POST(request(id, authenticated), { params: Promise.resolve({ id }) })
}

describe('POST /api/admin/leads/[id]/draft-email', () => {
  beforeEach(() => {
    sqlMock.mockReset()
    decryptTokenMock.mockReset()
    getGmailAccessTokenMock.mockReset()
    createGmailDraftMock.mockReset()
    loadEncodedCapabilityStatementMock.mockReset()
    loadEmailSignatureHtmlMock.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
    loadEncodedCapabilityStatementMock.mockResolvedValue('ZmFrZS1wZGY=')
    loadEmailSignatureHtmlMock.mockResolvedValue('<table>sig</table>')
  })

  it('rejects an unauthenticated request before touching the database', async () => {
    const response = await callRoute('12', false)
    expect(response.status).toBe(401)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('rejects a non-numeric lead id', async () => {
    const response = await callRoute('not-a-number')
    expect(response.status).toBe(400)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns 404 when the lead does not exist', async () => {
    sqlMock.mockResolvedValueOnce([])
    const response = await callRoute('999')
    expect(response.status).toBe(404)
  })

  it('rejects a lead with no contact email on file', async () => {
    sqlMock.mockResolvedValueOnce([
      { id: 12, name: 'FERC lead', email: '', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
    ])
    const response = await callRoute('12')
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'This lead has no contact email on file',
    })
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
  })

  it('is idempotent: a lead that already has a draft returns it instead of creating another', async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: 12,
        name: 'FERC lead',
        email: 'officer@ferc.gov',
        organization: 'FERC',
        gmail_draft_id: 'msg-existing',
        gmail_draft_created_at: '2026-08-29T00:00:00.000Z',
      },
    ])

    const response = await callRoute('12')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      draftId: 'msg-existing',
      draftUrl: 'https://mail.google.com/mail/u/0/#drafts?compose=msg-existing',
      draftedAt: '2026-08-29T00:00:00.000Z',
    })
    expect(sqlMock).toHaveBeenCalledTimes(1)
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
    expect(createGmailDraftMock).not.toHaveBeenCalled()
  })

  it('returns 409 asking to connect Gmail when no biz oauth_tokens row exists', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([])

    const response = await callRoute('12')
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'Connect the Aetheris Vision Gmail mailbox at /admin/gmail first',
    })
  })

  it('returns 409 without calling Gmail when the stored connection predates gmail.compose', async () => {
    sqlMock.mockResolvedValueOnce([
      { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
    ])
    sqlMock.mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.readonly' }])

    const response = await callRoute('12')
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error:
        'The connected Gmail mailbox needs to be reconnected with drafting permission at /admin/gmail',
    })
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
  })

  it('creates a draft, persists the message id, and returns a compose-deep-link URL', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([])

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailAccessTokenMock.mockResolvedValue('access-token')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')

    expect(response.status).toBe(200)
    const data = (await response.json()) as { draftId: string; draftUrl: string; draftedAt: string }
    expect(data.draftId).toBe('msg-1')
    expect(data.draftUrl).toBe('https://mail.google.com/mail/u/0/#drafts?compose=msg-1')
    expect(getGmailAccessTokenMock).toHaveBeenCalledWith('plain-refresh-token')
    expect(createGmailDraftMock).toHaveBeenCalledWith('access-token', expect.any(String))

    // The third sql call is the UPDATE persisting gmail_draft_id (as the message id).
    expect(sqlMock).toHaveBeenCalledTimes(3)
  })

  it('maps a 403 from Gmail (insufficient scope) to a clear reconnect message, not a raw API error', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: null }])

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailAccessTokenMock.mockResolvedValue('access-token')
    createGmailDraftMock.mockRejectedValue(new MockGmailApiError('insufficient scope', 403))

    const response = await callRoute('12')
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error:
        'The connected Gmail mailbox needs to be reconnected with drafting permission at /admin/gmail',
    })
  })
})
