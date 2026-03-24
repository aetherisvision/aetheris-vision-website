import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT i.id, i.number, i.description, i.amount_cents, i.status,
           i.stripe_invoice_url, i.due_date, i.paid_at, i.created_at,
           p.name AS project_name
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    LEFT JOIN projects p ON p.id = i.project_id
    WHERE c.email = ${token.email}
      AND i.status != 'draft'
    ORDER BY i.created_at DESC
  `
  return NextResponse.json({ invoices: rows })
}
