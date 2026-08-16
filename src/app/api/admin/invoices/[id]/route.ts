import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

const MAX_POSTGRES_INTEGER = 2_147_483_647
const UPDATE_FIELDS = new Set(['description', 'amount_cents', 'due_date'])

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

function normalizeDescription(value: unknown): string {
  if (typeof value !== 'string') throw new Error('description must be a string')
  const normalized = value.trim()
  if (!normalized || normalized.length > 500) {
    throw new Error('description must be between 1 and 500 characters')
  }
  return normalized
}

function amount(value: unknown): number {
  if (
    typeof value !== 'number'
    || !Number.isSafeInteger(value)
    || value < 1
    || value > MAX_POSTGRES_INTEGER
  ) {
    throw new Error('amount_cents must be a positive integer')
  }
  return value
}

function nullableDate(value: unknown): string | null {
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('due_date must be a valid YYYY-MM-DD date or null')
  }
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('due_date must be a valid YYYY-MM-DD date or null')
  }
  return value
}

async function readUpdateInput(req: NextRequest) {
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
  const keys = Object.keys(input)
  const unknown = keys.filter((key) => !UPDATE_FIELDS.has(key))
  if (unknown.length) throw new Error(`Unknown field: ${unknown[0]}`)
  if (!keys.length) throw new Error('At least one editable field is required')

  const hasDescription = Object.hasOwn(input, 'description')
  const hasAmount = Object.hasOwn(input, 'amount_cents')
  const hasDueDate = Object.hasOwn(input, 'due_date')

  return {
    hasDescription,
    description: hasDescription ? normalizeDescription(input.description) : null,
    hasAmount,
    amountCents: hasAmount ? amount(input.amount_cents) : null,
    hasDueDate,
    dueDate: hasDueDate ? nullableDate(input.due_date) : null,
  }
}

async function draftMissResponse(id: number) {
  const rows = await sql`SELECT status, purpose FROM invoices WHERE id = ${id}`
  if (!rows.length) return json({ error: 'Invoice not found' }, 404)
  if (rows[0].purpose === 'deposit') {
    return json({ error: 'Deposit invoices are managed by the signed-engagement workflow' }, 409)
  }
  if (rows[0].purpose) {
    return json({ error: 'Lifecycle-owned invoices are managed by their engagement workflow' }, 409)
  }
  return json({ error: 'Only draft invoices can be changed' }, 409)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(req)) return json({ error: 'Unauthorized' }, 401)

  const { id: idValue } = await params
  const id = routeId(idValue)
  if (id === null) return json({ error: 'Invoice id must be a positive integer' }, 400)

  let input: Awaited<ReturnType<typeof readUpdateInput>>
  try {
    input = await readUpdateInput(req)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid request body' }, 400)
  }

  try {
    const rows = await sql`
      UPDATE invoices
      SET
        description = CASE
          WHEN ${input.hasDescription} THEN ${input.description}
          ELSE description
        END,
        amount_cents = CASE
          WHEN ${input.hasAmount} THEN ${input.amountCents}
          ELSE amount_cents
        END,
        due_date = CASE
          WHEN ${input.hasDueDate} THEN ${input.dueDate}::date
          ELSE due_date
        END
      WHERE id = ${id}
        AND status = 'draft'
        AND purpose IS NULL
      RETURNING *
    `
    if (!rows.length) return await draftMissResponse(id)
    return json({ invoice: rows[0] })
  } catch {
    return json({ error: 'Unable to update invoice' }, 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(req)) return json({ error: 'Unauthorized' }, 401)

  const { id: idValue } = await params
  const id = routeId(idValue)
  if (id === null) return json({ error: 'Invoice id must be a positive integer' }, 400)

  try {
    const rows = await sql`
      DELETE FROM invoices
      WHERE id = ${id}
        AND status = 'draft'
        AND purpose IS NULL
      RETURNING id
    `
    if (!rows.length) return await draftMissResponse(id)
    return json({ ok: true })
  } catch {
    return json({ error: 'Unable to delete invoice' }, 500)
  }
}
