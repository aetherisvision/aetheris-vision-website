import { NextRequest, NextResponse } from 'next/server'
import { getRegridBatchStatus, proxyErrorResponse } from '@/lib/omni-gridder-proxy'

/**
 * Public batched status endpoint (`#89` item 4).
 * Accepts `?jobs=id1,id2,...` (or `?job=id1`) so a 3-method comparison polls
 * all jobs in a single HTTP request.
 */
export async function GET(request: NextRequest) {
  const jobsParam =
    request.nextUrl.searchParams.get('jobs') ??
    request.nextUrl.searchParams.get('job') ??
    ''
  const jobIds = jobsParam
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  const outcome = await getRegridBatchStatus(jobIds, {
    chainPlot: request.nextUrl.searchParams.get('chainPlot') === '1',
    primaryJobId: request.nextUrl.searchParams.get('primary'),
    compare: request.nextUrl.searchParams.get('compare'),
    panels: request.nextUrl.searchParams.get('panels'),
  })

  if (!outcome.ok) return proxyErrorResponse(outcome)
  return NextResponse.json(outcome.data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
