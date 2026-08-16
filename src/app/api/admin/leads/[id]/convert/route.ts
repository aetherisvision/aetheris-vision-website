import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin-auth'
import { prepareLeadProposal } from '@/lib/crm'
import { sql } from '@/lib/db'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    ...init,
    headers: NO_STORE_HEADERS,
  })
}

function parseLeadId(value: string): number | null {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

async function findLead(id: number) {
  const rows = await sql`
    SELECT
      l.id,
      l.name,
      l.email,
      l.organization,
      l.phone,
      l.service,
      l.message,
      l.source,
      l.stage,
      l.estimated_value_cents,
      l.next_follow_up,
      l.notes,
      l.client_id,
      recent_project.id AS project_id,
      recent_intake.id AS intake_id,
      c.relationship_status,
      recent_project.status AS project_status,
      l.created_at
    FROM leads l
    LEFT JOIN clients c ON c.id = l.client_id
    LEFT JOIN LATERAL (
      SELECT p.id, p.status
      FROM projects p
      WHERE p.lead_id = l.id
      ORDER BY
        CASE p.status
          WHEN 'active' THEN 0
          WHEN 'signed' THEN 1
          WHEN 'proposal' THEN 2
          ELSE 3
        END,
        p.created_at DESC,
        p.id DESC
      LIMIT 1
    ) recent_project ON TRUE
    LEFT JOIN LATERAL (
      SELECT i.id
      FROM intake_submissions i
      WHERE i.lead_id = l.id
      ORDER BY COALESCE(i.created_at, i.submitted_at) DESC, i.id DESC
      LIMIT 1
    ) recent_intake ON TRUE
    WHERE l.id = ${id}
  `
  return rows[0] ?? null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idValue } = await params
  const id = parseLeadId(idValue)
  if (id === null) return json({ error: 'Invalid lead ID' }, { status: 400 })

  try {
    const beforeRows = await sql`
      SELECT
        l.id,
        l.name,
        l.organization,
        l.service,
        l.stage,
        l.client_id,
        matching_client.id AS matching_client_id,
        proposal_project.id AS proposal_project_id
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT c.id
        FROM clients c
        WHERE lower(btrim(c.email)) = lower(btrim(l.email))
        LIMIT 1
      ) matching_client ON TRUE
      LEFT JOIN LATERAL (
        SELECT p.id
        FROM projects p
        WHERE p.source = 'lead_promotion'
          AND p.external_id = 'lead:' || l.id::text
        LIMIT 1
      ) proposal_project ON TRUE
      WHERE l.id = ${id}
    `
    const before = beforeRows[0] as
      | {
          name: string
          organization: string | null
          service: string | null
          stage: string
          client_id: number | null
          matching_client_id: number | null
          proposal_project_id: number | null
        }
      | undefined

    if (!before) return json({ error: 'Lead not found' }, { status: 404 })
    if (before.stage === 'won' || before.stage === 'lost') {
      return json({ error: 'A closed lead cannot be prepared for proposal' }, { status: 409 })
    }

    const accountName = before.organization?.trim() || before.name.trim()
    const serviceName = before.service?.trim()
    const projectName = serviceName
      ? `${accountName} — ${serviceName}`
      : `${accountName} project`

    const result = await prepareLeadProposal({ leadId: id, projectName })
    const lead = await findLead(id)

    return json({
      lead,
      clientId: result.clientId,
      projectId: result.projectId,
      clientCreated: !before.client_id && !before.matching_client_id,
      projectCreated: !before.proposal_project_id,
    })
  } catch (error) {
    console.error(
      'Unable to prepare CRM proposal',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json(
      { error: 'The proposal could not be prepared from this lead' },
      { status: 409 },
    )
  }
}
