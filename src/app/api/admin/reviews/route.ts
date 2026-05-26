import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { getAllReviews, ensureReviewsTable } from '@/lib/db/reviews'


export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorizedResponse()

  try {
    await ensureReviewsTable()
    const reviews = await getAllReviews()
    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('Failed to fetch reviews:', err)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
