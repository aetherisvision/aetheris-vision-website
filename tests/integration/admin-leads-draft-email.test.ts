import { mintAdminSessionToken } from '../helpers/admin-session'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClaudeSubscriptionError } from '@/lib/claude-subscription'

const {
  sqlMock,
  decryptTokenMock,
  getGmailAccessTokenMock,
  createGmailDraftMock,
  getGmailDefaultSignatureMock,
  loadEncodedCapabilityStatementMock,
  draftLeadEmailMock,
} = vi.hoisted(() => ({
  sqlMock: vi.fn(),
  decryptTokenMock: vi.fn(),
  getGmailAccessTokenMock: vi.fn(),
  createGmailDraftMock: vi.fn(),
  getGmailDefaultSignatureMock: vi.fn(),
  loadEncodedCapabilityStatementMock: vi.fn(),
  draftLeadEmailMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: sqlMock }))
vi.mock('@/lib/token-crypto', () => ({ decryptToken: decryptTokenMock }))
vi.mock('@/lib/lead-email-draft', () => ({ draftLeadEmail: draftLeadEmailMock }))
vi.mock('@/lib/capability-statement', () => ({
  CAPABILITY_STATEMENT_FILENAME: 'Aetheris-Vision-Capability-Statement.pdf',
  loadEncodedCapabilityStatement: loadEncodedCapabilityStatementMock,
}))

class MockGmailApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'GmailApiError'
    this.status = status
    this.code = code
  }
}

vi.mock('@/lib/gmail-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/gmail-client')>('@/lib/gmail-client')
  return {
    ...actual,
    getGmailAccessToken: getGmailAccessTokenMock,
    createGmailDraft: createGmailDraftMock,
    getGmailDefaultSignature: getGmailDefaultSignatureMock,
    GmailApiError: MockGmailApiError,
  }
})

function decodeRaw(raw: string): string {
  return Buffer.from(raw, 'base64url').toString('utf8')
}

/** buildDraftRawMessage base64-encodes the HTML body as its own MIME part
 * (wrapped to 76-char lines) -- pull that part out and decode it so tests
 * can assert on the literal HTML instead of matching against base64. */
function decodeHtmlBodyPart(raw: string): string {
  const message = decodeRaw(raw)
  const htmlPartMatch = message.match(
    /Content-Type: text\/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n([\s\S]*?)\r\n--av-draft-/,
  )
  if (!htmlPartMatch) throw new Error('Could not locate the HTML body part in the raw message')
  return Buffer.from(htmlPartMatch[1].replace(/\r\n/g, ''), 'base64').toString('utf8')
}

const TEST_PASSPHRASE = 'draft-email-contract-test'

function adminCookie(): string {
  return `av-admin-session=${mintAdminSessionToken(TEST_PASSPHRASE)}`
}

function request(id: string, authenticated = true, body?: unknown): NextRequest {
  const headers = new Headers()
  if (authenticated) headers.set('Cookie', adminCookie())
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  return new NextRequest(`http://localhost/api/admin/leads/${id}/draft-email`, {
    method: 'POST',
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

async function callRoute(id: string, authenticated = true, body?: unknown) {
  const { POST } = await import('@/app/api/admin/leads/[id]/draft-email/route')
  return POST(request(id, authenticated, body), { params: Promise.resolve({ id }) })
}

describe('POST /api/admin/leads/[id]/draft-email', () => {
  beforeEach(() => {
    sqlMock.mockReset()
    decryptTokenMock.mockReset()
    getGmailAccessTokenMock.mockReset()
    createGmailDraftMock.mockReset()
    getGmailDefaultSignatureMock.mockReset()
    loadEncodedCapabilityStatementMock.mockReset()
    draftLeadEmailMock.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
    vi.stubEnv('ADMIN_SESSION_SECRET', '')
    vi.stubEnv('GMAIL_CLIENT_ID', 'client-id')
    vi.stubEnv('GMAIL_CLIENT_SECRET', 'client-secret')
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key')
    loadEncodedCapabilityStatementMock.mockResolvedValue('ZmFrZS1wZGY=')
    getGmailAccessTokenMock.mockResolvedValue('access-token')
    getGmailDefaultSignatureMock.mockResolvedValue(null)
    draftLeadEmailMock.mockResolvedValue({
      subject: 'FERC weather analytics inquiry',
      bodyText: 'Hello,\n\nDrafted paragraph one.\n\nRespectfully,',
    })
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

  it.each([null, 'existing-message'])('blocks a removed lead before returning or generating draft %s', async (draftId) => {
    sqlMock.mockResolvedValueOnce([{
      id: 12, stage: 'qualified', removed_at: '2026-09-08T00:00:00Z',
      email: 'officer@ferc.gov', gmail_draft_id: draftId,
    }])

    const response = await callRoute('12')

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'Restore this lead before drafting an email' })
    expect(sqlMock).toHaveBeenCalledTimes(1)
    expect(createGmailDraftMock).not.toHaveBeenCalled()
  })

  it.each(['review', 'declined', 'lost', 'won'])('requires an active pursuit before drafting a %s lead', async (stage) => {
    sqlMock.mockResolvedValueOnce([{
      id: 12, stage, removed_at: null, email: 'officer@ferc.gov', gmail_draft_id: null,
    }])

    const response = await callRoute('12')

    expect(response.status).toBe(409)
    expect((await response.json()).error).toContain('Pursue this opportunity')
    expect(sqlMock).toHaveBeenCalledTimes(1)
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
    expect(draftLeadEmailMock).not.toHaveBeenCalled()
  })

  it.each(['new', 'contacted', 'qualified', 'proposal'])('allows the existing draft to be opened for an active %s lead', async (stage) => {
    sqlMock.mockResolvedValueOnce([{
      id: 12, stage, removed_at: null, email: 'officer@ferc.gov',
      gmail_draft_id: 'existing-message', gmail_draft_created_at: '2026-09-08T00:00:00Z',
    }])

    const response = await callRoute('12')

    expect(response.status).toBe(200)
    expect((await response.json()).messageId).toBe('existing-message')
    expect(createGmailDraftMock).not.toHaveBeenCalled()
  })

  it.each([null, 'old-message'])('does not draft to the old contact when an edit or removal wins the claim race (%s)', async (draftId) => {
    sqlMock
      .mockResolvedValueOnce([{
        id: 12, name: 'FERC lead', stage: 'new', removed_at: null,
        email: 'old-contact@ferc.gov', organization: 'FERC',
        gmail_draft_id: draftId, gmail_draft_created_at: null,
      }])
      .mockResolvedValueOnce([])

    const response = await callRoute('12', true, { regenerate: true })

    expect(response.status).toBe(409)
    const [strings, ...values] = sqlMock.mock.calls[1] as [TemplateStringsArray, ...unknown[]]
    const claimSql = strings.join('?')
    expect(claimSql).toContain('AND email = ?')
    expect(values).toContain('old-contact@ferc.gov')
    expect(claimSql).toContain('AND removed_at IS NULL')
    expect(claimSql).toContain("AND stage IN ('new', 'contacted', 'qualified', 'proposal')")
    expect(createGmailDraftMock).not.toHaveBeenCalled()
    expect(draftLeadEmailMock).not.toHaveBeenCalled()
  })

  it('releases only its exact claim after failure, preserving a newer claim and microsecond precision', async () => {
    const claimToken = '2026-09-08 10:01:02.123456+00'
    sqlMock
      .mockResolvedValueOnce([{
        id: 12, name: 'FERC lead', stage: 'new', removed_at: null,
        email: 'officer@ferc.gov', organization: 'FERC',
        gmail_draft_id: null, gmail_draft_created_at: null,
      }])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-09-08T10:01:02.123Z', claim_token: claimToken }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const response = await callRoute('12')

    expect(response.status).toBe(409)
    const [strings, ...values] = sqlMock.mock.calls[3] as [TemplateStringsArray, ...unknown[]]
    expect(strings.join('?')).toContain('AND gmail_draft_created_at = ?::timestamptz')
    expect(values).toEqual([12, claimToken])
    expect(createGmailDraftMock).not.toHaveBeenCalled()
  })

  it('does not overwrite or release a newer claim when a completed Gmail draft cannot be attached', async () => {
    const claimToken = '2026-09-08 10:01:02.123456+00'
    sqlMock
      .mockResolvedValueOnce([{
        id: 12, name: 'FERC lead', stage: 'qualified', removed_at: null,
        email: 'officer@ferc.gov', organization: 'FERC',
        gmail_draft_id: null, gmail_draft_created_at: null,
      }])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-09-08T10:01:02.123Z', claim_token: claimToken }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([])
    decryptTokenMock.mockReturnValue('plain-refresh-token')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')

    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({ messageId: 'msg-1', error: expect.stringContaining('Do not retry') })
    expect(sqlMock).toHaveBeenCalledTimes(4)
    const [strings, ...values] = sqlMock.mock.calls[3] as [TemplateStringsArray, ...unknown[]]
    const persistSql = strings.join('?')
    expect(persistSql).toContain('AND removed_at IS NULL')
    expect(persistSql).toContain("AND stage IN ('new', 'contacted', 'qualified', 'proposal')")
    expect(persistSql).toContain('AND email = ?')
    expect(persistSql).toContain('AND gmail_draft_created_at = ?::timestamptz')
    expect(values).toEqual(['msg-1', 'FERC weather analytics inquiry', undefined,
      12, 'officer@ferc.gov', claimToken])
  })

  it('rejects a lead with no contact email on file', async () => {
    sqlMock.mockResolvedValueOnce([
      { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: '', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
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
        stage: 'new',
        removed_at: null,
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
        stage: 'new',
        removed_at: null,
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
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([]) // claim UPDATE matched no row -- already claimed

    const response = await callRoute('12')
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'This lead changed or a draft is already being created -- refresh the lead and try again',
    })
    expect(sqlMock).toHaveBeenCalledTimes(2)
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
  })

  it('returns 409 asking to connect Gmail when no biz oauth_tokens row exists, and releases the claim', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]) // releaseClaim

    const response = await callRoute('12')
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'Connect the Aetheris Vision Gmail mailbox at /admin/gmail first',
      code: 'GMAIL_RECONNECT_REQUIRED',
      reconnectUrl: '/admin/gmail',
    })
    expect(sqlMock).toHaveBeenCalledTimes(4)
  })

  it('returns 409 without calling Gmail when the stored connection predates gmail.compose, and releases the claim', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.readonly' }])
      .mockResolvedValueOnce([]) // releaseClaim

    const response = await callRoute('12')
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error:
        'The connected Gmail mailbox needs to be reconnected with drafting permission at /admin/gmail',
      code: 'GMAIL_RECONNECT_REQUIRED',
      reconnectUrl: '/admin/gmail',
    })
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
  })

  it.each([
    {
      failure: new MockGmailApiError('Token has been expired or revoked.', 400, 'invalid_grant'),
      status: 409,
      body: {
        error: 'The business Gmail connection has expired or been revoked. Reconnect Business Gmail, then try drafting again.',
        code: 'GMAIL_RECONNECT_REQUIRED',
        reconnectUrl: '/admin/gmail',
      },
    },
    {
      failure: new MockGmailApiError('Service unavailable', 503),
      status: 502,
      body: { error: 'Gmail could not be reached for drafting. Try again in a moment.' },
    },
    {
      failure: new TypeError('fetch failed'),
      status: 502,
      body: { error: 'Gmail could not be reached for drafting. Try again in a moment.' },
    },
  ])('releases the claim and distinguishes Gmail renewal from retry on $failure.message', async ({ failure, status, body }) => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([])
    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailAccessTokenMock.mockRejectedValue(failure)

    const response = await callRoute('12')

    expect(response.status).toBe(status)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual(body)
    expect(sqlMock).toHaveBeenCalledTimes(4)
    expect(sqlMock.mock.calls[3][0].join(' ')).toContain('SET gmail_draft_created_at = NULL')
    expect(draftLeadEmailMock).not.toHaveBeenCalled()
    expect(createGmailDraftMock).not.toHaveBeenCalled()
  })

  it('treats an empty/whitespace-only stored scopes string as unknown, not as missing gmail.compose', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: '   ' }])
      .mockResolvedValueOnce([{ id: 12 }])

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailAccessTokenMock.mockResolvedValue('access-token')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')

    // Not blocked by the scope pre-check -- the Gmail API call itself is
    // what's authoritative when the stored scopes string is empty.
    expect(response.status).toBe(200)
    expect(getGmailAccessTokenMock).toHaveBeenCalled()
  })

  it('allows reclaiming a lead whose claim is older than the stale window (crash recovery)', async () => {
    sqlMock.mockResolvedValueOnce([
      { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
    ])
    sqlMock.mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:10:00.000Z', claim_token: '2026-08-30T00:10:00.000Z' }])
    sqlMock
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([{ id: 12 }])

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailAccessTokenMock.mockResolvedValue('access-token')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')
    expect(response.status).toBe(200)

    const [claimStrings] = sqlMock.mock.calls[1] as [TemplateStringsArray, ...unknown[]]
    expect(claimStrings.join(' ')).toContain("now() - interval '5 minutes'")
  })

  it('creates a draft, persists the message id, and returns a compose-deep-link URL', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([{ id: 12 }])

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
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
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
      code: 'GMAIL_RECONNECT_REQUIRED',
      reconnectUrl: '/admin/gmail',
    })
  })

  it('does NOT release the claim when the Gmail draft succeeds but the DB write fails -- prevents a retry from duplicating the draft', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
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

  it('rejects a lead org containing a stray CRLF before touching Gmail or claiming the lead', async () => {
    sqlMock.mockResolvedValueOnce([
      {
        id: 12,
        stage: 'new',
        removed_at: null,
        name: 'FERC lead',
        email: 'officer@ferc.gov',
        organization: 'FERC\r\nBcc: attacker@evil.example',
        gmail_draft_id: null,
        gmail_draft_created_at: null,
      },
    ])

    const response = await callRoute('12')

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error:
        "This lead's stored data could not be used to build a valid email -- check its name/organization/email for stray line breaks",
    })
    // Deterministic bad-data case, rejected before the DB claim and before
    // any Gmail call (token exchange, signature fetch) -- there's no point
    // spending either on a request that's already guaranteed to fail.
    expect(getGmailAccessTokenMock).not.toHaveBeenCalled()
    expect(createGmailDraftMock).not.toHaveBeenCalled()
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('embeds the live Gmail signature fetched via the mailbox\'s own default sendAs entry', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([
        { refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose', email: 'marston@aetherisvision.com' },
      ])
      .mockResolvedValueOnce([{ id: 12 }])

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailDefaultSignatureMock.mockResolvedValue('<table>AV2 signature</table>')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')

    expect(response.status).toBe(200)
    expect(getGmailDefaultSignatureMock).toHaveBeenCalledWith('access-token', 'marston@aetherisvision.com')
    expect(createGmailDraftMock).toHaveBeenCalled()
    const [, rawMessage] = createGmailDraftMock.mock.calls[0] as [string, string]
    expect(decodeHtmlBodyPart(rawMessage)).toContain('<table>AV2 signature</table>')
  })

  it('regenerate: detaches the existing draft atomically and creates a fresh one', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: 'old-msg', gmail_draft_created_at: '2026-08-29T00:00:00.000Z' },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }]) // regenerate claim
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([{ id: 12 }]) // final UPDATE

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-456', messageId: 'msg-2' })

    const response = await callRoute('12', true, { regenerate: true })
    expect(response.status).toBe(200)
    const data = (await response.json()) as { messageId: string }
    expect(data.messageId).toBe('msg-2')

    // The claim UPDATE must detach exactly the draft this request saw.
    const [claimStrings, ...claimParams] = sqlMock.mock.calls[1] as [TemplateStringsArray, ...unknown[]]
    expect(claimStrings.join(' ')).toContain('gmail_draft_id = NULL')
    expect(claimParams).toContain('old-msg')
    expect(draftLeadEmailMock).toHaveBeenCalled()
  })

  it('regenerate: returns 409 without drafting when another regenerate already detached the draft', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: 'old-msg', gmail_draft_created_at: '2026-08-29T00:00:00.000Z' },
      ])
      .mockResolvedValueOnce([]) // claim race lost

    const response = await callRoute('12', true, { regenerate: true })
    expect(response.status).toBe(409)
    expect(draftLeadEmailMock).not.toHaveBeenCalled()
    expect(createGmailDraftMock).not.toHaveBeenCalled()
  })

  it('regenerate: a plain POST with regenerate false is still the idempotent path', async () => {
    sqlMock.mockResolvedValueOnce([
      { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: 'old-msg', gmail_draft_created_at: '2026-08-29T00:00:00.000Z' },
    ])

    const response = await callRoute('12', true, { regenerate: false })
    expect(response.status).toBe(200)
    const data = (await response.json()) as { messageId: string }
    expect(data.messageId).toBe('old-msg')
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('uses the subscribed Claude worker without an Anthropic API key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    sqlMock
      .mockResolvedValueOnce([{
        id: 12, name: 'FERC lead', stage: 'new', removed_at: null,
        email: 'officer@ferc.gov', organization: 'FERC',
        gmail_draft_id: null, gmail_draft_created_at: null,
      }])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([{ id: 12 }])
    decryptTokenMock.mockReturnValue('plain-refresh-token')
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')

    expect(response.status).toBe(200)
    expect(draftLeadEmailMock).toHaveBeenCalledTimes(1)
    expect(createGmailDraftMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    'claude_worker_offline', 'claude_subscription_auth', 'claude_subscription_limit',
    'claude_job_failed', 'claude_job_timeout', 'claude_generation_timeout',
  ] as const)('surfaces actionable subscription error %s and releases its claim', async (code) => {
    sqlMock
      .mockResolvedValueOnce([{
        id: 12, name: 'FERC lead', stage: 'new', removed_at: null,
        email: 'officer@ferc.gov', organization: 'FERC',
        gmail_draft_id: null, gmail_draft_created_at: null,
      }])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([])
    decryptTokenMock.mockReturnValue('plain-refresh-token')
    draftLeadEmailMock.mockRejectedValue(new ClaudeSubscriptionError(code, 'Reconnect the Claude subscription worker.'))

    const response = await callRoute('12')

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ code, error: 'Reconnect the Claude subscription worker.' })
    expect(sqlMock).toHaveBeenCalledTimes(4)
    expect(sqlMock.mock.calls[3][0].join(' ')).toContain('SET gmail_draft_created_at = NULL')
    expect(createGmailDraftMock).not.toHaveBeenCalled()
  })

  it('fails loudly and releases the claim when the AI draft fails -- never falls back to a generic template', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([]) // releaseClaim

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    draftLeadEmailMock.mockRejectedValue(new Error('overloaded_error'))

    const response = await callRoute('12')

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'The email draft could not be written -- try again in a moment',
    })
    // The free token exchange runs first (it screens out a revoked Gmail
    // connection before Fable tokens are spent), but no draft is ever
    // created from a canned body.
    expect(getGmailAccessTokenMock).toHaveBeenCalled()
    expect(createGmailDraftMock).not.toHaveBeenCalled()
    // findLead, claim, oauth_tokens, releaseClaim.
    expect(sqlMock).toHaveBeenCalledTimes(4)
  })

  it('uses the AI-drafted subject and renders the drafted paragraphs into the HTML body', async () => {
    sqlMock
      .mockResolvedValueOnce([
        {
          id: 12,
          stage: 'new',
          removed_at: null,
          name: 'FERC lead',
          email: 'officer@ferc.gov',
          organization: 'FERC',
          notes: 'radar note',
          source: 'opportunity-radar',
          govcon: { analysis: 'strong fit' },
          gmail_draft_id: null,
          gmail_draft_created_at: null,
        },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([{ id: 12 }])

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    draftLeadEmailMock.mockResolvedValue({
      subject: 'Question on the FERC <analytics> program',
      bodyText: 'Hello,\n\nFirst paragraph & detail.\n\nRespectfully,',
    })
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')
    expect(response.status).toBe(200)

    // The full lead record (including the radar's govcon analysis) reaches
    // the drafting model.
    expect(draftLeadEmailMock).toHaveBeenCalledWith({
      title: 'FERC lead',
      organization: 'FERC',
      notes: 'radar note',
      source: 'opportunity-radar',
      govcon: { analysis: 'strong fit' },
    })

    const [, rawMessage] = createGmailDraftMock.mock.calls[0] as [string, string]
    const message = decodeRaw(rawMessage)
    // Subject is the AI's, not a canned "following up" template line.
    expect(message).toContain('FERC')
    expect(message).not.toContain('following up')
    const html = decodeHtmlBodyPart(rawMessage)
    expect(html).toContain('<p>Hello,</p>')
    expect(html).toContain('<p>First paragraph &amp; detail.</p>')
    expect(html).toContain('<p>Respectfully,</p>')
  })

  it('drafts without a signature (never blocks, never falls back to a stale copy) when the live signature fetch fails', async () => {
    sqlMock
      .mockResolvedValueOnce([
        { id: 12, stage: 'new', removed_at: null, name: 'FERC lead', email: 'officer@ferc.gov', organization: 'FERC', gmail_draft_id: null, gmail_draft_created_at: null },
      ])
      .mockResolvedValueOnce([{ gmail_draft_created_at: '2026-08-30T00:00:00.000Z', claim_token: '2026-08-30T00:00:00.000Z' }])
      .mockResolvedValueOnce([{ refresh_token: 'enc1:stored', scopes: 'https://www.googleapis.com/auth/gmail.compose' }])
      .mockResolvedValueOnce([{ id: 12 }])

    decryptTokenMock.mockReturnValue('plain-refresh-token')
    getGmailDefaultSignatureMock.mockRejectedValue(new MockGmailApiError('insufficient scope', 403))
    createGmailDraftMock.mockResolvedValue({ draftId: 'draft-123', messageId: 'msg-1' })

    const response = await callRoute('12')

    expect(response.status).toBe(200)
    expect(createGmailDraftMock).toHaveBeenCalled()
  })
})
