import { randomUUID } from 'node:crypto'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

/** Exchange a stored refresh token for a short-lived access token. Never
 * persisted -- callers use it for the duration of one request. */
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
  const data = await res.json()
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  return data.access_token
}

export class GmailApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'GmailApiError'
    this.status = status
  }
}

export interface DraftAttachment {
  filename: string
  mimeType: string
  base64Content: string
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
  const boundary = `av-draft-${randomUUID()}`
  const lines: string[] = [
    `To: ${options.to}`,
    `Subject: ${encodeHeaderValue(options.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(options.htmlBody, 'utf8').toString('base64'),
  ]

  if (options.attachment) {
    lines.push(
      '',
      `--${boundary}`,
      `Content-Type: ${options.attachment.mimeType}; name="${options.attachment.filename}"`,
      `Content-Disposition: attachment; filename="${options.attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      options.attachment.base64Content,
    )
  }

  lines.push('', `--${boundary}--`, '')

  return Buffer.from(lines.join('\r\n'), 'utf8').toString('base64url')
}

/** Create a Gmail draft -- never sends. Throws GmailApiError with the
 * response status so callers can distinguish "reconnect with a wider
 * scope" (403) from a transient failure. */
export async function createGmailDraft(
  accessToken: string,
  rawMessage: string,
): Promise<{ draftId: string; messageId: string | null }> {
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
  return { draftId: data.id, messageId: data.message?.id ?? null }
}
