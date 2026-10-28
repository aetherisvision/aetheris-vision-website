import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'

const DOCUSEAL_SUBMISSION_ID_RE = /^[A-Za-z0-9_-]{1,128}$/

function normalizeDocuSealSubmissionId(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') throw new Error('docuseal_submission_id must be a string')
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!DOCUSEAL_SUBMISSION_ID_RE.test(trimmed)) {
    throw new Error('docuseal_submission_id must be 1–128 alphanumeric, hyphen, or underscore characters')
  }
  return trimmed
}

function normalizePreviewUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') throw new Error('preview_url must be a string')
  const trimmed = value.trim()
  if (!trimmed) return null
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('preview_url must be a valid https:// URL')
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('preview_url must be a valid https:// URL')
  }
  return parsed.toString()
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const projects = await sql`
    SELECT p.id, p.name, p.status, p.current_phase, p.start_date,
           p.docuseal_submission_id, p.signed_at, p.preview_url,
           (p.signed_pdf_base64 IS NOT NULL) AS has_signed_pdf,
           p.phase_proposal_date, p.phase_kickoff_date, p.phase_design_date,
           p.phase_development_date, p.phase_review_date, p.phase_launched_date,
           c.name AS client_name, p.client_id,
           (
             p.status = 'proposal'
             AND p.client_id IS NULL
             AND p.lead_id IS NULL
             AND p.source IS NULL
             AND p.external_id IS NULL
             AND p.proposal_sent_at IS NULL
             AND p.docuseal_submission_id IS NULL
             AND p.signed_pdf_base64 IS NULL
             AND p.signed_at IS NULL
             AND p.deposit_amount_cents IS NULL
             AND p.start_date IS NULL
             AND p.end_date IS NULL
             AND COALESCE(p.current_phase, 'proposal') = 'proposal'
             AND p.phase_proposal_date IS NULL
             AND p.phase_kickoff_date IS NULL
             AND p.phase_design_date IS NULL
             AND p.phase_development_date IS NULL
             AND p.phase_review_date IS NULL
             AND p.phase_launched_date IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM intake_submissions i
               WHERE i.project_id = p.id
             )
             AND NOT EXISTS (
               SELECT 1 FROM invoices invoice
               WHERE invoice.project_id = p.id
             )
             AND NOT EXISTS (
               SELECT 1 FROM documents document
               WHERE document.project_id = p.id
             )
           ) AS can_delete
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    ORDER BY p.created_at DESC
  `
  return NextResponse.json({ projects })
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const body = await request.json()
  const {
    id,
    current_phase,
    phase_proposal_date,
    phase_kickoff_date,
    phase_design_date,
    phase_development_date,
    phase_review_date,
    phase_launched_date,
    docuseal_submission_id,
    preview_url,
  } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  let normalizedSubmissionId: string | null | undefined
  let normalizedPreview: string | null | undefined
  try {
    normalizedSubmissionId = normalizeDocuSealSubmissionId(docuseal_submission_id)
    normalizedPreview = normalizePreviewUrl(preview_url)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid project fields' },
      { status: 400 },
    )
  }

  const hasCurrentPhase = 'current_phase' in body && current_phase !== undefined
  const hasProposalDate = 'phase_proposal_date' in body
  const hasKickoffDate = 'phase_kickoff_date' in body
  const hasDesignDate = 'phase_design_date' in body
  const hasDevelopmentDate = 'phase_development_date' in body
  const hasReviewDate = 'phase_review_date' in body
  const hasLaunchedDate = 'phase_launched_date' in body
  const hasSubmissionPatch = normalizedSubmissionId !== undefined
  const hasPreviewPatch = normalizedPreview !== undefined

  try {
    await sql`
      UPDATE projects SET
        current_phase          = CASE
          WHEN ${hasCurrentPhase} THEN ${current_phase ?? null}
          ELSE current_phase
        END,
        phase_proposal_date    = CASE
          WHEN ${hasProposalDate} THEN ${phase_proposal_date ?? null}
          ELSE phase_proposal_date
        END,
        phase_kickoff_date     = CASE
          WHEN ${hasKickoffDate} THEN ${phase_kickoff_date ?? null}
          ELSE phase_kickoff_date
        END,
        phase_design_date      = CASE
          WHEN ${hasDesignDate} THEN ${phase_design_date ?? null}
          ELSE phase_design_date
        END,
        phase_development_date = CASE
          WHEN ${hasDevelopmentDate} THEN ${phase_development_date ?? null}
          ELSE phase_development_date
        END,
        phase_review_date      = CASE
          WHEN ${hasReviewDate} THEN ${phase_review_date ?? null}
          ELSE phase_review_date
        END,
        phase_launched_date    = CASE
          WHEN ${hasLaunchedDate} THEN ${phase_launched_date ?? null}
          ELSE phase_launched_date
        END,
        docuseal_submission_id = CASE
          WHEN ${hasSubmissionPatch} THEN ${normalizedSubmissionId ?? null}
          ELSE docuseal_submission_id
        END,
        proposal_sent_at       = CASE
          WHEN ${hasSubmissionPatch} AND ${normalizedSubmissionId ?? null}::text IS NOT NULL
            THEN COALESCE(proposal_sent_at, NOW())
          ELSE proposal_sent_at
        END,
        preview_url            = CASE
          WHEN ${hasPreviewPatch} THEN ${normalizedPreview ?? null}
          ELSE preview_url
        END,
        updated_at             = NOW()
      WHERE id = ${Number(id)}
    `
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    const message = error instanceof Error ? error.message : String(error)
    if (
      code === '23505' ||
      message.includes('projects_docuseal_submission_uidx') ||
      message.toLowerCase().includes('duplicate key')
    ) {
      return NextResponse.json(
        { error: 'That DocuSeal submission ID is already linked to another project' },
        { status: 409 },
      )
    }
    throw error
  }
  return NextResponse.json({ ok: true })
}
