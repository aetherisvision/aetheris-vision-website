import { NextRequest, NextResponse } from 'next/server'
import {
  getRegridBatchStatus,
  publicProxyErrorResponse,
  toPublicJobStatus,
} from '@/lib/omni-gridder-proxy'

/**
 * Public batched status endpoint (`#89` item 4).
 * Accepts `?jobs=id1,id2,...` (or `?job=id1`) so a 3-method comparison polls
 * all jobs in a single HTTP request. Derives panels and compare_uri strictly
 * server-side and returns an allowlisted public shape without signed or gs:// URIs.
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
    datasetId: request.nextUrl.searchParams.get('datasetId'),
    compare: null,
    panels: null,
    publicMode: true,
  })

  if (!outcome.ok) return publicProxyErrorResponse(outcome)
  return NextResponse.json(
    { jobs: outcome.data.jobs.map(toPublicJobStatus) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
