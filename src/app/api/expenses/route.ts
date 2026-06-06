import { sql } from '@/lib/db'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()
  const { searchParams } = new URL(request.url)
  const taxYear = searchParams.get('tax_year') || new Date().getFullYear()

  const expenses = await sql`
    SELECT * FROM expenses
    WHERE tax_year = ${taxYear}
    ORDER BY date DESC
  `

  const totals = await sql`
    SELECT category, SUM(amount) as total
    FROM expenses
    WHERE tax_year = ${taxYear}
    GROUP BY category
    ORDER BY total DESC
  `

  return NextResponse.json({ expenses, totals })
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()
  const body = await request.json()
  const { date, vendor, description, category, amount, tax_year, receipt_url } = body

  const result = await sql`
    INSERT INTO expenses (date, vendor, description, category, amount, tax_year, receipt_url)
    VALUES (${date}, ${vendor}, ${description}, ${category}, ${amount}, ${tax_year}, ${receipt_url || null})
    RETURNING *
  `

  return NextResponse.json(result[0], { status: 201 })
}
