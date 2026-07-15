import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { downloadPlot, proxyErrorResponse } from '@/lib/omni-gridder-proxy'

// Streams a rendered plot back with attachment headers so the browser
// downloads it instead of navigating. Job resolution, signed-URL allowlisting,
// and upstream fetching all live in downloadPlot() (shared proxy module); this
// route only enforces admin auth and wraps the result stream.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const outcome = await downloadPlot(request.nextUrl.searchParams.get('job'))
  if (!outcome.ok) return proxyErrorResponse(outcome)

  return new NextResponse(outcome.data.body, {
    headers: {
      'Content-Type': outcome.data.contentType,
      'Content-Disposition': `attachment; filename="${outcome.data.filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
