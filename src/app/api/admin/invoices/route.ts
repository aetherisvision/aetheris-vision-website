import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { allocateInvoiceNumber } from '@/lib/crm'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

const MAX_POSTGRES_INTEGER = 2_147_483_647
const CREATE_FIELDS = new Set([
  'client_id',
  'project_id',
  'description',
  'amount_cents',
  'due_date',
])

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function positiveInteger(value: unknown, field: string): number {
  if (
    typeof value !== 'number'
    || !Number.isSafeInteger(value)
    || value < 1
    || value > MAX_POSTGRES_INTEGER
  ) {
    throw new Error(`${field} must be a positive integer`)
  }
  return value
}

function nullablePositiveInteger(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null
  return positiveInteger(value, field)
}

function normalizeDescription(value: unknown): string {
  if (typeof value !== 'string') throw new Error('description must be a string')
  const normalized = value.trim()
  if (!normalized || normalized.length > 500) {
    throw new Error('description must be between 1 and 500 characters')
  }
  return normalized
}

function nullableDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date or null`)
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date or null`)
  }
  return value
}

async function readCreateInput(req: NextRequest) {
  const mediaType = req.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (mediaType !== 'application/json') {
    throw new Error('Content-Type must be application/json')
  }

  let value: unknown
  try {
    value = await req.json()
  } catch {
    throw new Error('Request body must be valid JSON')
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be a JSON object')
  }

  const input = value as Record<string, unknown>
  const unknown = Object.keys(input).filter((key) => !CREATE_FIELDS.has(key))
  if (unknown.length) throw new Error(`Unknown field: ${unknown[0]}`)

  return {
    clientId: positiveInteger(input.client_id, 'client_id'),
    projectId: nullablePositiveInteger(input.project_id, 'project_id'),
    description: normalizeDescription(input.description),
    amountCents: positiveInteger(input.amount_cents, 'amount_cents'),
    dueDate: nullableDate(input.due_date, 'due_date'),
  }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return json({ error: 'Unauthorized' }, 401)

  try {
    const rows = await sql`
      SELECT i.*, c.name AS client_name, c.email AS client_email, p.name AS project_name
      FROM invoices i
      JOIN clients c ON c.id = i.client_id
      LEFT JOIN projects p ON p.id = i.project_id
      ORDER BY i.created_at DESC
    `
    return json({ invoices: rows })
  } catch {
    return json({ error: 'Unable to load invoices' }, 500)
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return json({ error: 'Unauthorized' }, 401)

  let input: Awaited<ReturnType<typeof readCreateInput>>
  try {
    input = await readCreateInput(req)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid request body' }, 400)
  }

  try {
    const ownershipRows = await sql`
      SELECT
        EXISTS(
          SELECT 1 FROM clients WHERE id = ${input.clientId}
        ) AS client_exists,
        (
          ${input.projectId}::integer IS NULL
          OR EXISTS(
            SELECT 1
            FROM projects
            WHERE id = ${input.projectId}
              AND client_id = ${input.clientId}
          )
        ) AS project_matches_client
    `
    const ownership = ownershipRows[0] as
      | { client_exists?: boolean; project_matches_client?: boolean }
      | undefined

    if (!ownership?.client_exists) return json({ error: 'Client not found' }, 404)
    if (!ownership.project_matches_client) {
      return json({ error: 'Project does not belong to the selected client' }, 400)
    }

    const number = await allocateInvoiceNumber()
    const rows = await sql`
      INSERT INTO invoices (client_id, project_id, number, description, amount_cents, due_date)
      VALUES (
        ${input.clientId},
        ${input.projectId},
        ${number},
        ${input.description},
        ${input.amountCents},
        ${input.dueDate}
      )
      RETURNING *
    `
    return json({ invoice: rows[0] }, 201)
  } catch {
    return json({ error: 'Unable to create invoice' }, 500)
  }
}
