import { NextRequest, NextResponse } from 'next/server'
import { safeEqual } from '@/lib/admin-auth'
import { sql } from '@/lib/db'
import { readJsonBody } from '@/lib/request-security'

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Narrow workflow feedback for radar; never returns contacts, notes, or drafts. */
export async function POST(request: NextRequest) {
  const secret = process.env.RADAR_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || !authorization || !safeEqual(authorization, `Bearer ${secret}`)) {
    return json({ error: 'Unauthorized' }, 401)
  }
  let body: Record<string, unknown>
  try {
    const parsed = await readJsonBody<unknown>(request, 32 * 1024)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    body = parsed as Record<string, unknown>
  } catch { return json({ error: 'Invalid request body' }, 400) }
  if (Object.keys(body).length !== 1 || !Array.isArray(body.externalRefs) ||
    body.externalRefs.length < 1 || body.externalRefs.length > 100 ||
    body.externalRefs.some(ref => typeof ref !== 'string' || !ref.trim() || ref.length > 512)) {
    return json({ error: 'externalRefs must contain between 1 and 100 opportunity references' }, 400)
  }
  const references = [...new Set((body.externalRefs as string[]).map(ref => ref.trim()))]
  try {
    const rows = await sql`
      SELECT id, external_id, stage, removed_at
      FROM leads
      WHERE source = 'opportunity-radar' AND external_id = ANY(${references}::text[])
      ORDER BY id
    `
    return json({ leads: rows.map(row => ({
      leadId: row.id, externalRef: row.external_id, stage: row.stage, removedAt: row.removed_at,
    })) })
  } catch {
    return json({ error: 'Opportunity workflow status could not be loaded' }, 500)
  }
}
