import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { markEngagementSigned } from '@/lib/crm'
import { sql } from '@/lib/db'
import { downloadSignedPdf, getSubmission } from '@/lib/docuseal'

const MAX_SIGNED_PDF_BYTES = 25 * 1024 * 1024

interface PendingSubmissionRow {
  project_id: number
  docuseal_submission_id: string
  has_signed_pdf: boolean
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
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

// Polling is a recovery path for a missed webhook. The same lifecycle service used
// by the webhook makes repeated polling safe.
async function syncSignedSubmissions() {
  const pending = await sql`
    SELECT
      p.id AS project_id,
      p.docuseal_submission_id,
      (p.signed_pdf_base64 IS NOT NULL) AS has_signed_pdf
    FROM intake_submissions i
    JOIN projects p ON p.id = i.project_id
    WHERE i.status = 'sow_sent'
      AND p.status IN ('proposal', 'signed', 'active')
      AND p.docuseal_submission_id IS NOT NULL
  `

  for (const value of pending) {
    const row = value as PendingSubmissionRow
    try {
      const submission = await getSubmission(row.docuseal_submission_id)
      if (submission?.status !== 'completed') continue

      // Persist the signed artifact first. If the lifecycle transition then fails,
      // the still-pending intake will safely retry without losing the document.
      if (!row.has_signed_pdf) {
        const pdfBuffer = await downloadSignedPdf(row.docuseal_submission_id)
        if (pdfBuffer.byteLength > MAX_SIGNED_PDF_BYTES) {
          throw new Error('Signed PDF exceeds storage limit')
        }
        const pdfBase64 = pdfBuffer.toString('base64')
        await sql`
          UPDATE projects
          SET signed_pdf_base64 = COALESCE(signed_pdf_base64, ${pdfBase64}),
              updated_at = NOW()
          WHERE id = ${row.project_id}
            AND docuseal_submission_id = ${row.docuseal_submission_id}
        `
      }

      await markEngagementSigned({
        projectId: row.project_id,
        docusealSubmissionId: row.docuseal_submission_id,
      })
    } catch (error) {
      console.error('Failed to synchronize a DocuSeal submission', {
        error: error instanceof Error ? error.name : 'UnknownError',
      })
    }
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return unauthorizedResponse()
  }

  try {
    await syncSignedSubmissions()

    const submissions = await sql`
      SELECT
        i.id,
        i.status,
        i.company_name,
        i.industry,
        i.location,
        i.revenue,
        i.contact_name,
        i.contact_title,
        i.contact_email,
        i.contact_phone,
        i.budget_range,
        i.timeline,
        i.objectives,
        i.special_requirements,
        i.questions_for_us,
        i.client_id,
        i.project_id,
        i.pro_bono,
        i.platform_preference,
        i.submitted_at
      FROM intake_submissions i
      ORDER BY i.submitted_at DESC
    `
    return json({ submissions })
  } catch (error) {
    console.error('Failed to fetch intake submissions', {
      error: error instanceof Error ? error.name : 'UnknownError',
    })
    return json({ error: 'Failed to fetch submissions' }, 500)
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return unauthorizedResponse()
  }

  const body = await readJsonObject(request)
  const id = body?.id
  if (!Number.isSafeInteger(id) || (id as number) < 1) {
    return json({ error: 'id must be a positive integer' }, 400)
  }

  try {
    if (body?.status === 'won') {
      return json(
        { error: 'Signed status is set automatically when the agreement is completed' },
        409,
      )
    }

    if (body && 'pro_bono' in body) {
      if (typeof body.pro_bono !== 'boolean') {
        return json({ error: 'pro_bono must be a boolean' }, 400)
      }

      const updated = await sql`
        UPDATE intake_submissions
        SET pro_bono = ${body.pro_bono}, updated_at = NOW()
        WHERE id = ${id as number}
        RETURNING id
      `
      if (updated.length === 0) {
        return json({ error: 'Intake not found' }, 404)
      }
      return json({ success: true })
    }

    const status = body?.status
    const validStatuses = ['new', 'in_review', 'sow_sent', 'lost']
    if (typeof status !== 'string' || !validStatuses.includes(status)) {
      return json({ error: 'Invalid status' }, 400)
    }

    // A signed engagement cannot be reopened by this legacy intake control.
    const updated = await sql`
      UPDATE intake_submissions
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id as number}
        AND status <> 'won'
      RETURNING id
    `
    if (updated.length === 0) {
      return json({ error: 'Intake not found or status is managed by the signed engagement' }, 409)
    }
    return json({ success: true })
  } catch (error) {
    console.error('Failed to update intake', {
      error: error instanceof Error ? error.name : 'UnknownError',
    })
    return json({ error: 'Failed to update intake' }, 500)
  }
}
