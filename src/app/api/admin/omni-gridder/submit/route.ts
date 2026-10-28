import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { rateLimit } from '@/lib/rate-limit'
import { getTrustedClientIp } from '@/lib/request-security'
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

  const outcome = await submitRegridBatch(body, async () => {
    const ip = getTrustedClientIp(request) ?? 'unknown'
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
