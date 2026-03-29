import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const clients = await sql`
    SELECT id, name, contact_name, email, phone, created_at
    FROM clients
    ORDER BY created_at DESC
  `
  return NextResponse.json({ clients })
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { name, contact_name, email, phone } = await request.json()

  const rows = await sql`
    INSERT INTO clients (name, contact_name, email, phone)
    VALUES (${name}, ${contact_name}, ${email}, ${phone || null})
    RETURNING id, name, contact_name, email, phone, created_at
  `
  return NextResponse.json({ client: rows[0] })
}
