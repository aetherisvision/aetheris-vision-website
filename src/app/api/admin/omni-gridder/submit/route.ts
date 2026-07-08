import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { submitJob, triggerWorkerRun } from '@/lib/omni-gridder-client'
import { rateLimit } from '@/lib/rate-limit'

const GCS_STAGING_BUCKET = process.env.OG_GCS_STAGING_BUCKET

import { allowedInputUris } from '@/lib/og-demo-inputs'

// 0.5° CONUS grid, generated server-side (never client-supplied — same SSRF/
// resource-exhaustion reasoning as the input allowlist above: an arbitrary
// dst_grid from the client could ask og-server to materialize an enormous
// output array). lat 24..49 step 0.5 = 51 points; lon -125..-66 step 0.5 =
// 119 points.
function buildConusGrid(): { lat: number[]; lon: number[] } {
  const lat: number[] = []
  for (let i = 0; i <= 50; i++) lat.push(Math.round((24 + i * 0.5) * 1000) / 1000)
  const lon: number[] = []
  for (let i = 0; i <= 118; i++) lon.push(Math.round((-125 + i * 0.5) * 1000) / 1000)
  return { lat, lon }
}

export type RegridMethod = 'nearest' | 'bilinear' | 'conservative'
const VALID_METHODS: RegridMethod[] = ['nearest', 'bilinear', 'conservative']

interface SubmitRequestBody {
  /** One or more methods to run against the same input+grid. Defaults to ['bilinear']. */
  methods?: string[]
  /** Must be one of the server allowlist; defaults to the first allowlisted URI. */
  inputUri?: string
}

interface SubmittedJob {
  jobId: string
  method: RegridMethod
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()
  if (!GCS_STAGING_BUCKET) {
    return NextResponse.json({ error: 'OG_GCS_STAGING_BUCKET is not set' }, { status: 500 })
  }

  const body = (await request.json().catch(() => ({}))) as SubmitRequestBody

  const requestedMethods =
    body.methods && body.methods.length > 0 ? body.methods : ['bilinear']
  // Dedupe before validation/submission — {methods:["bilinear","bilinear"]}
  // would otherwise submit the same jobId twice and schedule duplicate
  // polling for what is really a single job. Preserve request order.
  const methods = [...new Set(requestedMethods)] as string[]
  const invalidMethod = methods.find((m) => !VALID_METHODS.includes(m as RegridMethod))
  if (invalidMethod) {
    return NextResponse.json(
      { error: `Invalid method "${invalidMethod}" — must be one of ${VALID_METHODS.join(', ')}` },
      { status: 400 },
    )
  }
  if (methods.length > VALID_METHODS.length) {
    return NextResponse.json({ error: 'Too many methods requested' }, { status: 400 })
  }

  const allowlist = allowedInputUris()
  const inputUri = body.inputUri ?? allowlist[0]
  if (!allowlist.includes(inputUri)) {
    return NextResponse.json({ error: 'input URI is not in the server allowlist' }, { status: 400 })
  }

  // A submit triggers real Cloud Run job pickup — cheap, but not free, and
  // not something an admin page should let run away with even though it's
  // passphrase-gated. A comparison batch is up to 3 jobs in one call, so the
  // per-request budget is tighter than the old single-job limit: one
  // comparison (or a few singles) per 2-minute window per IP.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'
  const limit = await rateLimit(ip, { limit: 2, windowMs: 2 * 60 * 1000, prefix: 'og-demo-submit' })
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — wait before submitting another demo job' },
      { status: 429, headers: { 'Retry-After': limit.retryAfterSeconds.toString() } },
    )
  }

  const dstGrid = buildConusGrid()
  const batchSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  // Everything past this point talks to external systems (WIF token
  // minting, og-server, Cloud Run Admin API) — any throw here must come
  // back as JSON with the real message, not Next's HTML 500 page, or the
  // admin UI can only display a bare "HTTP 500" (which is exactly how a
  // missing/stale env var hid from us in production).
  try {
    const submitted: SubmittedJob[] = []
    for (const method of methods as RegridMethod[]) {
      const jobId = `demo-${batchSuffix}-${method}`
      const outputUri = `gs://${GCS_STAGING_BUCKET}/demo/regrid/${jobId}/output.nc`
      await submitJob({
        job_id: jobId,
        processor_type: 'regrid',
        kind: 'regrid',
        input_uri: inputUri,
        output_uri: outputUri,
        params: { method, dst_grid: dstGrid },
      })
      submitted.push({ jobId, method })
    }

    // Debounced: one worker-execution request per batch (not per job), so a
    // 3-method comparison doesn't launch 3 concurrent Cloud Run Job
    // executions. Best-effort — see triggerWorkerRun() for why this may 403
    // until the SA's IAM grant is confirmed. Never blocks the response: jobs
    // are already submitted and will run whenever the worker next executes,
    // triggered or not.
    const workerTrigger = await triggerWorkerRun()
    if (!workerTrigger.triggered) {
      console.warn(`omni-gridder submit: worker not auto-triggered (${workerTrigger.reason})`)
    }

    return NextResponse.json({
      jobs: submitted,
      inputUri,
      workerTriggered: workerTrigger.triggered,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`omni-gridder submit failed: ${message}`)
    return NextResponse.json({ error: `Job submission failed: ${message}` }, { status: 500 })
  }
}
