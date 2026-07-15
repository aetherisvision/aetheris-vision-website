import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { getRegridJobStatus, proxyErrorResponse } from '@/lib/omni-gridder-proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { jobId } = await params
  // The frontend opts a single "primary" poll loop into plot-chaining via
  // ?chainPlot=1 (the bilinear job in comparison mode, or the sole job in
  // single-method mode) so only one plot renders per batch. ?compare= and
  // ?panels= tune the chained plot; both are re-validated server-side.
  const outcome = await getRegridJobStatus(jobId, {
    chainPlot: request.nextUrl.searchParams.get('chainPlot') === '1',
    compare: request.nextUrl.searchParams.get('compare'),
    panels: request.nextUrl.searchParams.get('panels'),
  })

  if (!outcome.ok) return proxyErrorResponse(outcome)
  return NextResponse.json(outcome.data)
}
