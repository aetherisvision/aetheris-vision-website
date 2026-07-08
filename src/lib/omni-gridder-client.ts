import { getOgServerIdToken, getOgWorkerAccessToken } from './omni-gridder-auth'

const OG_SERVER_URL = process.env.OG_SERVER_URL
const OG_SERVER_API_KEY = process.env.OG_SERVER_API_KEY

// Cloud Run Admin API location for the og-worker Job — separate from
// OG_SERVER_URL (that's the og-server *service* URL used for job submission
// and status polling; this is the *worker Job resource* that must be
// manually executed today because it's Scheduler/manually triggered, not
// request-driven).
const GCP_PROJECT_ID = process.env.OG_WORKER_GCP_PROJECT_ID
const GCP_REGION = process.env.OG_WORKER_GCP_REGION || 'us-central1'
const WORKER_JOB_NAME = process.env.OG_WORKER_JOB_NAME || 'og-worker'

export interface OmniGridderJobSpec {
  job_id: string
  processor_type: 'fetch' | 'regrid' | 'stitch' | 'plot'
  kind: string
  input_uri: string
  output_uri: string
  params: Record<string, unknown>
}

export interface OmniGridderJobDiagnostics {
  interpolation_method: string | null
  weight_cache_hit: boolean | null
  rmse: number | null
  max_abs_error: number | null
  // null for non-conservative methods (nearest/bilinear) BY DESIGN — that is
  // not "missing data," render it as "n/a (not a conserving method)".
  conservation_residual: number | null
  nan_count: number | null
  artifact_flags: string[] | null
  notes: string[] | null
}

export interface OmniGridderJobStatus {
  job_id: string
  processor_type: string
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  submitted_at: number
  result_uri: string | null
  error_message: string | null
  // null for queued/processing/failed/legacy jobs pre-dating diagnostics support.
  diagnostics: OmniGridderJobDiagnostics | null
}

async function ogFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!OG_SERVER_URL) throw new Error('OG_SERVER_URL is not set')
  if (!OG_SERVER_API_KEY) throw new Error('OG_SERVER_API_KEY is not set')

  // og-server the app requires X-Api-Key for tenant identification and rate
  // limiting; Cloud Run's own IAM layer (checked before the request even
  // reaches the app) requires a separate audience-scoped Google ID token —
  // these are two independent auth layers, not redundant.
  const idToken = await getOgServerIdToken(OG_SERVER_URL)

  return fetch(`${OG_SERVER_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${idToken}`,
      'X-Api-Key': OG_SERVER_API_KEY,
    },
  })
}

export async function submitJob(spec: OmniGridderJobSpec): Promise<void> {
  const res = await ogFetch('/v1/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec }),
  })
  // A 409-style "already exists" is expected and harmless when re-chaining
  // a follow-on job across repeated status polls — every other failure is
  // a real problem and should surface.
  if (!res.ok && res.status !== 409) {
    const body = await res.text()
    throw new Error(`submitJob failed (${res.status}): ${body}`)
  }
}

export async function getJobStatus(jobId: string): Promise<OmniGridderJobStatus | null> {
  const res = await ogFetch(`/v1/jobs/${encodeURIComponent(jobId)}`)
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`getJobStatus failed (${res.status}): ${body}`)
  }
  return (await res.json()) as OmniGridderJobStatus
}

export interface TriggerWorkerRunResult {
  triggered: boolean
  /** Present when triggered is false — human-readable reason. */
  reason?: string
}

/**
 * Best-effort: ask Cloud Run Admin API to execute the og-worker Job so
 * queued demo jobs actually get picked up, instead of sitting in 'queued'
 * until someone runs `gcloud run jobs execute og-worker` by hand.
 *
 * This is NOT confirmed to work end-to-end. It reuses the same WIF
 * impersonation as og-server invocation (omni-gridder-website-wif), but
 * that SA was provisioned "scoped to only invoke og-server" — it may not
 * hold roles/run.invoker (or the narrower `run.jobs.run` permission) on the
 * og-worker Job resource. A 403 here is an expected outcome until that IAM
 * grant is confirmed/added; this function treats it as non-fatal so a demo
 * submission never fails just because the worker couldn't be auto-triggered
 * (the job still runs whenever the worker is next executed some other way).
 *
 * Gated by OG_ENABLE_WORKER_TRIGGER (default: enabled) so it can be turned
 * off without a code change if it turns out to be noisy/wasteful before the
 * IAM grant lands.
 */
export async function triggerWorkerRun(): Promise<TriggerWorkerRunResult> {
  if (process.env.OG_ENABLE_WORKER_TRIGGER === 'false') {
    return { triggered: false, reason: 'OG_ENABLE_WORKER_TRIGGER=false' }
  }
  if (!GCP_PROJECT_ID) {
    return { triggered: false, reason: 'OG_WORKER_GCP_PROJECT_ID is not set' }
  }

  try {
    const accessToken = await getOgWorkerAccessToken()
    const url = `https://run.googleapis.com/v2/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/jobs/${WORKER_JOB_NAME}:run`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '<unreadable body>')
      // TODO(open item): if this is a 403, the omni-gridder-website-wif SA
      // needs roles/run.invoker (or run.jobs.run) granted on the og-worker
      // Job resource in esmai-dev. Not yet confirmed/granted as of this
      // change — see docs note in the PR description.
      console.error(`triggerWorkerRun: jobs:run failed (${res.status}): ${body}`)
      return { triggered: false, reason: `Cloud Run Admin API returned ${res.status}` }
    }
    return { triggered: true }
  } catch (err) {
    console.error('triggerWorkerRun: error minting/using access token', err)
    return {
      triggered: false,
      reason: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
