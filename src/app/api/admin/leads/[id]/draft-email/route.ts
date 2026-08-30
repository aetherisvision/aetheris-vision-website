/**
 * Creates a Gmail draft (never sends -- gmail.compose technically authorizes
 * drafts.send, but this app never calls it; draft-then-review stays a human
 * action taken in Gmail, see src/app/api/auth/gmail/start/route.ts)
 * addressed to a lead, with the capability statement attached and the
 * mailbox's own currently-configured default Gmail signature embedded
 * (fetched live via users.settings.sendAs -- the Gmail API does not apply a
 * mailbox's signature to drafts it creates itself, only its own compose UI
 * does that, and a signature fetched fresh per request can never drift out
 * of sync with whatever the human last edited in Gmail). Marston reviews
 * and sends it himself from Gmail.
 *
 * Subject and body are written per-lead by Claude (Fable) from the lead's
 * radar analysis -- see src/lib/lead-email-draft.ts for why there is no
 * template fallback when that call fails.
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
import { SITE } from '@/lib/constants'
import { sql } from '@/lib/db'
import { escapeHtml } from '@/lib/escape-html'
import {
  buildDraftRawMessage,
  createGmailDraft,
  getGmailAccessToken,
  getGmailDefaultSignature,
  GmailApiError,
} from '@/lib/gmail-client'
import { gmailDraftUrl } from '@/lib/gmail-draft-url'
import { draftLeadEmail } from '@/lib/lead-email-draft'
import { decryptToken } from '@/lib/token-crypto'

// The Fable drafting call can run tens of seconds; the platform default
// would cut the function off mid-draft.
export const maxDuration = 300

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

interface LeadForDraft {
  id: number
  name: string
  email: string
  organization: string | null
  notes: string | null
  source: string | null
  govcon: unknown
  gmail_draft_id: string | null
  gmail_draft_created_at: string | null
}

async function findLeadForDraft(id: number): Promise<LeadForDraft | null> {
  const rows = await sql`
    SELECT id, name, email, organization, notes, source, govcon, gmail_draft_id, gmail_draft_created_at
    FROM leads
    WHERE id = ${id}
  `
  return (rows as LeadForDraft[])[0] ?? null
}

/** Render the drafted plain-text body as the styled HTML Gmail part:
 * blank-line-separated paragraphs become <p>, single newlines become <br>. */
function buildEmailBody(bodyText: string, signatureHtml: string | null): string {
  const paragraphs = bodyText
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replace(/\r?\n/g, '<br>')}</p>`)
    .join('\n      ')
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.6;">
      ${paragraphs}
    </div>
    ${signatureHtml ?? ''}
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
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not configured')
    return json({ error: 'AI drafting is not configured on this deployment' }, { status: 500 })
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
  // lead.organization is interpolated raw into the subject line (via
  // SITE.name + lead.organization -- see below); the recipient (`to`) is
  // also a header value, but SINGLE_EMAIL_PATTERN above already excludes
  // CR/LF from it. Checked here, deterministically, before touching Gmail
  // at all -- buildDraftRawMessage would catch this too, but only after an
  // avoidable token exchange and live-signature fetch for a request that's
  // already guaranteed to fail.
  if (lead.organization && /[\r\n]/.test(lead.organization)) {
    return json(
      {
        error:
          "This lead's stored data could not be used to build a valid email -- check its name/organization/email for stray line breaks",
      },
      { status: 400 },
    )
  }

  // Atomically claim the lead before calling Gmail: two concurrent requests
  // (two tabs, or a retry racing the first request) would otherwise both
  // observe gmail_draft_id = null and both create a draft. Only the request
  // whose UPDATE actually matches a row proceeds; the loser is told to
  // retry rather than silently duplicating the draft. gmail_draft_created_at
  // set with gmail_draft_id still null means "claimed, in flight." A claim
  // older than CLAIM_STALE_AFTER can be taken over -- otherwise a process
  // that crashes between the claim and releaseClaim()/the final UPDATE
  // would wedge the lead in "in flight" forever, needing manual DB
  // intervention to recover. Five minutes of claim headroom and
  // maxDuration = 300 are a coupled pair: the claim is written after the
  // function starts, so it can only go stale after the platform has killed
  // the function (which now spends up to ~120s drafting with Claude) --
  // raise maxDuration past the claim window and a live request could be
  // taken over mid-flight.
  const claimRows = await sql`
    UPDATE leads
    SET gmail_draft_created_at = now()
    WHERE id = ${id}
      AND gmail_draft_id IS NULL
      AND (gmail_draft_created_at IS NULL OR gmail_draft_created_at < now() - interval '5 minutes')
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
      SELECT refresh_token, scopes, email FROM oauth_tokens WHERE account = ${GMAIL_ACCOUNT}
    `
    const tokenRow = (tokenRows as { refresh_token: string; scopes: string | null; email: string | null }[])[0]
    if (!tokenRow?.refresh_token) {
      throw new ClaimedRequestError(`Connect the ${SITE.name} Gmail mailbox at /admin/gmail first`, 409)
    }
    // scopes is only populated from a callback that ran after migration 007
    // -- a connection made before that has scopes = null and is given the
    // benefit of the doubt; the Gmail API call below is still the real check.
    // Exact token match, not substring -- a substring check on the raw
    // space-delimited scope string could false-positive on an unrelated
    // scope that happens to contain "gmail.compose". An empty/whitespace-
    // only string parses to an empty list, which is "unknown" the same as
    // null (not "known to lack the scope") -- treat it the same way.
    const grantedScopes = tokenRow.scopes?.split(/\s+/).filter(Boolean) ?? []
    if (grantedScopes.length > 0 && !grantedScopes.includes('https://www.googleapis.com/auth/gmail.compose')) {
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

    // Loaded before the Gmail token exchange: it's a deterministic local
    // prerequisite (either the file reads or it doesn't), so checking it
    // first avoids a wasted Gmail call -- and a misleading "reconnect
    // Gmail" error -- when the real problem is a broken attachment.
    let pdf: string
    try {
      pdf = await loadEncodedCapabilityStatement()
    } catch (error) {
      console.error(
        'Unable to load the capability statement attachment',
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw new ClaimedRequestError('The draft could not be prepared', 500)
    }

    let accessToken: string
    try {
      accessToken = await getGmailAccessToken(refreshToken)
    } catch (error) {
      console.error(
        'Unable to exchange the stored Gmail refresh token',
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw new ClaimedRequestError(
        'The stored Gmail connection could not be used -- reconnect at /admin/gmail',
        500,
      )
    }

    // The one paid step, placed after every check that can fail for free --
    // including the token exchange above, which is the only way to catch a
    // revoked Gmail connection before spending Fable tokens on a draft that
    // could never be delivered. The access token lives ~an hour, far past
    // the drafting call's 120s cap, so ordering costs nothing in freshness.
    let drafted: { subject: string; bodyText: string }
    try {
      drafted = await draftLeadEmail({
        title: lead.name,
        organization: lead.organization,
        notes: lead.notes,
        source: lead.source,
        govcon: lead.govcon,
      })
    } catch (error) {
      console.error(
        'Unable to draft the email with Claude',
        error instanceof Error ? error.message : 'Unknown error',
      )
      throw new ClaimedRequestError(
        'The email draft could not be written -- try again in a moment',
        502,
      )
    }

    // Soft-fail: a signature the mailbox owner reviews and can add himself
    // in two clicks at send time is a far safer failure mode than a stale
    // static copy that looks right and silently isn't -- never block draft
    // creation over this, and never fall back to a cached/static copy.
    let signatureHtml: string | null = null
    try {
      signatureHtml = await getGmailDefaultSignature(accessToken, tokenRow.email)
    } catch (error) {
      console.error(
        'Unable to fetch the live Gmail signature -- drafting without one',
        error instanceof Error ? error.message : 'Unknown error',
      )
    }

    // parseDraftedEmail already strips CR/LF from the subject; the slice is
    // just a sane header-length cap.
    const subject = drafted.subject.slice(0, 150)
    let raw: string
    try {
      raw = buildDraftRawMessage({
        to: recipient,
        subject,
        htmlBody: buildEmailBody(drafted.bodyText, signatureHtml),
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
