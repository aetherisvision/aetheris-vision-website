import { NextRequest, NextResponse } from 'next/server'
import {
  checkPublicShowcaseBudget,
  publicProxyErrorResponse,
  submitRegridBatch,
  toPublicSubmitResult,
  type SubmitRequestBody,
} from '@/lib/omni-gridder-proxy'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SubmitRequestBody
  const requestedCount = Array.isArray(body.methods) && body.methods.length > 0
    ? new Set(body.methods).size
    : 1

  const turnstileToken =
    typeof body.turnstileToken === 'string' ? body.turnstileToken : null

  const outcome = await submitRegridBatch(body, () =>
    checkPublicShowcaseBudget(request, requestedCount, turnstileToken),
  )

  if (!outcome.ok) return publicProxyErrorResponse(outcome)
  return NextResponse.json(toPublicSubmitResult(outcome.data), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
