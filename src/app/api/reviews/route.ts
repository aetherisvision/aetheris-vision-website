import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

import { SITE } from '@/lib/constants'
import { createReview, ensureReviewsTable, getApprovedReviews } from '@/lib/db/reviews'
import { rateLimit } from '@/lib/rate-limit'
import {
  assertDistributedRateLimitAvailable,
  assertSameOrigin,
  createOpaqueRateLimitKey,
  getTrustedClientIp,
  readJsonBody,
  RequestSecurityError,
} from '@/lib/request-security'
import { TURNSTILE_ACTIONS, verifyTurnstileToken } from '@/lib/turnstile'
import { escapeHtml } from '@/lib/escape-html'

const resend = new Resend(process.env.RESEND_API_KEY)

const POST_RATE_LIMIT = 3
const POST_WINDOW_MS = 10 * 60 * 1000
const GET_RATE_LIMIT = 60
const GET_WINDOW_MS = 60 * 1000
const MAX_BODY_BYTES = 24 * 1024
const MAX_PUBLIC_REVIEWS = 100
const ALLOWED_BODY_KEYS = new Set([
  'client_name',
  'client_role',
  'client_company',
  'rating',
  'body',
  'turnstileToken',
  '_gotcha',
])

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

function securityErrorResponse(error: RequestSecurityError) {
  return noStoreJson({ error: error.message }, { status: error.status })
}

function assertAllowedReadContext(request: NextRequest): void {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new RequestSecurityError('invalid-origin', 403, 'Request origin is not allowed')
  }

  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) {
    throw new RequestSecurityError('invalid-origin', 403, 'Request origin is not allowed')
  }
}

function getExpectedHostname(request: NextRequest): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url
  try {
    return new URL(siteUrl).hostname
  } catch {
    return request.nextUrl.hostname
  }
}

function textField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function hasUnsafeControls(value: string): boolean {
  return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
}

async function applyRateLimit(request: NextRequest, kind: 'read' | 'submit') {
  const clientIp = getTrustedClientIp(request)
  const scope = `reviews-${kind}`
  const result = await rateLimit(createOpaqueRateLimitKey(scope, clientIp), {
    limit: kind === 'submit' ? POST_RATE_LIMIT : GET_RATE_LIMIT,
    windowMs: kind === 'submit' ? POST_WINDOW_MS : GET_WINDOW_MS,
    prefix: scope,
  })

  if (!result.success) {
    const response = noStoreJson(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429 },
    )
    response.headers.set('Retry-After', String(result.retryAfterSeconds))
    return response
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    assertAllowedReadContext(request)
    assertDistributedRateLimitAvailable()
    if ([...request.nextUrl.searchParams.keys()].length > 0) {
      return noStoreJson({ error: 'Invalid request.' }, { status: 400 })
    }

    const limited = await applyRateLimit(request, 'read')
    if (limited) return limited

    await ensureReviewsTable()
    const reviews = (await getApprovedReviews())
      .slice(0, MAX_PUBLIC_REVIEWS)
      .map(({ client_name, client_role, client_company, rating, body }) => ({
        client_name,
        client_role,
        client_company,
        rating,
        body,
      }))
    return noStoreJson({ reviews })
  } catch (error) {
    if (error instanceof RequestSecurityError) return securityErrorResponse(error)
    console.error('Failed to fetch public reviews')
    return noStoreJson({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request)
    assertDistributedRateLimitAvailable()

    const limited = await applyRateLimit(request, 'submit')
    if (limited) return limited

    const payload = await readJsonBody<Record<string, unknown>>(request, MAX_BODY_BYTES)
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return noStoreJson({ error: 'Invalid request body.' }, { status: 400 })
    }
    if (Object.keys(payload).some((key) => !ALLOWED_BODY_KEYS.has(key))) {
      return noStoreJson({ error: 'Invalid request body.' }, { status: 400 })
    }

    // A filled honeypot is treated as success so automated submitters receive
    // no signal that their submission was discarded.
    if (textField(payload._gotcha)) return noStoreJson({ ok: true }, { status: 201 })

    const clientName = textField(payload.client_name)
    const clientRole = textField(payload.client_role)
    const clientCompany = textField(payload.client_company)
    const reviewBody = textField(payload.body)
    const turnstileToken = textField(payload.turnstileToken)
    const rating = payload.rating

    if (
      clientName.length < 2 ||
      clientName.length > 200 ||
      hasUnsafeControls(clientName)
    ) {
      return noStoreJson(
        { error: 'Name must be between 2 and 200 characters.' },
        { status: 400 },
      )
    }
    if (
      clientRole.length > 200 ||
      clientCompany.length > 200 ||
      hasUnsafeControls(clientRole) ||
      hasUnsafeControls(clientCompany)
    ) {
      return noStoreJson({ error: 'Role and company must be 200 characters or fewer.' }, { status: 400 })
    }
    if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
      return noStoreJson(
        { error: 'Rating must be an integer between 1 and 5.' },
        { status: 400 },
      )
    }
    if (
      reviewBody.length < 20 ||
      reviewBody.length > 5_000 ||
      hasUnsafeControls(reviewBody)
    ) {
      return noStoreJson(
        { error: 'Review must be between 20 and 5000 characters.' },
        { status: 400 },
      )
    }
    if (!turnstileToken || turnstileToken.length > 2_048) {
      return noStoreJson(
        { error: 'Please complete the human verification and try again.' },
        { status: 400 },
      )
    }

    const verification = await verifyTurnstileToken({
      token: turnstileToken,
      expectedAction: TURNSTILE_ACTIONS.review,
      expectedHostname: getExpectedHostname(request),
    })
    if (!verification.ok) {
      const unavailable = ['timeout', 'unavailable', 'misconfigured'].includes(verification.reason)
      return noStoreJson(
        {
          error: unavailable
            ? 'Human verification is temporarily unavailable. Please try again later.'
            : 'Human verification failed. Please try again.',
        },
        { status: unavailable ? 503 : 400 },
      )
    }

    await ensureReviewsTable()
    await createReview({
      client_name: clientName,
      client_role: clientRole || null,
      client_company: clientCompany || null,
      rating: rating as number,
      body: reviewBody,
    })

    try {
      const stars = '★'.repeat(rating as number) + '☆'.repeat(5 - (rating as number))
      const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url}/admin/reviews`
      const clientDetails = [clientRole || null, clientCompany || null]
        .filter((value): value is string => value !== null)
        .map(escapeHtml)
        .join(' · ')
      await resend.emails.send({
        from: 'system@aetherisvision.com',
        to: [process.env.ADMIN_NOTIFICATION_EMAIL ?? SITE.email],
        subject: 'New client review awaiting approval',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;">
            <h2 style="color:#0f172a;margin-bottom:4px;">New Review Submitted</h2>
            <p style="color:#64748b;font-size:13px;margin-bottom:24px;">Pending your approval before it goes live.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
              <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:600;">${escapeHtml(clientName)}</p>
              ${clientDetails ? `<p style="margin:0 0 12px;color:#64748b;font-size:13px;">${clientDetails}</p>` : ''}
              <p style="margin:0 0 12px;color:#f59e0b;font-size:18px;letter-spacing:2px;">${stars}</p>
              <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(reviewBody)}</p>
            </div>
            <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#29426C;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">Review in Admin →</a>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Aetheris Vision LLC · aetherisvision.com</p>
          </div>
        `,
      })
    } catch {
      console.error('Review notification email failed')
    }

    return noStoreJson({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestSecurityError) return securityErrorResponse(error)
    console.error('Failed to create review')
    return noStoreJson(
      { error: 'Failed to submit review. Please try again.' },
      { status: 500 },
    )
  }
}
