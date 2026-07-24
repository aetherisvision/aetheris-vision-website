import { NextResponse } from 'next/server'
import {
  DEMO_DATASETS,
  allowedInputUris,
  buildTargetGrid,
  datasetById,
  methodRefusalReason,
} from './og-demo-inputs'
import {
  generateTargetGrid,
  getJobStatus,
  submitJob,
  toJobDstGrid,
  triggerWorkerRun,
  type OmniGridderJobStatus,
} from './omni-gridder-client'

// Shared, framework-light omni-gridder proxy logic — the single home for the
// og-server orchestration that previously lived inline in the three
// /api/admin/omni-gridder/* route handlers (submit / status / download).
//
// Split of responsibilities (SRP): this module owns "talk to og-server
// correctly, validate every client-supplied value, and normalize every
// failure into a status+message"; the ROUTE that calls it owns "who is
// allowed, and how much" (authn + rate class / budget). That boundary is what
// lets a future PUBLIC showcase route (issue #89) reuse every function here
// unchanged while enforcing a stricter per-visitor budget — see the
// `checkBudget` extension point on submitRegridBatch(). No budget/rate logic
// lives in this module by design.

const GCS_STAGING_BUCKET = process.env.OG_GCS_STAGING_BUCKET

// ---- Error normalization ---------------------------------------------------

/**
 * A normalized proxy failure: the HTTP status and message a route should
 * return, plus any response headers (e.g. Retry-After on a 429). Every
 * function below returns one of these instead of throwing, so both the admin
 * routes and a future public route render failures identically.
 */
export interface ProxyError {
  status: number
  error: string
  headers?: Record<string, string>
}

export type ProxyOutcome<T> = { ok: true; data: T } | ({ ok: false } & ProxyError)

/** Render a ProxyError as the JSON error response both route families use. */
export function proxyErrorResponse(err: ProxyError): NextResponse {
  return NextResponse.json({ error: err.error }, { status: err.status, headers: err.headers })
}

// ---- Submit ----------------------------------------------------------------

/**
 * Methods the showcase can request. `ewa` (Elliptical Weighted Averaging) is
 * the swath resampler — it is the method for satellite geolocation, and is
 * meaningless on a rectilinear source, which is why validity is per-dataset
 * (see `DemoDataset.allowedMethods`) and not a single global list.
 */
export type RegridMethod = 'nearest' | 'bilinear' | 'conservative' | 'ewa'
const VALID_METHODS: RegridMethod[] = ['nearest', 'bilinear', 'conservative', 'ewa']

export interface SubmitRequestBody {
  /** One or more methods to run against the same dataset. Defaults to the dataset's first allowed method. */
  methods?: string[]
  /**
   * Dataset id from the showcase catalog. The client names a dataset; it never
   * supplies a URI or a destination grid (SSRF / resource-exhaustion).
   */
  datasetId?: string
  /**
   * @deprecated Superseded by `datasetId`. Still accepted so an in-flight page
   * load from before this change keeps working: it is resolved against the
   * catalog by URI and rejected if it does not match a catalogued dataset.
   */
  inputUri?: string
}

export interface SubmittedJob {
  jobId: string
  method: RegridMethod
}

export interface SubmitResult {
  jobs: SubmittedJob[]
  inputUri: string
  /** Which catalog dataset actually ran — the client should render what was computed, not what it asked for. */
  datasetId: string
  /** Destination cell count, so the UI can state the size of the job honestly rather than implying instant work. */
  destinationCells: number
  workerTriggered: boolean
}

/**
 * Optional policy hook invoked AFTER request validation but BEFORE any job is
 * submitted to og-server — the exact point at which a caller enforces its own
 * budget / rate class. Return a ProxyError to short-circuit submission with
 * that status+message (+ optional headers); return null (or omit the hook) to
 * proceed.
 *
 * This is the extension point for the future public #89 showcase route: the
 * admin route passes an IP-based rate limit here, and a public route will pass
 * a stricter per-visitor budget / rate class WITHOUT touching this module.
 * Ordering is deliberate — a request that fails validation never consumes
 * budget, matching the original admin route's behavior.
 */
export type BudgetCheck = () => Promise<ProxyError | null>

// The destination grid is generated server-side from the dataset catalog —
// never client-supplied (same SSRF / resource-exhaustion reasoning as the
// input allowlist: an arbitrary dst_grid could ask og-server to materialize an
// enormous output array). See `buildTargetGrid` in ./og-demo-inputs.
//
// It replaced a hard-coded 0.5° CONUS grid, which it reproduces exactly for
// the `gfs-hgt500` entry (lat 24..49 step 0.5 = 51 points; lon -125..-66 step
// 0.5 = 119 points). That equivalence matters beyond tidiness: the weight
// cache is keyed on the destination axes, so a grid that differed even in the
// last decimal would silently orphan every cached operator built before this
// change. Pinned by `buildTargetGrid reproduces the legacy CONUS grid` in
// og-demo-inputs.test.ts.

/**
 * Validate a submit request, optionally enforce a caller-supplied budget, then
 * submit one regrid job per (deduped, allowlisted) method and best-effort
 * trigger the worker. Talks to external systems (WIF token minting, og-server,
 * Cloud Run Admin API); any throw past validation is caught and normalized to
 * a 500 ProxyError so a route never surfaces Next's HTML 500 page (which is
 * exactly how a missing/stale env var once hid from us in production).
 */
export async function submitRegridBatch(
  body: SubmitRequestBody,
  checkBudget?: BudgetCheck,
): Promise<ProxyOutcome<SubmitResult>> {
  if (!GCS_STAGING_BUCKET) {
    return { ok: false, status: 500, error: 'OG_GCS_STAGING_BUCKET is not set' }
  }

  // Resolve the dataset FIRST: it decides the destination grid and which
  // methods are even meaningful, so method validation cannot be done against a
  // global list ahead of it. Resolution precedence matters: the deprecated
  // inputUri form must be checked when datasetId is ABSENT — datasetById()
  // falls back to the default dataset on undefined, which would otherwise
  // make the URI-allowlist rejection below unreachable for exactly the
  // callers it exists for (and silently run the default dataset for a
  // request that named a different URI).
  let dataset: ReturnType<typeof datasetById>
  if (body.datasetId) {
    dataset = datasetById(body.datasetId)
    if (!dataset) {
      return { ok: false, status: 400, error: `Unknown dataset "${body.datasetId}"` }
    }
  } else if (body.inputUri) {
    // Deprecated URI form: resolve it against the catalog rather than trusting
    // it. An allowlisted URI with no catalog row would have no target grid.
    dataset = DEMO_DATASETS.find((d) => d.uri === body.inputUri) ?? null
    if (!dataset) {
      return { ok: false, status: 400, error: 'input URI is not in the server allowlist' }
    }
  } else {
    // Bare body: neither identifier given — the documented default applies.
    dataset = datasetById(undefined)
    if (!dataset) {
      return { ok: false, status: 500, error: 'showcase dataset catalog is empty' }
    }
  }

  const requestedMethods =
    body.methods && body.methods.length > 0 ? body.methods : [dataset.allowedMethods[0]]
  // Dedupe before validation/submission — {methods:["bilinear","bilinear"]}
  // would otherwise submit the same jobId twice and schedule duplicate polling
  // for what is really a single job. Preserve request order.
  const methods = [...new Set(requestedMethods)] as string[]
  const invalidMethod = methods.find((m) => !VALID_METHODS.includes(m as RegridMethod))
  if (invalidMethod) {
    return {
      ok: false,
      status: 400,
      error: `Invalid method "${invalidMethod}" — must be one of ${VALID_METHODS.join(', ')}`,
    }
  }
  // Per-dataset compatibility. The UI disables these combinations, but a
  // UI-only matrix is a suggestion — refuse them here too, and return the
  // ENGINE'S reason rather than a generic 400, because "why not" is the
  // interesting part of this product.
  for (const method of methods as RegridMethod[]) {
    const refusal = methodRefusalReason(dataset, method)
    if (refusal) {
      return {
        ok: false,
        status: 400,
        error: `"${method}" is not valid for ${dataset.label}. ${refusal}`,
      }
    }
  }
  if (methods.length > dataset.allowedMethods.length) {
    return { ok: false, status: 400, error: 'Too many methods requested' }
  }

  const inputUri = dataset.uri

  // Budget / rate-class gate: after validation, before any external call — an
  // invalid request must never consume budget.
  if (checkBudget) {
    const budgetError = await checkBudget()
    if (budgetError) return { ok: false, ...budgetError }
  }

  // The destination grid comes from the catalog, never from the client — and
  // for a PROJECTED target it comes from og-server, which owns the PROJ math.
  //
  // A throw in the geographic branch means a malformed catalog entry (bad
  // bbox/resolution, or a grid above the cell cap) — a SERVER bug, not a
  // client one, so it must not be reported as a 400. The projected branch can
  // additionally fail on a network/auth problem reaching og-server, which is
  // also not the caller's fault. Both are caught here, separately from the
  // submission block below, so the failure modes stay distinguishable in logs.
  let dstGrid: unknown
  let destinationCells: number

  if (dataset.target.kind === 'projected') {
    // Note the units: `resolutionMeters`, because the target CRS is projected.
    // The tagged union is what keeps this from silently being read as degrees.
    try {
      const grid = await generateTargetGrid({
        name: `${dataset.id}-target`,
        crs: dataset.target.crs,
        bbox: dataset.target.bbox,
        resolution: dataset.target.resolutionMeters,
      })
      // The response is NOT job-embeddable as-is: its projected axes live
      // under coordinates.y/x, while the worker's dst_grid contract reads
      // lat/lon. toJobDstGrid is the rename seam.
      dstGrid = toJobDstGrid(grid)
      destinationCells = grid.shape.reduce((a, b) => a * b, 1)
    } catch (err) {
      // Upstream: og-server unreachable, unauthenticated, or returning a grid
      // that failed validation. Reported as 502 — distinct from a catalog bug
      // below — because "the engine did not answer" and "our catalog is wrong"
      // want different responses from whoever is looking at the logs.
      const message = err instanceof Error ? err.message : String(err)
      console.error(`omni-gridder submit: target-grid generation failed for ${dataset.id} — ${message}`)
      return {
        ok: false,
        status: 502,
        error: 'the regridding engine could not generate the destination grid',
      }
    }
  } else {
    try {
      const grid = buildTargetGrid(dataset)
      dstGrid = grid
      destinationCells = grid.lat.length * grid.lon.length
    } catch (err) {
      // A malformed catalog entry (bad bbox/resolution, or above the cell cap)
      // is OUR bug, not the caller's, so it is never reported as a 400.
      const message = err instanceof Error ? err.message : String(err)
      console.error(`omni-gridder submit: invalid catalog entry — ${message}`)
      return { ok: false, status: 500, error: 'showcase dataset catalog is misconfigured' }
    }
  }

  const batchSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

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
    // are already submitted and will run whenever the worker next executes.
    const workerTrigger = await triggerWorkerRun()
    if (!workerTrigger.triggered) {
      console.warn(`omni-gridder submit: worker not auto-triggered (${workerTrigger.reason})`)
    }

    return {
      ok: true,
      data: {
        jobs: submitted,
        inputUri,
        datasetId: dataset.id,
        destinationCells,
        workerTriggered: workerTrigger.triggered,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`omni-gridder submit failed: ${message}`)
    return { ok: false, status: 500, error: `Job submission failed: ${message}` }
  }
}

// ---- Status (+ chained plot) -----------------------------------------------

const PLOT_SUFFIX = '-plot'

/** Request-derived options for a status poll — parsed by the caller from the URL. */
export interface StatusOptions {
  /** Whether this poll should chain a Plot job once the regrid succeeds. */
  chainPlot: boolean
  /** Optional before/after panel input URI (re-validated against the allowlist). */
  compare: string | null
  /** Optional comma-separated regrid job ids for a multi-panel comparison plot. */
  panels: string | null
}

export type StatusResult = OmniGridderJobStatus & { nextJobId?: string }

/**
 * Fetch a job's status and, when the caller opts in via chainPlot, chain a
 * single Plot job once the regrid stage succeeds.
 *
 * Deliberately does NOT wrap getJobStatus in try/catch: a transport failure
 * here should propagate (the admin route returned Next's 500 for it), unlike
 * the download path which normalizes lookup failures to a 502.
 */
export async function getRegridJobStatus(
  jobId: string,
  options: StatusOptions,
): Promise<ProxyOutcome<StatusResult>> {
  if (!GCS_STAGING_BUCKET) {
    return { ok: false, status: 500, error: 'OG_GCS_STAGING_BUCKET is not set' }
  }

  const status = await getJobStatus(jobId)
  if (!status) {
    return { ok: false, status: 404, error: 'Job not found' }
  }

  // Once the regrid stage succeeds, chain a Plot job reading its output. Job
  // IDs are unique-insert-only in og-server's job store (409 on duplicate), so
  // re-submitting on every subsequent poll that lands after this transition is
  // harmless — submitJob() already treats 409 as success. The Plot job's own
  // gs:// input is reconstructed from the same bucket/jobId convention used at
  // submit time, not parsed back out of the (signed, HTTPS) result_uri
  // og-server returns — workers need a raw gs:// URI to read via DataReader,
  // not a browser-facing signed download link.
  //
  // In comparison mode three regrid jobs poll independently; only ONE (the
  // caller's designated primary) passes chainPlot, so exactly one plot renders.
  const isRegridJob = status.processor_type === 'regrid' && !jobId.endsWith(PLOT_SUFFIX)
  if (options.chainPlot && isRegridJob && status.status === 'succeeded') {
    // Optional before/after panel: only honored if the compare URI is in the
    // same server-side allowlist the submit path enforces — the plot worker
    // reads this URI from GCS, so it must never be client-arbitrary.
    const compareUri =
      options.compare && allowedInputUris().includes(options.compare)
        ? options.compare
        : undefined

    // Comparison mode: panels=<jobId,jobId,...> chains ONE multi-panel plot
    // (input + every method's output). Only job IDs are accepted — each is
    // strictly validated and its output URI reconstructed from OUR bucket/jobId
    // convention, so the client never supplies a URI. Invalid ids are a loud
    // 400, not a silent drop: a typo'd panel list should never quietly render
    // fewer methods.
    let panelUris: { uri: string; label: string }[] | undefined
    if (options.panels) {
      const ids = options.panels.split(',').map((s) => s.trim()).filter(Boolean)
      const idPattern = /^[a-z][a-z0-9-]{0,58}-(nearest|bilinear|conservative|ewa)$/
      if (ids.length === 0 || ids.length > 4 || ids.some((id) => !idPattern.test(id))) {
        return { ok: false, status: 400, error: 'panels must be 1-4 valid regrid job ids' }
      }
      panelUris = ids.map((id) => {
        const method = id.slice(id.lastIndexOf('-') + 1)
        return {
          uri: `gs://${GCS_STAGING_BUCKET}/demo/regrid/${id}/output.nc`,
          label: method.charAt(0).toUpperCase() + method.slice(1),
        }
      })
    }

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
        ...(panelUris ? { panel_uris: panelUris } : {}),
      },
    })
    return { ok: true, data: { ...status, nextJobId: plotJobId } }
  }

  return { ok: true, data: status }
}

// ---- Download (signed-URL proxy) -------------------------------------------

// Job IDs are our own generated strings (see submitRegridBatch /
// getRegridJobStatus), always lowercase-alnum-hyphen and always ending in
// "-plot" for the chained plot job this path serves. Reject anything else
// before it ever reaches getJobStatus.
const PLOT_JOB_ID_RE = /^[a-z][a-z0-9-]{0,62}-plot$/

export interface DownloadSuccess {
  /** The upstream (signed-URL) body to stream back to the client. */
  body: ReadableStream<Uint8Array>
  contentType: string
  /** Suggested attachment filename (no directory, includes extension). */
  filename: string
}

/**
 * Resolve a plot job to its signed GCS result URL and stream the bytes back.
 *
 * Looked up by job id, not by URL: the client never sees or holds the signed
 * bearer URL. We resolve job -> status -> result_uri via getJobStatus(), and
 * only THEN apply the host/path allowlist below — defense in depth, not the
 * primary authority (og-server is the only thing that ever produces a value
 * here, and it only ever returns signed URLs). Fetching server-side also
 * sidesteps the cross-origin <a download> limitation (storage.googleapis.com
 * ignores the download attribute and serves no CORS headers for a blob fetch).
 */
export async function downloadPlot(
  jobId: string | null,
): Promise<ProxyOutcome<DownloadSuccess>> {
  if (!GCS_STAGING_BUCKET) {
    return { ok: false, status: 500, error: 'OG_GCS_STAGING_BUCKET is not set' }
  }

  if (!jobId || !PLOT_JOB_ID_RE.test(jobId)) {
    return {
      ok: false,
      status: 400,
      error: 'job query param required — must be a plot job id ending in "-plot"',
    }
  }

  let status
  try {
    status = await getJobStatus(jobId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 502, error: `Job lookup failed: ${message}` }
  }
  if (!status) {
    return { ok: false, status: 404, error: 'Job not found' }
  }
  if (status.status !== 'succeeded' || !status.result_uri) {
    return {
      ok: false,
      status: 409,
      error: `Job is not ready for download (status: ${status.status})`,
    }
  }

  let target: URL
  try {
    target = new URL(status.result_uri)
  } catch {
    return { ok: false, status: 502, error: 'og-server returned an invalid result URL' }
  }
  const validHost = target.hostname === 'storage.googleapis.com'
  const validPath = target.pathname.startsWith(`/${GCS_STAGING_BUCKET}/`)
  if (target.protocol !== 'https:' || !validHost || !validPath) {
    return {
      ok: false,
      status: 400,
      error: 'result URL must be a signed storage.googleapis.com link for the demo bucket',
    }
  }

  let upstream: Response
  try {
    upstream = await fetch(target.toString(), {
      // A redirect off the allowlisted host must fail outright, never be
      // followed — 'follow' would let a compromised/misconfigured upstream hop
      // us to an arbitrary origin after the guard above already passed.
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    // fetch() throws (doesn't resolve to a non-ok Response) on DNS failure,
    // network errors, timeout, and a blocked redirect — all of those must come
    // back as JSON, not surface as Next's HTML 500 page.
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 502, error: `Upstream fetch failed: ${message}` }
  }

  if (!upstream.ok || !upstream.body) {
    return {
      ok: false,
      status: 502,
      error: `upstream fetch failed (${upstream.status}) — the signed URL may have expired; re-run the job`,
    }
  }

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return {
    ok: true,
    data: {
      body: upstream.body,
      contentType: upstream.headers.get('content-type') ?? 'image/png',
      filename: `og-method-comparison-${stamp}.png`,
    },
  }
}
