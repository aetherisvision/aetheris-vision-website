import { NextRequest, NextResponse } from 'next/server'
import { downloadPlot, proxyErrorResponse } from '@/lib/omni-gridder-proxy'

export async function GET(request: NextRequest) {
  const outcome = await downloadPlot(request.nextUrl.searchParams.get('job'))
  if (!outcome.ok) return proxyErrorResponse(outcome)

  return new NextResponse(outcome.data.body, {
    headers: {
      'Content-Type': outcome.data.contentType,
      'Content-Disposition': `attachment; filename="${outcome.data.filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  })
}
