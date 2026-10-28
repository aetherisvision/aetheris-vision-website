import { NextRequest, NextResponse } from 'next/server'
import {
  checkPublicShowcaseBudget,
  proxyErrorResponse,
  submitRegridBatch,
  type SubmitRequestBody,
} from '@/lib/omni-gridder-proxy'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SubmitRequestBody
  const requestedCount = Array.isArray(body.methods) && body.methods.length > 0
    ? new Set(body.methods).size
    : 1

  const outcome = await submitRegridBatch(body, () =>
    checkPublicShowcaseBudget(request, requestedCount),
  )

  if (!outcome.ok) return proxyErrorResponse(outcome)
  return NextResponse.json(outcome.data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
