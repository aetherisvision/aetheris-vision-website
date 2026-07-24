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

/**
 * An `og_core::Grid` as returned by `POST /v1/target-grids`, ready to embed
 * verbatim as a regrid job's `params.dst_grid`.
 *
 * Deliberately not re-modelled field-by-field: the grid is a pass-through
 * artifact, and a partial local mirror of og-core's schema would be a second
 * definition that drifts. Only the fields the showcase actually reads are
 * named; the rest ride along untouched.
 */
export interface OmniGridderGrid {
  name: string
  shape: number[]
  /** The RESOLVED CRS — never the `"utm"` alias, which og-server resolves to a concrete EPSG code before returning. */
  crs: string
  dim_names: string[]
  coordinates: Record<string, number[]>
}

export interface TargetGridRequest {
  name: string
  /** PROJ-acceptable CRS, or the convenience key `"utm"` / `"utm_auto"`. */
  crs: string
  /** `[min_lon, min_lat, max_lon, max_lat]` in EPSG:4326 degrees. */
  bbox: [number, number, number, number]
  /** Spacing in the target CRS's native units — metres for a projected CRS. */
  resolution: number
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

/**
 * Ask og-server to generate a target grid.
 *
 * Grid generation lives in the engine, not here: og-geo is PROJ-backed and
 * owns zone selection and the projected axis walk. A TypeScript
 * reimplementation would be a second, quietly-diverging copy of coordinate
 * math — and one whose errors would be invisible, because a plausible-looking
 * grid regrids to plausible-looking garbage rather than failing.
 *
 * The response is validated, not trusted. It crosses a process boundary, so a
 * 200 is not evidence the body has the shape the caller is about to embed;
 * a malformed grid passed on as `dst_grid` would fail later, further away,
 * with a worse message.
 */
export async function generateTargetGrid(req: TargetGridRequest): Promise<OmniGridderGrid> {
  const res = await ogFetch('/v1/target-grids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    // og-server returns { code, message } for this route; fall back to raw
    // text when the body is not that shape (e.g. an infra-level error page).
    const body = await res.text()
    let detail = body
    try {
      const parsed = JSON.parse(body) as { code?: string; message?: string }
      if (parsed.message) detail = `${parsed.code ?? 'ERROR'}: ${parsed.message}`
    } catch {
      // keep the raw text
    }
    throw new Error(`generateTargetGrid failed (${res.status}): ${detail}`)
  }

  return validateGrid(await res.json())
}

/**
 * The axis-array shape `JobSpec.params.dst_grid` requires: the worker's
 * `parse_dst_grid` (og-process) reads the two separable axes from `lat`/`lon`
 * regardless of interpretation — a projected grid puts its native-unit
 * `y`/`x` axes under those same keys and carries `crs` to govern how they are
 * read. See the C2 contract comment on `parse_dst_grid`.
 */
export interface JobDstGrid {
  name: string
  crs: string
  lat: number[]
  lon: number[]
}

/**
 * Converts a `/v1/target-grids` response into the `dst_grid` shape a job spec
 * embeds. The response names its coordinate axes per CRS family (`y`/`x` when
 * projected, `lat`/`lon` when geographic); the worker's job contract uses
 * `lat`/`lon` for both, so this is the one place the rename happens. Passing
 * the response through verbatim instead fails in the worker with
 * "dst_grid.lat array required" — after the job was accepted.
 */
export function toJobDstGrid(grid: OmniGridderGrid): JobDstGrid {
  const axes = grid.coordinates
  const lat = axes.y ?? axes.lat
  const lon = axes.x ?? axes.lon
  if (!lat || !lon) {
    throw new Error(
      `target grid "${grid.name}" has no embeddable axis pair — coordinates carry [${Object.keys(axes).join(', ')}], expected y/x or lat/lon`,
    )
  }
  return { name: grid.name, crs: grid.crs, lat, lon }
}

/** Structural validation of a target-grid response. Throws with a specific reason. */
export function validateGrid(value: unknown): OmniGridderGrid {
  // Annotated on the VARIABLE, not just the arrow: TypeScript only treats a
  // call as control-flow-terminating when the binding itself is declared to
  // return `never`. Without this the narrowing below silently stops working
  // and every access reads as possibly-undefined — which invites papering
  // over it with `!`, defeating the point of validating at all.
  const fail: (why: string) => never = (why) => {
    throw new Error(`generateTargetGrid returned a malformed grid: ${why}`)
  }

  if (typeof value !== 'object' || value === null) fail('not an object')
  const g = value as Partial<OmniGridderGrid>

  if (typeof g.name !== 'string') fail('missing name')
  if (typeof g.crs !== 'string' || g.crs.length === 0) fail('missing crs')
  // The alias must never survive into the returned grid: og-server resolves it
  // to a concrete EPSG code so the artifact records the zone actually used. If
  // it ever did survive, the provenance claim would be silently false.
  if (/^utm(_auto)?$/i.test(g.crs.trim())) {
    fail(`crs is the unresolved alias "${g.crs}" rather than a concrete CRS`)
  }
  if (!Array.isArray(g.shape) || g.shape.length === 0) fail('missing or empty shape')
  if (!g.shape.every((n) => Number.isInteger(n) && n > 0)) {
    fail('shape has a non-integer or non-positive entry')
  }
  if (!Array.isArray(g.dim_names) || g.dim_names.length !== g.shape.length) {
    fail('dim_names does not match shape rank')
  }
  if (typeof g.coordinates !== 'object' || g.coordinates === null) fail('missing coordinates')

  for (const [key, axis] of Object.entries(g.coordinates as Record<string, unknown>)) {
    if (!Array.isArray(axis)) fail(`coordinate "${key}" is not an array`)
    if (!(axis as unknown[]).every((n) => typeof n === 'number' && Number.isFinite(n))) {
      fail(`coordinate "${key}" has a non-finite value`)
    }
  }

  return g as OmniGridderGrid
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
