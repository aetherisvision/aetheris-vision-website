import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { getJobStatus, submitJob } from '@/lib/omni-gridder-client'
import { allowedInputUris } from '@/lib/og-demo-inputs'

const GCS_STAGING_BUCKET = process.env.OG_GCS_STAGING_BUCKET
const PLOT_SUFFIX = '-plot'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  if (!isAdmin(request)) return unauthorizedResponse()
  if (!GCS_STAGING_BUCKET) {
    return NextResponse.json({ error: 'OG_GCS_STAGING_BUCKET is not set' }, { status: 500 })
  }

  const { jobId } = await params
  const status = await getJobStatus(jobId)
  if (!status) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // In comparison mode three regrid jobs (nearest/bilinear/conservative)
  // poll this route independently. Only ONE of them should chain a Plot
  // job — otherwise every poller that lands after the transition submits
  // its own plot, wasting worker cycles for images nobody's UI shows. The
  // frontend opts a single "primary" poll loop in via ?chainPlot=1 (the
  // bilinear job in comparison mode, or the sole job in single-method mode).
  const chainPlot = request.nextUrl.searchParams.get('chainPlot') === '1'

  // Once the regrid stage succeeds, chain a Plot job reading its output.
  // Job IDs are unique-insert-only in og-server's job store (409 on
  // duplicate), so re-submitting on every subsequent poll hit that lands
  // after this transition is harmless — submitJob() already treats 409 as
  // success. The Plot job's own gs:// input is reconstructed from the same
  // bucket/jobId convention used at submit time, not parsed back out of the
  // (signed, HTTPS) result_uri og-server returns — workers need a raw gs://
  // URI to read via DataReader, not a browser-facing signed download link.
  const isRegridJob = status.processor_type === 'regrid' && !jobId.endsWith(PLOT_SUFFIX)
  if (chainPlot && isRegridJob && status.status === 'succeeded') {
    // Optional before/after panel: the client passes back the input URI it
    // was told at submit time (?compare=...); it is only honored if it's in
    // the same server-side allowlist the submit route enforces — the plot
    // worker reads this URI from GCS, so it must never be client-arbitrary.
    const compare = request.nextUrl.searchParams.get('compare')
    const compareUri = compare && allowedInputUris().includes(compare) ? compare : undefined
    const plotJobId = `${jobId}${PLOT_SUFFIX}`
    await submitJob({
      job_id: plotJobId,
      processor_type: 'plot',
      kind: 'plot',
      input_uri: `gs://${GCS_STAGING_BUCKET}/demo/regrid/${jobId}/output.nc`,
      output_uri: `gs://${GCS_STAGING_BUCKET}/demo/regrid/${jobId}/plot.png`,
      params: {
        variable: 'HGT',
        title: 'Agentic OG — Method Comparison Demo',
        colormap: 'RdYlBu_r',
        ...(compareUri ? { compare_uri: compareUri } : {}),
      },
    })
    return NextResponse.json({ ...status, nextJobId: plotJobId })
  }

  return NextResponse.json(status)
}
