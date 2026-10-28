import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { sql } from '@/lib/db'
import { AUTH_SECRET, isSecureRequest } from '@/lib/auth-cookie'

/**
 * Streams the signed Statement of Work PDF (`projects.signed_pdf_base64`) to
 * the authenticated client who owns the project.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({
    req: request,
    secret: AUTH_SECRET,
    secureCookie: isSecureRequest(request.url),
  })
  const clientId = token?.clientId as string | undefined
  if (!clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
  }

  const rows = await sql`
    SELECT name, signed_pdf_base64
    FROM projects
    WHERE id = ${Number(id)}
      AND client_id = ${Number(clientId)}
    LIMIT 1
  `

  const project = rows[0] as { name?: string; signed_pdf_base64?: string | null } | undefined
  if (!project || !project.signed_pdf_base64) {
    return NextResponse.json({ error: 'Signed SOW not found' }, { status: 404 })
  }

  const pdfBytes = Buffer.from(project.signed_pdf_base64, 'base64')
  const safeSlug =
    String(project.name ?? 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'project'

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safeSlug}-signed-sow.pdf"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  })
}
