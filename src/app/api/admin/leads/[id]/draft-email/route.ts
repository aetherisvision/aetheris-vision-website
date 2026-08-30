/**
 * Creates a Gmail draft (never sends -- gmail.compose only, see
 * src/app/api/auth/gmail/start/route.ts) addressed to a lead, with the
 * capability statement attached and the AV signature embedded (the Gmail
 * API does not apply a mailbox's configured signature to drafts it
 * creates). Marston reviews and sends it himself from Gmail.
 *
 * Always drafts from the 'biz' mailbox connected at /admin/gmail -- there is
 * no per-lead mailbox choice.
 */
import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin-auth'
import {
  CAPABILITY_STATEMENT_FILENAME,
  loadEncodedCapabilityStatement,
} from '@/lib/capability-statement'
import { sql } from '@/lib/db'
import { loadEmailSignatureHtml } from '@/lib/email-signature'
import { escapeHtml } from '@/lib/escape-html'
import {
  buildDraftRawMessage,
  createGmailDraft,
  getGmailAccessToken,
  GmailApiError,
} from '@/lib/gmail-client'
import { decryptToken } from '@/lib/token-crypto'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }
const GMAIL_ACCOUNT = 'biz'
// A lead's stored email must be exactly one mailbox -- no comma/semicolon
// (which Gmail's own To: parsing treats as a recipient list) and no
// whitespace, so it can never resolve to more than one recipient.
const SINGLE_EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: NO_STORE_HEADERS })
}

function parseLeadId(value: string): number | null {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

// Gmail's web UI deep-links an existing draft by its message id via a
// `compose` query param, not by the Drafts-API resource id -- gmail_draft_id
// stores that message id (see createGmailDraft's own doc comment).
function gmailDraftUrl(messageId: string): string {
  return `https://mail.google.com/mail/u/0/#drafts?compose=${encodeURIComponent(messageId)}`
}

interface LeadForDraft {
  id: number
  name: string
  email: string
  organization: string | null
  gmail_draft_id: string | null
  gmail_draft_created_at: string | null
}

async function findLeadForDraft(id: number): Promise<LeadForDraft | null> {
  const rows = await sql`
    SELECT id, name, email, organization, gmail_draft_id, gmail_draft_created_at
    FROM leads
    WHERE id = ${id}
  `
  return (rows as LeadForDraft[])[0] ?? null
}

function buildEmailBody(lead: LeadForDraft, signatureHtml: string): string {
  const context = lead.organization ? ` at ${escapeHtml(lead.organization)}` : ''
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.6;">
      <p>Hi,</p>
      <p>Thank you for the opportunity to follow up regarding ${escapeHtml(lead.name)}${context}. I've attached our capability statement for your review.</p>
      <p>Please let me know if you have any questions.</p>
      <p>Best regards,</p>
    </div>
    ${signatureHtml}
  `
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    console.error('GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET is not configured')
    return json({ error: 'Gmail is not configured on this deployment' }, { status: 500 })
  }

  const { id: idValue } = await params
  const id = parseLeadId(idValue)
  if (id === null) return json({ error: 'Invalid lead ID' }, { status: 400 })

  const lead = await findLeadForDraft(id)
  if (!lead) return json({ error: 'Lead not found' }, { status: 404 })

  // Idempotent: a repeat call (retry, direct API call) for a lead that
  // already has a finished draft returns it instead of creating another.
  if (lead.gmail_draft_id) {
    return json({
      messageId: lead.gmail_draft_id,
      draftUrl: gmailDraftUrl(lead.gmail_draft_id),
      draftedAt: lead.gmail_draft_created_at,
    })
  }

  if (!lead.email.trim()) {
    return json({ error: 'This lead has no contact email on file' }, { status: 400 })
  }
  const recipient = lead.email.trim()
  if (!SINGLE_EMAIL_PATTERN.test(recipient)) {
    return json(
      { error: "This lead's stored email is not a single valid address" },
      { status: 400 },
    )
  }

  // Atomically claim the lead before calling Gmail: two concurrent requests
  // (two tabs, or a retry racing the first request) would otherwise both
  // observe gmail_draft_id = null and both create a draft. Only the request
  // whose UPDATE actually matches a row proceeds; the loser is told to
  // retry rather than silently duplicating the draft. gmail_draft_created_at
  // set with gmail_draft_id still null means "claimed, in flight."
  const claimRows = await sql`
    UPDATE leads
    SET gmail_draft_created_at = now()
    WHERE id = ${id} AND gmail_draft_id IS NULL AND gmail_draft_created_at IS NULL
    RETURNING gmail_draft_created_at
  `
  const claim = (claimRows as { gmail_draft_created_at: string }[])[0]
  if (!claim) {
    return json(
      { error: 'A draft is already being created for this lead -- try again in a moment' },
      { status: 409 },
    )
  }

  // From here on, every exit must release the claim on failure -- otherwise
  // the lead is stuck permanently "in flight" (gmail_draft_created_at set,
  // gmail_draft_id still null) and every future attempt hits the 409 above.
  async function releaseClaim() {
    await sql`
      UPDATE leads
      SET gmail_draft_created_at = NULL
      WHERE id = ${id} AND gmail_draft_id IS NULL
    `.catch(() => undefined)
  }

  class ClaimedRequestError extends Error {
    readonly status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }

  try {
    const tokenRows = await sql`
      SELECT refresh_token, scopes FROM oauth_tokens WHERE account = ${GMAIL_ACCOUNT}
    `
    const tokenRow = (tokenRows as { refresh_token: string; scopes: string | null }[])[0]
    if (!tokenRow?.refresh_token) {
      throw new ClaimedRequestError('Connect the Aetheris Vision Gmail mailbox at /admin/gmail first', 409)
    }
    // scopes is only populated from a callback that ran after migration 007
    // -- a connection made before that has scopes = null and is given the
    // benefit of the doubt; the Gmail API call below is still the real check.
    if (tokenRow.scopes && !tokenRow.scopes.includes('gmail.compose')) {
      throw new ClaimedRequestError(
        'The connected Gmail mailbox needs to be reconnected with drafting permission at /admin/gmail',
        409,
      )
    }

    let refreshToken: string
    try {
      refreshToken = decryptToken(tokenRow.refresh_token)
    } catch (error) {
      console.error(
        'Unable to decrypt stored Gmail refresh token',
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw new ClaimedRequestError(
        'The stored Gmail connection is unreadable -- reconnect at /admin/gmail',
        500,
      )
    }

    let pdf: string
    let signatureHtml: string
    try {
      ;[pdf, signatureHtml] = await Promise.all([
        loadEncodedCapabilityStatement(),
        loadEmailSignatureHtml(),
      ])
    } catch (error) {
      console.error(
        'Unable to load draft-email attachments',
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw new ClaimedRequestError('The draft could not be prepared', 500)
    }

    const subject = `Aetheris Vision -- following up${lead.organization ? ` with ${lead.organization}` : ''}`
    let raw: string
    try {
      raw = buildDraftRawMessage({
        to: recipient,
        subject,
        htmlBody: buildEmailBody(lead, signatureHtml),
        attachment: {
          filename: CAPABILITY_STATEMENT_FILENAME,
          mimeType: 'application/pdf',
          base64Content: pdf,
        },
      })
    } catch (error) {
      // Deterministic bad-data case (e.g. a lead's organization contains a
      // stray CR/LF) -- admin-actionable, not a Gmail/network failure.
      console.error(
        'Unable to build the draft message',
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw new ClaimedRequestError(
        "This lead's stored data could not be used to build a valid email -- check its name/organization/email for stray line breaks",
        400,
      )
    }

    let messageId: string
    try {
      const accessToken = await getGmailAccessToken(refreshToken)
      ;({ messageId } = await createGmailDraft(accessToken, raw))
    } catch (error) {
      if (error instanceof GmailApiError && error.status === 403) {
        console.error('Gmail draft creation failed -- insufficient scope', error.message)
        throw new ClaimedRequestError(
          'The connected Gmail mailbox needs to be reconnected with drafting permission at /admin/gmail',
          409,
        )
      }
      console.error(
        'Unable to create Gmail draft',
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw new ClaimedRequestError('The draft could not be created', 502)
    }

    // A real Gmail draft exists from this point on. A failure below must
    // NOT release the claim -- releasing it would let a retry call Gmail
    // again and create a second, orphaned draft with no DB record of the
    // first. Leaving the lead "claimed" (in flight) is the safe failure
    // mode here; a human resolves it manually using the message id logged
    // below, rather than the route silently duplicating outbound mail.
    try {
      await sql`UPDATE leads SET gmail_draft_id = ${messageId} WHERE id = ${id}`
    } catch (error) {
      console.error(
        'Gmail draft was created but could not be recorded on the lead -- do not retry',
        { leadId: id, messageId, error: error instanceof Error ? error.message : 'Unknown error' },
      )
      return json(
        {
          error: `A Gmail draft was created (message ${messageId}) but could not be saved to this lead. Do not retry -- open the draft in Gmail directly and update the lead's notes.`,
          messageId,
          draftUrl: gmailDraftUrl(messageId),
        },
        { status: 500 },
      )
    }

    return json({
      messageId,
      draftUrl: gmailDraftUrl(messageId),
      draftedAt: claim.gmail_draft_created_at,
    })
  } catch (error) {
    await releaseClaim()
    if (error instanceof ClaimedRequestError) {
      return json({ error: error.message }, { status: error.status })
    }
    console.error(
      'Unable to create Gmail draft',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({ error: 'The draft could not be created' }, { status: 502 })
  }
}
