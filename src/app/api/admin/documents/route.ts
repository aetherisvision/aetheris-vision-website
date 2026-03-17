import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const ADMIN_COOKIE = 'av-admin-session'

function isAdmin(request: NextRequest) {
  return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const docs = await sql`
    SELECT d.id, d.client_id, d.title, d.updated_at,
           c.name AS client_name
    FROM documents d
    JOIN clients c ON c.id = d.client_id
    ORDER BY d.updated_at DESC
  `

  return NextResponse.json({ documents: docs })
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_id, title, content } = await request.json()

  if (!client_id || !title) {
    return NextResponse.json({ error: 'client_id and title are required' }, { status: 400 })
  }

  const rows = await sql`
    INSERT INTO documents (client_id, title, content)
    VALUES (${Number(client_id)}, ${title}, ${content ?? ''})
    RETURNING id, client_id, title, content, created_at, updated_at
  `

  return NextResponse.json({ document: rows[0] }, { status: 201 })
}
