import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { manageLeads } from '@/lib/crm'

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return json({ error: 'Unauthorized' }, 401)
  let body: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    body = parsed as Record<string, unknown>
  } catch { return json({ error: 'Invalid request body' }, 400) }

  if (Object.keys(body).some(key => !['action', 'ids', 'reason'].includes(key)) ||
    (body.action !== 'remove' && body.action !== 'restore')) {
    return json({ error: 'action must be remove or restore' }, 400)
  }
  if (!Array.isArray(body.ids) || body.ids.length < 1 || body.ids.length > 100 ||
    body.ids.some(id => !Number.isSafeInteger(id) || id < 1 || id > 2_147_483_647) ||
    new Set(body.ids).size !== body.ids.length) {
    return json({ error: 'Select between 1 and 100 distinct opportunity IDs' }, 400)
  }
  if (body.reason !== undefined && (typeof body.reason !== 'string' || body.reason.length > 1000)) {
    return json({ error: 'Removal reason must be 1,000 characters or fewer' }, 400)
  }

  try {
    const leads = await manageLeads({
      action: body.action, ids: body.ids as number[],
      ...(body.reason !== undefined ? { reason: (body.reason as string).trim() } : {}),
    })
    return json({ leads })
  } catch (error) {
    console.error('Unable to manage CRM opportunities', error instanceof Error ? error.name : 'Unknown error')
    const conflict = error instanceof Error &&
      (error.name === 'LeadWorkflowConflictError' || ('code' in error && error.code === '40001'))
    return json({
      error: conflict
        ? 'No opportunities were changed. Refresh the list; an opportunity may be missing or have a draft in progress.'
        : 'The opportunities could not be updated. Refresh the list before trying again.',
      ...(conflict ? { code: 'LEAD_CONFLICT' } : {}),
    }, conflict ? 409 : 500)
  }
}
