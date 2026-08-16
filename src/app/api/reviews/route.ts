import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createReview, getApprovedReviews, ensureReviewsTable } from '@/lib/db/reviews'
import { rateLimit } from '@/lib/rate-limit'
import { escapeHtml } from '@/lib/escape-html'
import { SITE } from '@/lib/constants'

const resend = new Resend(process.env.RESEND_API_KEY)

// Rate limit: 3 submissions per IP per 10 minutes. Distributed across Vercel
// instances when Upstash/Vercel KV is configured, else in-memory (issue #12).
const RATE_LIMIT = 3
const WINDOW_MS = 10 * 60 * 1000

export async function GET() {
  try {
    await ensureReviewsTable()
    const reviews = await getApprovedReviews()
    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('Failed to fetch reviews:', err)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const { success } = await rateLimit(ip, {
    limit: RATE_LIMIT,
    windowMs: WINDOW_MS,
    prefix: 'reviews',
  })
  if (!success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait before trying again.' },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const client_name = typeof body.client_name === 'string' ? body.client_name.trim() : ''
  const client_role = typeof body.client_role === 'string' ? body.client_role.trim() || null : null
  const client_company = typeof body.client_company === 'string' ? body.client_company.trim() || null : null
  const rating = Number(body.rating)
  const reviewBody = typeof body.body === 'string' ? body.body.trim() : ''

  // Validation
  if (!client_name || client_name.length < 2 || client_name.length > 200) {
    return NextResponse.json(
      { error: 'Name must be between 2 and 200 characters.' },
      { status: 400 }
    )
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Rating must be an integer between 1 and 5.' },
      { status: 400 }
    )
  }
  if (!reviewBody || reviewBody.length < 20 || reviewBody.length > 5000) {
    return NextResponse.json(
      { error: 'Review must be between 20 and 5000 characters.' },
      { status: 400 }
    )
  }

  try {
    await ensureReviewsTable()
    const review = await createReview({ client_name, client_role, client_company, rating, body: reviewBody })

    // Send notification email to admin (non-fatal)
    try {
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
      const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url}/admin/reviews`
      const clientDetails = [client_role, client_company]
        .filter((value): value is string => value !== null)
        .map(escapeHtml)
        .join(' · ')
      await resend.emails.send({
        from: 'system@aetherisvision.com',
        to: ['contact@aetherisvision.com'],
        subject: `New review from ${client_name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
            <h2 style="color:#0f172a;margin-bottom:4px;">New Review Submitted</h2>
            <p style="color:#64748b;font-size:13px;margin-bottom:24px;">Pending your approval before it goes live.</p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:600;">${escapeHtml(client_name)}</p>
              ${clientDetails ? `<p style="margin:0 0 12px;color:#64748b;font-size:13px;">${clientDetails}</p>` : ''}
              <p style="margin:0 0 12px;color:#f59e0b;font-size:18px;letter-spacing:2px;">${stars}</p>
              <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(reviewBody)}</p>
            </div>

            <a href="${adminUrl}"
               style="display:inline-block;background:#29426C;color:#fff;text-decoration:none;
                      padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
              Review in Admin →
            </a>

            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
              Aetheris Vision LLC · aetherisvision.com
            </p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Review notification email failed (non-fatal):', emailErr)
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (err) {
    console.error('Failed to create review:', err)
    return NextResponse.json({ error: 'Failed to submit review. Please try again.' }, { status: 500 })
  }
}
