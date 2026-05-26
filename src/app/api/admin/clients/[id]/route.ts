import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { sql } from '@/lib/db'


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { id } = await params
  // Cascades to projects and documents via FK ON DELETE CASCADE
  await sql`DELETE FROM clients WHERE id = ${Number(id)}`
  return NextResponse.json({ ok: true })
}
