import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { date, vendor, description, category, amount, receipt_url } = await request.json()

  const rows = await sql`
    UPDATE expenses
    SET date        = COALESCE(${date ?? null}, date),
        vendor      = COALESCE(${vendor ?? null}, vendor),
        description = COALESCE(${description ?? null}, description),
        category    = COALESCE(${category ?? null}, category),
        amount      = COALESCE(${amount ?? null}, amount),
        receipt_url = ${receipt_url ?? null}
    WHERE id = ${Number(id)}
    RETURNING *
  `

  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await sql`DELETE FROM expenses WHERE id = ${Number(id)}`
  return NextResponse.json({ ok: true })
}
