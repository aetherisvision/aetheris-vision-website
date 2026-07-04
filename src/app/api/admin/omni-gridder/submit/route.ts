import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { submitJob } from '@/lib/omni-gridder-client'
import { rateLimit } from '@/lib/rate-limit'

const GCS_STAGING_BUCKET = process.env.OG_GCS_STAGING_BUCKET
const DEMO_INPUT_URI = 'gs://esmai-dev-esmai-objects/staging-smoke-test/input.nc'

// Same 2x2 [0,1]x[0,1] temperature field used throughout the esmai-dev
// staging validation this session — reusing a known-good input avoids a
// silent all-NaN plot from guessing at bounds the real file may not cover.
const DEMO_DST_GRID = {
  lat: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0],
  lon: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0],
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()
  if (!GCS_STAGING_BUCKET) {
    return NextResponse.json({ error: 'OG_GCS_STAGING_BUCKET is not set' }, { status: 500 })
  }

  // A submit triggers a real Cloud Run job pickup (Scheduler-polled) — cheap,
  // but not free, and not something an admin page should let run away with
  // even though it's passphrase-gated.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'
  const limit = await rateLimit(ip, { limit: 3, windowMs: 2 * 60 * 1000, prefix: 'og-demo-submit' })
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — wait before submitting another demo job' },
      { status: 429, headers: { 'Retry-After': limit.retryAfterSeconds.toString() } },
    )
  }

  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const jobId = `demo-${suffix}`
  const outputUri = `gs://${GCS_STAGING_BUCKET}/demo/${jobId}/output.nc`

  await submitJob({
    job_id: jobId,
    processor_type: 'regrid',
    kind: 'regrid',
    input_uri: DEMO_INPUT_URI,
    output_uri: outputUri,
    params: { method: 'bilinear', dst_grid: DEMO_DST_GRID },
  })

  return NextResponse.json({ jobId })
}
