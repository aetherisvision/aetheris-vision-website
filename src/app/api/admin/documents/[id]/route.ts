import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const ADMIN_COOKIE = 'av-admin-session'

function isAdmin(request: NextRequest) {
  return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rows = await sql`
    SELECT d.id, d.client_id, d.title, d.content, d.created_at, d.updated_at,
           c.name AS client_name
    FROM documents d
    JOIN clients c ON c.id = d.client_id
    WHERE d.id = ${Number(id)}
  `

  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ document: rows[0] })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { title, content } = await request.json()

  const rows = await sql`
    UPDATE documents
    SET title = COALESCE(${title ?? null}, title),
        content = COALESCE(${content ?? null}, content),
        updated_at = NOW()
    WHERE id = ${Number(id)}
    RETURNING id, client_id, title, content, updated_at
  `

  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ document: rows[0] })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM documents WHERE id = ${Number(id)}`
  return NextResponse.json({ ok: true })
}
