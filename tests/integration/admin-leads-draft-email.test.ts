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
    vi.stubEnv('GMAIL_CLIENT_ID', 'client-id')
    vi.stubEnv('GMAIL_CLIENT_SECRET', 'client-secret')
    loadEncodedCapabilityStatementMock.mockResolvedValue('ZmFrZS1wZGY=')
    loadEmailSignatureHtmlMock.mockResolvedValue('<table>sig</table>')
  })

  it('rejects an unauthenticated request before touching the database', async () => {
    const response = await callRoute('12', false)
    expect(response.status).toBe(401)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('returns 500 without touching the database when Gmail is not configured', async () => {
    vi.stubEnv('GMAIL_CLIENT_ID', '')
    const response = await callRoute('12')
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Gmail is not configured on this deployment',
    })
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
      messageId: 'msg-existing',
      draftUrl: 'https://mail.google.com/mail/#drafts?compose=msg-existing',
      draftedAt: '2026-08-29T00:00:00.000Z',
    })
    expect(sqlMock).toHaveBeenCalledTimes(1)
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
    expect(createGmailDraftMock).not.toHaveBeenCalled()
  })

  it('rejects a lead email that is not a single valid address (e.g. comma-joined)', async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: 12,
        name: 'FERC lead',
        email: 'officer@ferc.gov,attacker@evil.example',
        organization: 'FERC',
        gmail_draft_id: null,
        gmail_draft_created_at: null,
      },
    ])
    const response = await callRoute('12')
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "This lead's stored email is not a single valid address",
    })
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('returns 409 without claiming when another request already claimed this lead', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([]) // claim UPDATE matched no row -- already claimed

    const response = await callRoute('12')
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'A draft is already being created for this lead -- try again in a moment',
    })
    expect(sqlMock).toHaveBeenCalledTimes(2)
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
  })

  it('returns 409 asking to connect Gmail when no biz oauth_tokens row exists, and releases the claim', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]) // releaseClaim

    const response = await callRoute('12')
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'Connect the Aetheris Vision Gmail mailbox at /admin/gmail first',
    })
    expect(sqlMock).toHaveBeenCalledTimes(4)
  })

  it('returns 409 without calling Gmail when the stored connection predates gmail.compose, and releases the claim', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.readonly' }])
      .mockResolvedValueOnce([]) // releaseClaim

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
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([])

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailAccessTokenMock.mockResolvedValue('access-token')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')

    expect(response.status).toBe(200)
    const data = (await response.json()) as { messageId: string; draftUrl: string; draftedAt: string }
    expect(data.messageId).toBe('msg-1')
    expect(data.draftUrl).toBe('https://mail.google.com/mail/#drafts?compose=msg-1')
    expect(data.draftedAt).toBe('2026-08-30T00:00:00.000Z')
    expect(getGmailAccessTokenMock).toHaveBeenCalledWith('plain-refresh-token')
    expect(createGmailDraftMock).toHaveBeenCalledWith('access-token', expect.any(String))

    // findLead, claim, oauth_tokens, final UPDATE persisting gmail_draft_id.
    expect(sqlMock).toHaveBeenCalledTimes(4)
  })

  it('maps a 403 from Gmail (insufficient scope) to a clear reconnect message and releases the claim', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: null }])
      .mockResolvedValueOnce([]) // releaseClaim

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

  it('does NOT release the claim when the Gmail draft succeeds but the DB write fails -- prevents a retry from duplicating the draft', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockRejectedValueOnce(new Error('connection terminated unexpectedly')) // the final UPDATE

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailAccessTokenMock.mockResolvedValue('access-token')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')

    expect(response.status).toBe(500)
    const data = (await response.json()) as { error: string; messageId: string }
    expect(data.messageId).toBe('msg-1')
    expect(data.error).toContain('msg-1')
    expect(data.error).toContain('Do not retry')

    // findLead, claim, oauth_tokens, the failed final UPDATE -- and nothing
    // after it. A releaseClaim() call would be a 5th sql invocation.
    expect(sqlMock).toHaveBeenCalledTimes(4)
  })

  it('maps a MIME-build failure (e.g. a stray CRLF in the lead org) to a 400 admin-actionable message, and releases the claim', async () => {
    sqlMock
      .mockResolvedValueOnce([
        {
          id: 12,
          name: 'FERC lead',
          email: 'officer@ferc.gov',
          organization: 'FERC\r\nBcc: attacker@evil.example',
          gmail_draft_id: null,
          gmail_draft_created_at: null,
        },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([]) // releaseClaim

    decryptTokenMock.mockReturnValue('plain-refresh-token')

    const response = await callRoute('12')

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error:
        "This lead's stored data could not be used to build a valid email -- check its name/organization/email for stray line breaks",
    })
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
    expect(createGmailDraftMock).not.toHaveBeenCalled()
    expect(sqlMock).toHaveBeenCalledTimes(4)
  })
})
