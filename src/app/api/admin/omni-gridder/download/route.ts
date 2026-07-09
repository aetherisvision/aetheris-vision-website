import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { getJobStatus } from '@/lib/omni-gridder-client'

const GCS_STAGING_BUCKET = process.env.OG_GCS_STAGING_BUCKET

// Job IDs are our own generated strings (see submit/route.ts and
// status/[jobId]/route.ts), always lowercase-alnum-hyphen and always ending
// in "-plot" for the chained plot job this route serves. Reject anything
// else before it ever reaches getJobStatus.
const PLOT_JOB_ID_RE = /^[a-z][a-z0-9-]{0,62}-plot$/

// Streams a rendered plot back with attachment headers so the browser
// downloads it instead of navigating. A plain <a download> can't do this:
// the signed URL is cross-origin (storage.googleapis.com), where the
// download attribute is ignored, and the bucket serves no CORS headers for
// a client-side blob fetch. Fetching server-side sidesteps both.
//
// Looked up by job id, not by URL: the client never sees or holds the
// signed bearer URL in a query string. We resolve job -> status -> result_uri
// ourselves via getJobStatus() (the same og-server client the status route
// uses), and only THEN apply the host/path allowlist below — as defense in
// depth, not as the primary authority (og-server is the only thing that
// ever produces a value here, and it only ever returns signed URLs).
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()
  if (!GCS_STAGING_BUCKET) {
    return NextResponse.json({ error: 'OG_GCS_STAGING_BUCKET is not set' }, { status: 500 })
  }

  const jobId = request.nextUrl.searchParams.get('job')
  if (!jobId || !PLOT_JOB_ID_RE.test(jobId)) {
    return NextResponse.json(
      { error: 'job query param required — must be a plot job id ending in "-plot"' },
      { status: 400 },
    )
  }

  let status
  try {
    status = await getJobStatus(jobId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Job lookup failed: ${message}` }, { status: 502 })
  }
  if (!status) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  if (status.status !== 'succeeded' || !status.result_uri) {
    return NextResponse.json(
      { error: `Job is not ready for download (status: ${status.status})` },
      { status: 409 },
    )
  }

  let target: URL
  try {
    target = new URL(status.result_uri)
  } catch {
    return NextResponse.json({ error: 'og-server returned an invalid result URL' }, { status: 502 })
  }
  const validHost = target.hostname === 'storage.googleapis.com'
  const validPath = target.pathname.startsWith(`/${GCS_STAGING_BUCKET}/`)
  if (target.protocol !== 'https:' || !validHost || !validPath) {
    return NextResponse.json(
      { error: 'result URL must be a signed storage.googleapis.com link for the demo bucket' },
      { status: 400 },
    )
  }

  let upstream: Response
  try {
    upstream = await fetch(target.toString(), {
      // A redirect off the allowlisted host must fail outright, never be
      // followed — 'follow' would let a compromised/misconfigured upstream
      // hop us to an arbitrary origin after the guard above already passed.
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    // fetch() throws (doesn't resolve to a non-ok Response) on DNS failure,
    // network errors, timeout, and a blocked redirect — all of those must
    // come back as JSON, not surface as Next's HTML 500 page.
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Upstream fetch failed: ${message}` }, { status: 502 })
  }

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
