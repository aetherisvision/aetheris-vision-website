import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function isAdmin(req: NextRequest) {
  return req.cookies.get('av-admin-session')?.value === 'authenticated'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { description, amount_cents, due_date, status } = await req.json()
  const id = Number(params.id)

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(params.id)
  await sql`DELETE FROM invoices WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
