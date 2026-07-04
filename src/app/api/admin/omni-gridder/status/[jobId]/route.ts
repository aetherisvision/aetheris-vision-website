import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { getJobStatus, submitJob } from '@/lib/omni-gridder-client'

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

  // Once the regrid stage succeeds, chain a Plot job reading its output.
  // Job IDs are unique-insert-only in og-server's job store (409 on
  // duplicate), so re-submitting on every subsequent poll hit that lands
  // after this transition is harmless — submitJob() already treats 409 as
  // success. The Plot job's own gs:// input is reconstructed from the same
  // bucket/jobId convention used at submit time, not parsed back out of the
  // (signed, HTTPS) result_uri og-server returns — workers need a raw gs://
  // URI to read via DataReader, not a browser-facing signed download link.
  const isRegridJob = status.processor_type === 'regrid' && !jobId.endsWith(PLOT_SUFFIX)
  if (isRegridJob && status.status === 'succeeded') {
    const plotJobId = `${jobId}${PLOT_SUFFIX}`
    await submitJob({
      job_id: plotJobId,
      processor_type: 'plot',
      kind: 'plot',
      input_uri: `gs://${GCS_STAGING_BUCKET}/demo/${jobId}/output.nc`,
      output_uri: `gs://${GCS_STAGING_BUCKET}/demo/${jobId}/plot.png`,
      params: {
        variable: 'temperature',
        title: 'Agentic OG — Live Demo',
        colormap: 'RdYlBu_r',
      },
    })
    return NextResponse.json({ ...status, nextJobId: plotJobId })
  }

  return NextResponse.json(status)
}
