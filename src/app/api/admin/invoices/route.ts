import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function isAdmin(req: NextRequest) {
  return req.cookies.get('av-admin-session')?.value === 'authenticated'
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT i.*, c.name AS client_name, c.email AS client_email, p.name AS project_name
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    LEFT JOIN projects p ON p.id = i.project_id
    ORDER BY i.created_at DESC
  `
  return NextResponse.json({ invoices: rows })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_id, project_id, description, amount_cents, due_date } = await req.json()

  if (!client_id || !description || !amount_cents) {
    return NextResponse.json({ error: 'client_id, description, and amount_cents are required' }, { status: 400 })
  }

  // Generate invoice number: INV-YYYYMM-NNNN
  const count = await sql`SELECT COUNT(*) FROM invoices`
  const seq = (Number(count[0].count) + 1).toString().padStart(4, '0')
  const now = new Date()
  const number = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${seq}`

  const rows = await sql`
    INSERT INTO invoices (client_id, project_id, number, description, amount_cents, due_date)
    VALUES (${client_id}, ${project_id ?? null}, ${number}, ${description}, ${amount_cents}, ${due_date ?? null})
    RETURNING *
  `
  return NextResponse.json({ invoice: rows[0] }, { status: 201 })
}
