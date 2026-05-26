import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { approveReview, rejectReview } from '@/lib/db/reviews'


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return unauthorizedResponse()

  const { id: idStr } = await params
  const id = Number(idStr)

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const action = body.action
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  try {
    if (action === 'approve') {
      await approveReview(id)
    } else {
      await rejectReview(id)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`Failed to ${action} review ${id}:`, err)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}
