import { NextRequest, NextResponse } from 'next/server'
import { downloadPlot, publicProxyErrorResponse } from '@/lib/omni-gridder-proxy'

export async function GET(request: NextRequest) {
  const outcome = await downloadPlot(request.nextUrl.searchParams.get('job'), {
    requireDemoPrefix: true,
  })
  if (!outcome.ok) return publicProxyErrorResponse(outcome)

  const inline = request.nextUrl.searchParams.get('inline') === '1'
  return new NextResponse(outcome.data.body, {
    headers: {
      'Content-Type': outcome.data.contentType,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${outcome.data.filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  })
}
