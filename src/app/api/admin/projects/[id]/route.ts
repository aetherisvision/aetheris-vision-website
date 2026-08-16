import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

const MAX_POSTGRES_INTEGER = 2_147_483_647

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function routeId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id <= MAX_POSTGRES_INTEGER ? id : null
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return json({ error: 'Unauthorized' }, 401)

  const { id: idValue } = await params
  const id = routeId(idValue)
  if (id === null) return json({ error: 'Project id must be a positive integer' }, 400)

  try {
    const deleted = await sql`
      DELETE FROM projects AS project
      WHERE project.id = ${id}
        AND project.status = 'proposal'
        AND project.client_id IS NULL
        AND project.lead_id IS NULL
        AND project.source IS NULL
        AND project.external_id IS NULL
        AND project.proposal_sent_at IS NULL
        AND project.docuseal_submission_id IS NULL
        AND project.signed_pdf_base64 IS NULL
        AND project.signed_at IS NULL
        AND project.deposit_amount_cents IS NULL
        AND project.start_date IS NULL
        AND project.end_date IS NULL
        AND COALESCE(project.current_phase, 'proposal') = 'proposal'
        AND project.phase_proposal_date IS NULL
        AND project.phase_kickoff_date IS NULL
        AND project.phase_design_date IS NULL
        AND project.phase_development_date IS NULL
        AND project.phase_review_date IS NULL
        AND project.phase_launched_date IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM intake_submissions AS intake
          WHERE intake.project_id = project.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM invoices AS invoice
          WHERE invoice.project_id = project.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM documents AS document
          WHERE document.project_id = project.id
        )
      RETURNING project.id
    `

    if (deleted.length) return json({ ok: true })

    const existing = await sql`SELECT id FROM projects WHERE id = ${id}`
    if (!existing.length) return json({ error: 'Project not found' }, 404)

    return json({
      error: 'Only unused proposals with no client, CRM, delivery, or billing links can be deleted',
    }, 409)
  } catch {
    return json({ error: 'Unable to delete project' }, 500)
  }
}
