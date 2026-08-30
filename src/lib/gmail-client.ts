import { randomUUID } from 'node:crypto'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

export class GmailApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'GmailApiError'
    this.status = status
  }
}

/** Exchange a stored refresh token for a short-lived access token. Never
 * persisted -- callers use it for the duration of one request. Throws
 * GmailApiError (not a plain Error) with the real HTTP status so callers can
 * tell a revoked/expired refresh token (400 invalid_grant) apart from a
 * transient failure, and so the error carries status context even if
 * Google's response isn't the JSON body this endpoint normally returns. */
export async function getGmailAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const text = await res.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Google token endpoint JSON
  let data: any
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  if (!res.ok || typeof data.access_token !== 'string') {
    const message =
      typeof data.error_description === 'string'
        ? data.error_description
        : typeof data.error === 'string'
          ? data.error
          : 'Token refresh failed'
    throw new GmailApiError(message, res.status)
  }
  return data.access_token
}

export interface DraftAttachment {
  filename: string
  mimeType: string
  base64Content: string
}

/** Reject a value that could inject additional MIME headers (e.g. a CRLF in
 * a lead's stored email/org name adding a Bcc: line) instead of silently
 * stripping it -- a header value that isn't single-line indicates bad or
 * malicious upstream data, not something safe to guess at and continue. */
function assertSingleLineHeaderValue(value: string, field: string): string {
  if (/[\r\n]/.test(value)) throw new Error(`${field} must not contain line breaks`)
  return value
}

/** RFC 2045 caps base64-encoded body lines at 76 characters -- some MIME
 * parsers enforce that. A single unbroken line (the HTML part once the
 * signature is embedded, and any real PDF attachment) is out of spec. */
function wrapBase64(base64: string): string {
  const LINE_LENGTH = 76
  const lines: string[] = []
  for (let index = 0; index < base64.length; index += LINE_LENGTH) {
    lines.push(base64.slice(index, index + LINE_LENGTH))
  }
  return lines.join('\r\n')
}

function encodeHeaderValue(value: string): string {
  // Lead titles/org names sourced from SAM.gov etc. are ASCII in practice,
  // but a header carrying a real email must not assume that.
  if (/^[\x20-\x7e]*$/.test(value)) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

/** Build a base64url-encoded RFC 2822 message for the Gmail API's `raw`
 * field. Both the HTML body and the attachment (if any) are base64-encoded
 * as their own MIME parts -- simpler and safer than quoted-printable for
 * text sourced from arbitrary lead/agency names. */
export function buildDraftRawMessage(options: {
  to: string
  subject: string
  htmlBody: string
  attachment?: DraftAttachment
}): string {
  const to = assertSingleLineHeaderValue(options.to.trim(), 'to')
  const subject = assertSingleLineHeaderValue(options.subject.trim(), 'subject')

  const boundary = `av-draft-${randomUUID()}`
  const lines: string[] = [
    `To: ${to}`,
    `Subject: ${encodeHeaderValue(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(Buffer.from(options.htmlBody, 'utf8').toString('base64')),
  ]

  if (options.attachment) {
    const filename = assertSingleLineHeaderValue(options.attachment.filename, 'attachment filename')
    if (filename.includes('"')) throw new Error('attachment filename must not contain a quote character')
    lines.push(
      '',
      `--${boundary}`,
      `Content-Type: ${options.attachment.mimeType}; name="${filename}"`,
      `Content-Disposition: attachment; filename="${filename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(options.attachment.base64Content),
    )
  }

  lines.push('', `--${boundary}--`, '')

  return Buffer.from(lines.join('\r\n'), 'utf8').toString('base64url')
}

/** Create a Gmail draft -- never sends. Throws GmailApiError with the
 * response status so callers can distinguish "reconnect with a wider
 * scope" (403) from a transient failure.
 *
 * Returns both ids: `draftId` is the Gmail *draft resource* id (only useful
 * for further Drafts API calls -- get/update/delete); `messageId` is the id
 * Gmail's own web UI actually deep-links by (`#drafts?compose=<messageId>`,
 * not `#drafts/<draftId>`), so callers building a link for a human to click
 * must use `messageId`. */
export async function createGmailDraft(
  accessToken: string,
  rawMessage: string,
): Promise<{ draftId: string; messageId: string }> {
  const res = await fetch(`${GMAIL_API}/users/me/drafts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw: rawMessage } }),
  })
  const text = await res.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Gmail API JSON
  let data: any
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  if (!res.ok) {
    const message = typeof data?.error?.message === 'string' ? data.error.message : 'Gmail API error'
    throw new GmailApiError(message, res.status)
  }
  if (!data.id || !data.message?.id) {
    throw new Error('Gmail draft creation returned an unexpected response shape')
  }
  return { draftId: data.id, messageId: data.message.id }
}
