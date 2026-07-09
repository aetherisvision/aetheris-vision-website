import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'

const GCS_STAGING_BUCKET = process.env.OG_GCS_STAGING_BUCKET

// Streams a rendered plot back with attachment headers so the browser
// downloads it instead of navigating. A plain <a download> can't do this:
// the signed URL is cross-origin (storage.googleapis.com), where the
// download attribute is ignored, and the bucket serves no CORS headers for
// a client-side blob fetch. Fetching server-side sidesteps both.
//
// SSRF guard: only signed HTTPS URLs for objects in OUR staging bucket are
// fetched — host and path prefix are validated before any request leaves.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()
  if (!GCS_STAGING_BUCKET) {
    return NextResponse.json({ error: 'OG_GCS_STAGING_BUCKET is not set' }, { status: 500 })
  }

  const raw = request.nextUrl.searchParams.get('url')
  if (!raw) {
    return NextResponse.json({ error: 'url query param required' }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }
  const validHost = target.hostname === 'storage.googleapis.com'
  const validPath = target.pathname.startsWith(`/${GCS_STAGING_BUCKET}/`)
  if (target.protocol !== 'https:' || !validHost || !validPath) {
    return NextResponse.json(
      { error: 'url must be a signed storage.googleapis.com link for the demo bucket' },
      { status: 400 },
    )
  }

  const upstream = await fetch(target.toString())
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `upstream fetch failed (${upstream.status}) — the signed URL may have expired; re-run the job` },
      { status: 502 },
    )
  }

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
      'Content-Disposition': `attachment; filename="og-method-comparison-${stamp}.png"`,
      'Cache-Control': 'no-store',
    },
  })
}
