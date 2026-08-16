import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'

const ALLOWED_FIELDS = new Set(['name', 'contact_name', 'email', 'phone'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function databaseErrorCode(error: unknown): string | null {
  if (!isRecord(error)) return null
  return typeof error.code === 'string' ? error.code : null
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  try {
    const clients = await sql`
      SELECT
        c.id,
        c.name,
        c.contact_name,
        c.email,
        c.phone,
        c.relationship_status,
        c.next_touch,
        c.notes,
        COALESCE(recent_lead.id, recent_project.lead_id, recent_intake.lead_id) AS lead_id,
        recent_intake.id AS intake_id,
        recent_project.id AS project_id,
        recent_project.status AS project_status,
        c.created_at,
        c.updated_at
      FROM clients c
      LEFT JOIN LATERAL (
        SELECT l.id
        FROM leads l
        WHERE l.client_id = c.id
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT 1
      ) recent_lead ON TRUE
      LEFT JOIN LATERAL (
        SELECT i.id, i.lead_id
        FROM intake_submissions i
        WHERE i.client_id = c.id
        ORDER BY COALESCE(i.created_at, i.submitted_at) DESC, i.id DESC
        LIMIT 1
      ) recent_intake ON TRUE
      LEFT JOIN LATERAL (
        SELECT p.id, p.lead_id, p.status
        FROM projects p
        WHERE p.client_id = c.id
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
      ORDER BY c.created_at DESC, c.id DESC
    `
    return json({ clients })
  } catch {
    console.error('Unable to list client records')
    return json({ error: 'Unable to load client records' }, 500)
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json') {
    return json({ error: 'Content-Type must be application/json' }, 415)
  }

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!isRecord(parsed)) throw new Error('Request body must be an object')
    body = parsed
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  const keys = Object.keys(body)
  if (keys.some((key) => !ALLOWED_FIELDS.has(key))) {
    return json({ error: 'Only name, contact_name, email, and phone are accepted' }, 400)
  }

  if (typeof body.name !== 'string' || !body.name.trim()) {
    return json({ error: 'Business name is required' }, 400)
  }
  if (typeof body.contact_name !== 'string' || !body.contact_name.trim()) {
    return json({ error: 'Contact name is required' }, 400)
  }
  if (typeof body.email !== 'string' || !body.email.trim()) {
    return json({ error: 'Email address is required' }, 400)
  }
  if (body.phone !== undefined && body.phone !== null && typeof body.phone !== 'string') {
    return json({ error: 'Phone must be a string or null' }, 400)
  }

  const name = body.name.trim()
  const contactName = body.contact_name.trim()
  const email = body.email.trim().toLowerCase()
  const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null

  if (name.length > 200) return json({ error: 'Business name must be 200 characters or fewer' }, 400)
  if (contactName.length > 200) return json({ error: 'Contact name must be 200 characters or fewer' }, 400)
  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    return json({ error: 'Enter a valid email address' }, 400)
  }
  if (phone && phone.length > 50) return json({ error: 'Phone must be 50 characters or fewer' }, 400)

  try {
    const rows = await sql`
      INSERT INTO clients (name, contact_name, email, phone)
      VALUES (${name}, ${contactName}, ${email}, ${phone})
      RETURNING id, name, contact_name, email, phone, relationship_status,
                next_touch, notes, created_at, updated_at
    `
    return json({ client: rows[0] }, 201)
  } catch (error) {
    if (databaseErrorCode(error) === '23505') {
      return json({ error: 'A client record already uses this email address' }, 409)
    }
    console.error('Unable to create client record')
    return json({ error: 'Unable to create client record' }, 500)
  }
}
