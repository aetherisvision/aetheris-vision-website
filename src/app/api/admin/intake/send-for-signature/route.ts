import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { markProposalSent } from '@/lib/crm'
import { sql } from '@/lib/db'
import {
  buildSignatureBlock,
  isRetrySafeDocuSealError,
  sendForSigning,
} from '@/lib/docuseal'

const MAX_SOW_LENGTH = 250_000

interface IntakeProjectRow {
  intake_id: number
  company_name: string
  contact_name: string
  contact_email: string
  project_id: number
  project_status: string
  docuseal_submission_id: string | null
  proposal_sent_at: Date | string | null
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readJsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json()
    return isRecord(value) ? value : null
  } catch {
    return null
  }
}

// Convert the limited Markdown used by SOW drafts to a full DocuSeal HTML document.
// Escape first so a draft cannot inject arbitrary HTML into the signing document.
function markdownToHtml(
  markdown: string,
  title: string,
  signerName: string,
  isSelfSign: boolean,
): string {
  const body = escapeHtml(markdown)
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/gm, (match) => `<ul>${match}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; padding: 48px 56px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #29426C; padding-bottom: 20px; margin-bottom: 32px; }
    .header h1 { font-size: 22pt; color: #29426C; font-weight: 700; margin-bottom: 4px; }
    .header .meta { font-size: 10pt; color: #555; }
    h1 { font-size: 18pt; color: #29426C; margin: 28px 0 8px; }
    h2 { font-size: 13pt; color: #29426C; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #dde4ed; }
    h3 { font-size: 11pt; color: #2c3e50; margin: 16px 0 6px; }
    p { margin: 8px 0; }
    ul { margin: 8px 0 8px 24px; }
    li { margin: 4px 0; }
    strong { color: #1a1a1a; }
    hr { border: none; border-top: 1px solid #dde4ed; margin: 20px 0; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #dde4ed; font-size: 9pt; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Statement of Work</h1>
    <div class="meta">
      Aetheris Vision LLC &nbsp;·&nbsp; 210 N Mustang Mall Terrace PMB 29, Mustang, OK 73064<br>
      contact@aetherisvision.com &nbsp;·&nbsp; aetherisvision.com
    </div>
  </div>
  <div class="content"><p>${body}</p></div>
  ${buildSignatureBlock(isSelfSign, escapeHtml(signerName))}
  <div class="footer">
    This Statement of Work is confidential and intended solely for the named parties.
    Aetheris Vision LLC · EIN 33-4818538 · Oklahoma LLC
  </div>
</body>
</html>`
}

async function finishProposalSend(input: {
  intakeId: number
  projectId: number
  submissionId: string
  sentAt?: Date | string
}) {
  await markProposalSent({
    projectId: input.projectId,
    docusealSubmissionId: input.submissionId,
    sentAt: input.sentAt,
  })

  // markProposalSent owns the CRM lifecycle. This legacy intake display status is
  // repaired separately so a retry can finish after a partial prior response.
  await sql`
    UPDATE intake_submissions
    SET status = 'sow_sent', updated_at = NOW()
    WHERE id = ${input.intakeId}
      AND project_id = ${input.projectId}
      AND status IN ('new', 'in_review', 'sow_sent')
  `
}

async function releaseProposalSendReservation(input: {
  projectId: number
  reservedAt: string
}): Promise<boolean> {
  const released = await sql`
    UPDATE projects
    SET proposal_sent_at = NULL, updated_at = NOW()
    WHERE id = ${input.projectId}
      AND status = 'proposal'
      AND docuseal_submission_id IS NULL
      AND proposal_sent_at = ${input.reservedAt}::timestamptz
    RETURNING id
  `
  return released.length === 1
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return unauthorizedResponse()
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_SOW_LENGTH + 10_000) {
    return json({ error: 'Request is too large' }, 413)
  }

  const body = await readJsonObject(request)
  const intakeId = body?.intake_id
  const rawSowContent = body?.sow_content

  if (!Number.isSafeInteger(intakeId) || (intakeId as number) < 1) {
    return json({ error: 'intake_id must be a positive integer' }, 400)
  }
  if (typeof rawSowContent !== 'string' || !rawSowContent.trim()) {
    return json({ error: 'sow_content is required' }, 400)
  }

  const sowContent = rawSowContent.trim()
  if (sowContent.length > MAX_SOW_LENGTH) {
    return json({ error: 'sow_content is too large' }, 413)
  }

  try {
    const rows = await sql`
      SELECT
        i.id AS intake_id,
        i.company_name,
        i.contact_name,
        i.contact_email,
        p.id AS project_id,
        p.status AS project_status,
        p.docuseal_submission_id,
        p.proposal_sent_at
      FROM intake_submissions i
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = ${intakeId as number}
      LIMIT 1
    `

    const intake = rows[0] as IntakeProjectRow | undefined
    if (!intake) {
      return json({ error: 'Intake not found or missing project' }, 404)
    }

    // A successful retry repairs the CRM/intake transition without creating a
    // second DocuSeal submission.
    if (intake.docuseal_submission_id) {
      await finishProposalSend({
        intakeId: intake.intake_id,
        projectId: intake.project_id,
        submissionId: intake.docuseal_submission_id,
        sentAt: intake.proposal_sent_at ?? undefined,
      })
      return json({
        success: true,
        already_sent: true,
        submission_id: intake.docuseal_submission_id,
        message: 'Statement of work was already sent for signature',
      })
    }

    if (intake.project_status !== 'proposal') {
      return json({ error: 'This project cannot accept a proposal' }, 409)
    }

    const companyName = String(intake.company_name ?? '').replace(/[\r\n]+/g, ' ').trim()
    const contactName = String(intake.contact_name ?? '').replace(/[\r\n]+/g, ' ').trim()
    const contactEmail = String(intake.contact_email ?? '').trim().toLowerCase()
    if (!companyName || !contactName || !contactEmail.includes('@')) {
      return json({ error: 'The intake contact information is incomplete' }, 409)
    }

    // Reserve this send atomically before the external call. proposal_sent_at is
    // also the durable in-progress marker that blocks parallel serverless requests
    // from creating duplicate DocuSeal submissions.
    const reservedAt = new Date().toISOString()
    const reservation = await sql`
      UPDATE projects
      SET proposal_sent_at = ${reservedAt}::timestamptz, updated_at = NOW()
      WHERE id = ${intake.project_id}
        AND status = 'proposal'
        AND docuseal_submission_id IS NULL
        AND proposal_sent_at IS NULL
      RETURNING proposal_sent_at
    `

    if (reservation.length === 0) {
      const currentRows = await sql`
        SELECT docuseal_submission_id, proposal_sent_at
        FROM projects
        WHERE id = ${intake.project_id}
        LIMIT 1
      `
      const current = currentRows[0] as
        | { docuseal_submission_id: string | null; proposal_sent_at: Date | string | null }
        | undefined

      if (current?.docuseal_submission_id) {
        await finishProposalSend({
          intakeId: intake.intake_id,
          projectId: intake.project_id,
          submissionId: current.docuseal_submission_id,
          sentAt: current.proposal_sent_at ?? undefined,
        })
        return json({
          success: true,
          already_sent: true,
          submission_id: current.docuseal_submission_id,
          message: 'Statement of work was already sent for signature',
        })
      }

      return json(
        {
          error: 'A signature request may already exist. Verify DocuSeal before trying again.',
          reconciliation_required: true,
        },
        409,
      )
    }

    const isSelfSign = contactEmail === 'marston@aetherisvision.com'
    const title = `SOW — ${companyName}`
    const htmlDoc = markdownToHtml(sowContent, title, contactName, isSelfSign)

    let submission: Awaited<ReturnType<typeof sendForSigning>>
    try {
      submission = await sendForSigning({
        html: htmlDoc,
        fileName: title,
        signerName: contactName,
        signerEmail: contactEmail,
      })
    } catch (error) {
      if (isRetrySafeDocuSealError(error)) {
        try {
          const released = await releaseProposalSendReservation({
            projectId: intake.project_id,
            reservedAt,
          })
          if (released) {
            return json(
              {
                error: 'DocuSeal rejected the signature request. Review the document and try again.',
                retryable: true,
              },
              502,
            )
          }
        } catch {
          // If release cannot be confirmed, keep the request blocked. A blind
          // retry could create two signing submissions.
        }
      }

      console.error('DocuSeal signature request needs reconciliation', {
        error: error instanceof Error ? error.name : 'UnknownError',
        projectId: intake.project_id,
      })
      return json(
        {
          error: 'The signature request could not be confirmed. Verify DocuSeal before trying again.',
          reconciliation_required: true,
        },
        503,
      )
    }

    const firstSubmitter = Array.isArray(submission) ? submission[0] : submission
    const submissionId = String(
      firstSubmitter?.submission_id ?? firstSubmitter?.id ?? submission?.id ?? '',
    ).trim()
    if (!submissionId || submissionId.length > 128) {
      return json(
        {
          error: 'DocuSeal accepted the request but did not return a usable submission ID. Verify DocuSeal before trying again.',
          reconciliation_required: true,
        },
        503,
      )
    }

    try {
      await finishProposalSend({
        intakeId: intake.intake_id,
        projectId: intake.project_id,
        submissionId,
        sentAt: reservedAt,
      })
    } catch (error) {
      console.error('DocuSeal submission needs lifecycle reconciliation', {
        error: error instanceof Error ? error.name : 'UnknownError',
        projectId: intake.project_id,
        submissionId,
      })
      return json(
        {
          error: 'The signature request was created but could not be recorded. Reconcile it before trying again.',
          submission_id: submissionId,
          reconciliation_required: true,
        },
        503,
      )
    }

    return json({
      success: true,
      submission_id: submissionId,
      message: 'Statement of work sent for signature',
    })
  } catch (error) {
    console.error('Send for signature failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    })
    return json({ error: 'Failed to send for signature' }, 500)
  }
}
