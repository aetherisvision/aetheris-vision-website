import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { sql } from '@/lib/db'

const RELATIONSHIP_STATUSES = ['prospect', 'active', 'on_hold', 'complete', 'archived'] as const
type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number]

const ALLOWED_FIELDS = new Set(['relationship_status', 'next_touch', 'notes'])

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function mediaTypeIsJson(request: NextRequest): boolean {
  return request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json'
}

function hasOwn(object: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function parseClientId(value: string): number | null {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function normalizeNextTouch(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string' || !value.trim()) return undefined

  const parsed = new Date(value.trim())
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString()
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { id: idValue } = await params
  const id = parseClientId(idValue)
  if (id === null) {
    return json({ error: 'Invalid client ID' }, 400)
  }

  if (!mediaTypeIsJson(request)) {
    return json({ error: 'Content-Type must be application/json' }, 415)
  }

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Request body must be an object')
    }
    body = parsed as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  const keys = Object.keys(body)
  if (keys.length === 0 || keys.some((key) => !ALLOWED_FIELDS.has(key))) {
    return json(
      { error: 'Only relationship_status, next_touch, and notes may be updated' },
      400,
    )
  }

  const hasRelationshipStatus = hasOwn(body, 'relationship_status')
  const hasNextTouch = hasOwn(body, 'next_touch')
  const hasNotes = hasOwn(body, 'notes')

  let relationshipStatus: RelationshipStatus | null = null
  if (hasRelationshipStatus) {
    if (
      typeof body.relationship_status !== 'string' ||
      !RELATIONSHIP_STATUSES.includes(body.relationship_status as RelationshipStatus)
    ) {
      return json(
        { error: `relationship_status must be one of: ${RELATIONSHIP_STATUSES.join(', ')}` },
        400,
      )
    }
    relationshipStatus = body.relationship_status as RelationshipStatus
  }

  const nextTouch = hasNextTouch ? normalizeNextTouch(body.next_touch) : null
  if (hasNextTouch && nextTouch === undefined) {
    return json(
      { error: 'next_touch must be a valid date-time string or null' },
      400,
    )
  }

  let notes: string | null = null
  if (hasNotes) {
    if (body.notes !== null && typeof body.notes !== 'string') {
      return json(
        { error: 'notes must be a string or null' },
        400,
      )
    }
    notes = typeof body.notes === 'string' ? body.notes.trim() || null : null
    if (notes && notes.length > 10_000) {
      return json(
        { error: 'notes must be 10,000 characters or fewer' },
        400,
      )
    }
  }

  try {
    const rows = await sql`
      UPDATE clients
      SET
        relationship_status = CASE
          WHEN ${hasRelationshipStatus} THEN ${relationshipStatus}::text
          ELSE relationship_status
        END,
        next_touch = CASE
          WHEN ${hasNextTouch} THEN ${nextTouch ?? null}::timestamptz
          ELSE next_touch
        END,
        notes = CASE
          WHEN ${hasNotes} THEN ${notes}::text
          ELSE notes
        END,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, contact_name, email, phone, relationship_status,
                next_touch, notes, created_at, updated_at
    `

    if (!rows[0]) {
      return json({ error: 'Client not found' }, 404)
    }

    return json({ client: rows[0] })
  } catch {
    console.error('Unable to update client record')
    return json({ error: 'Unable to update client record' }, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { id: idValue } = await params
  const id = parseClientId(idValue)
  if (id === null) {
    return json({ error: 'Invalid client ID' }, 400)
  }

  try {
    const deleted = await sql`
      DELETE FROM clients AS client
      WHERE client.id = ${id}
        AND client.relationship_status = 'prospect'
        AND NOT EXISTS (SELECT 1 FROM leads WHERE leads.client_id = client.id)
        AND NOT EXISTS (SELECT 1 FROM intake_submissions WHERE intake_submissions.client_id = client.id)
        AND NOT EXISTS (SELECT 1 FROM projects WHERE projects.client_id = client.id)
        AND NOT EXISTS (SELECT 1 FROM invoices WHERE invoices.client_id = client.id)
        AND NOT EXISTS (SELECT 1 FROM documents WHERE documents.client_id = client.id)
      RETURNING client.id
    `

    if (deleted[0]) return json({ ok: true })

    const existing = await sql`
      SELECT id, relationship_status
      FROM clients
      WHERE id = ${id}
      LIMIT 1
    `
    if (!existing[0]) return json({ error: 'Client not found' }, 404)

    return json(
      { error: 'Only an unused prospect can be deleted. Archive records with history instead.' },
      409,
    )
  } catch {
    console.error('Unable to delete client record')
    return json({ error: 'Unable to delete client record' }, 500)
  }
}
