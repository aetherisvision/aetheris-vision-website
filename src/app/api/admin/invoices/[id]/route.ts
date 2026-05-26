import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { sql } from '@/lib/db'


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorizedResponse()

  const { description, amount_cents, due_date, status } = await req.json()
  const { id: idStr } = await params
  const id = Number(idStr)

  await sql`
    UPDATE invoices SET
      description  = COALESCE(${description  ?? null}, description),
      amount_cents = COALESCE(${amount_cents ?? null}, amount_cents),
      due_date     = COALESCE(${due_date     ?? null}, due_date),
      status       = COALESCE(${status       ?? null}, status)
    WHERE id = ${id}
  `

  const rows = await sql`SELECT * FROM invoices WHERE id = ${id}`
  return NextResponse.json({ invoice: rows[0] })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorizedResponse()

  const { id: idStr } = await params
  const id = Number(idStr)
  await sql`DELETE FROM invoices WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
