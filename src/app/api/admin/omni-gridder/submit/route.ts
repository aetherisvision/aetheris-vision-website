import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { rateLimit } from '@/lib/rate-limit'
import {
  proxyErrorResponse,
  submitRegridBatch,
  type SubmitRequestBody,
} from '@/lib/omni-gridder-proxy'

// Re-exported for backward compatibility — the canonical definition now lives
// in the shared proxy module.
export type { RegridMethod } from '@/lib/omni-gridder-proxy'

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const body = (await request.json().catch(() => ({}))) as SubmitRequestBody

  // Admin-side budget policy (authn + rate class is the route's job, not the
  // shared proxy's). A submit triggers real Cloud Run job pickup — cheap, but
  // not free, and not something an admin page should let run away with even
  // though it's passphrase-gated. A comparison batch is up to 3 jobs in one
  // call, so the per-request budget is tighter than the old single-job limit:
  // one comparison (or a few singles) per 2-minute window per IP. Runs after
  // validation (inside submitRegridBatch), so an invalid request never burns
  // budget — see the checkBudget contract.
  const outcome = await submitRegridBatch(body, async () => {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const limit = await rateLimit(ip, {
      limit: 2,
      windowMs: 2 * 60 * 1000,
      prefix: 'og-demo-submit',
    })
    if (limit.success) return null
    return {
      status: 429,
      error: 'Rate limit exceeded — wait before submitting another demo job',
      headers: { 'Retry-After': limit.retryAfterSeconds.toString() },
    }
  })

  if (!outcome.ok) return proxyErrorResponse(outcome)
  return NextResponse.json(outcome.data)
}
