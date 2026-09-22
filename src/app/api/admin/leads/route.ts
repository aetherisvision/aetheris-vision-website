import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin-auth'
import { updateLead, validateLeadActivity, type ManualLeadStage, type LeadActivityInput } from '@/lib/crm'
import { sql } from '@/lib/db'

const MANUAL_STAGES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'lost',
  'review',
  'declined',
] as const
const ALLOWED_FIELDS = new Set([
  'id',
  'stage',
  'estimated_value_cents',
  'next_follow_up',
  'notes',
])
const OPTIONAL_FIELDS = new Set(['email', 'phone', 'proposal_brief', 'expected_version', 'activity'])

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    ...init,
    headers: NO_STORE_HEADERS,
  })
}

function hasOwn(object: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function parsePositiveId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : Number.NaN
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function normalizeDateTime(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string' || !value.trim()) return undefined

  const parsed = new Date(value.trim())
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString()
}

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await request.json()
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
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
      l.gmail_draft_id,
      l.gmail_draft_created_at,
      l.govcon,
      l.govcon->'research_profile' AS research_profile,
      l.removed_at,
      l.removal_reason,
      l.workflow_version,
      l.activity_history,
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

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return json({ error: 'Unauthorized' }, { status: 401 })
  const includeRemoved = request.nextUrl.searchParams.get('include_removed') === 'true'

  try {
    const leads = await sql`
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
        l.gmail_draft_id,
        l.gmail_draft_created_at,
        l.govcon,
        l.govcon->'research_profile' AS research_profile,
        l.removed_at,
        l.removal_reason,
        l.workflow_version,
        l.activity_history,
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
      WHERE (${includeRemoved} OR l.removed_at IS NULL)
      ORDER BY l.created_at DESC, l.id DESC
    `

    return json({ leads })
  } catch (error) {
    console.error('Unable to list CRM leads', error instanceof Error ? error.message : 'Unknown error')
    return json({ error: 'Leads could not be loaded' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readBody(request)
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 })

  const keys = Object.keys(body)
  if (
    keys.some((key) => !ALLOWED_FIELDS.has(key) && !OPTIONAL_FIELDS.has(key)) ||
    [...ALLOWED_FIELDS].some((key) => !hasOwn(body, key))
  ) {
    return json(
      { error: 'id, stage, estimated_value_cents, next_follow_up, and notes are required' },
      { status: 400 },
    )
  }

  const id = parsePositiveId(body.id)
  if (id === null) return json({ error: 'Invalid lead ID' }, { status: 400 })

  if (
    typeof body.stage !== 'string' ||
    !MANUAL_STAGES.includes(body.stage as ManualLeadStage)
  ) {
    return json(
      { error: `stage must be one of: ${MANUAL_STAGES.join(', ')}` },
      { status: 400 },
    )
  }

  const estimatedValue = body.estimated_value_cents
  if (
    estimatedValue !== null &&
    (!Number.isSafeInteger(estimatedValue) ||
      (estimatedValue as number) < 0 ||
      (estimatedValue as number) > 2_147_483_647)
  ) {
    return json(
      { error: 'estimated_value_cents must be a non-negative integer or null' },
      { status: 400 },
    )
  }

  const nextFollowUp = normalizeDateTime(body.next_follow_up)
  if (nextFollowUp === undefined) {
    return json(
      { error: 'next_follow_up must be a valid date-time string or null' },
      { status: 400 },
    )
  }

  if (body.notes !== null && typeof body.notes !== 'string') {
    return json({ error: 'notes must be a string or null' }, { status: 400 })
  }
  const notes = typeof body.notes === 'string' ? body.notes.trim() || null : null
  if (notes && notes.length > 10_000) {
    return json({ error: 'notes must be 10,000 characters or fewer' }, { status: 400 })
  }

  const email = hasOwn(body, 'email') ? body.email : undefined
  if (email !== undefined && (typeof email !== 'string' || email.length > 254 ||
    !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email.trim()))) {
    return json({ error: 'Enter one valid contact email address' }, { status: 400 })
  }
  const phone = hasOwn(body, 'phone') ? body.phone : undefined
  if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 100 || /[\r\n]/.test(phone))) {
    return json({ error: 'Contact phone must be 100 characters or fewer on one line' }, { status: 400 })
  }
  const proposalBrief = hasOwn(body, 'proposal_brief') ? body.proposal_brief : undefined
  if (proposalBrief !== undefined && proposalBrief !== null &&
    (typeof proposalBrief !== 'string' || proposalBrief.length > 20_000)) {
    return json({ error: 'Proposal brief must be 20,000 characters or fewer' }, { status: 400 })
  }
  const expectedVersion = hasOwn(body, 'expected_version') ? body.expected_version : undefined
  if (expectedVersion !== undefined &&
    (!Number.isSafeInteger(expectedVersion) || (expectedVersion as number) < 0 || (expectedVersion as number) > 2_147_483_647)) {
    return json({ error: 'expected_version must be a non-negative integer' }, { status: 400 })
  }
  let activity: LeadActivityInput | undefined
  if (hasOwn(body, 'activity')) {
    if (expectedVersion === undefined) return json({ error: 'Activity updates require expected_version' }, { status: 400 })
    try { activity = validateLeadActivity(body.activity) }
    catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Invalid activity' }, { status: 400 })
    }
  }

  try {
    const existing = await sql`SELECT id FROM leads WHERE id = ${id}`
    if (!existing[0]) return json({ error: 'Lead not found' }, { status: 404 })

    await updateLead({
      leadId: id,
      stage: body.stage as ManualLeadStage,
      estimatedValueCents: estimatedValue as number | null,
      nextFollowUp,
      notes,
      ...(email !== undefined ? { email: (email as string).trim() } : {}),
      ...(phone !== undefined ? { phone: phone as string | null } : {}),
      ...(proposalBrief !== undefined ? { proposalBrief: proposalBrief as string | null } : {}),
      ...(expectedVersion !== undefined ? { expectedVersion: expectedVersion as number } : {}),
      ...(activity ? { activity } : {}),
    })

    const lead = await findLead(id)
    if (!lead) return json({ error: 'Lead not found' }, { status: 404 })
    return json({ lead })
  } catch (error) {
    console.error('Unable to update CRM lead', error instanceof Error ? error.message : 'Unknown error')
    return json(
      { error: 'This opportunity changed or is no longer editable. Refresh it before trying again.', code: 'LEAD_CONFLICT' },
      { status: 409 },
    )
  }
}
