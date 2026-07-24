'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type RegridMethod = 'nearest' | 'bilinear' | 'conservative' | 'ewa'
// No local list of "all methods": the compatibility matrix renders whatever the
// server sends for the selected dataset. A second enumeration here would be a
// place for the page's idea of the method set to drift from the engine's.
const METHOD_LABELS: Record<RegridMethod, string> = {
  nearest: 'Nearest neighbour',
  bilinear: 'Bilinear',
  conservative: 'Conservative',
  ewa: 'EWA (swath)',
}

/**
 * Which methods are valid depends on the DATASET, not on the app.
 *
 * The primary method — the one whose result gets plotted when several run —
 * used to be the constant `bilinear`. That is not merely a style choice once
 * satellite datasets exist: bilinear is invalid on a swath source, so a fixed
 * primary would ask for a plot of a job that was refused and never submitted.
 * It now comes from the selected dataset's first allowed method.
 */
interface MethodAvailability {
  method: RegridMethod
  allowed: boolean
  reason: string | null
}

interface DatasetView {
  id: string
  label: string
  source: string
  variable: string
  units: string
  geometry: 'rectilinear' | 'geostationary-swath'
  nativeResolution: string
  demonstrates: string
  targetSummary: string
  targetCrsLabel: string
  destinationCells: number | null
  methods: MethodAvailability[]
  primaryMethod: RegridMethod
}

/**
 * Where a number on this page came from.
 *
 * Every figure the showcase displays is either measured by the run you just
 * watched, or a recorded result from a verification that happened elsewhere.
 * Those are not the same claim, and a page that renders them identically is
 * quietly overstating one of them. The badge is deliberately visible rather
 * than a footnote.
 */
type Provenance = 'live' | 'verified'

type RowStatus = 'idle' | 'submitting' | 'queued' | 'processing' | 'plotting' | 'succeeded' | 'failed'

interface JobDiagnostics {
  interpolation_method: string | null
  weight_cache_hit: boolean | null
  rmse: number | null
  max_abs_error: number | null
  conservation_residual: number | null
  nan_count: number | null
  artifact_flags: string[] | null
  notes: string[] | null
}

interface JobStatusResponse {
  job_id: string
  processor_type: string
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  submitted_at: number
  result_uri: string | null
  error_message: string | null
  diagnostics: JobDiagnostics | null
  nextJobId?: string
}

interface MethodRow {
  method: RegridMethod
  jobId: string | null
  status: RowStatus
  submittedAt: number | null
  completedAt: number | null
  diagnostics: JobDiagnostics | null
  errorMessage: string | null
}

interface TimelineEntry {
  at: number
  label: string
}

/**
 * One completed run, kept so a later run of the same (dataset, method) can be
 * compared against it.
 *
 * This is what makes the weight-reuse claim demonstrable rather than asserted.
 * The engine separates weight GENERATION (the expensive, accuracy-gated step)
 * from weight APPLICATION (the cheap, parity-gated one); the visible
 * consequence is that the second run of an identical job skips generation
 * entirely. A cache-hit column alone does not show that — it takes two runs
 * side by side, and both have to be ones the viewer actually watched.
 */
interface RunObservation {
  wallClockMs: number
  cacheHit: boolean | null
}

/** Session-scoped run history, keyed `datasetId::method`. */
type RunHistory = Record<string, RunObservation[]>

function historyKey(datasetId: string, method: RegridMethod): string {
  return `${datasetId}::${method}`
}

/**
 * The first cold run and the first subsequent warm run for one key, or `null`
 * when the session has not observed both.
 *
 * Returns `null` rather than a partial answer on purpose: a speedup figure
 * derived from one measurement is not a speedup figure. Until both exist the
 * panel says how to produce the second one.
 */
function coldWarmPair(
  observations: RunObservation[] | undefined,
): { cold: RunObservation; warm: RunObservation } | null {
  if (!observations) return null
  const coldIndex = observations.findIndex((o) => o.cacheHit === false)
  if (coldIndex === -1) return null
  const warm = observations.slice(coldIndex + 1).find((o) => o.cacheHit === true)
  return warm ? { cold: observations[coldIndex], warm } : null
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

const POLL_INTERVAL_MS = 3000

function idleRow(method: RegridMethod): MethodRow {
  return {
    method,
    jobId: null,
    status: 'idle',
    submittedAt: null,
    completedAt: null,
    diagnostics: null,
    errorMessage: null,
  }
}

function formatWallClock(row: MethodRow): string {
  if (!row.submittedAt) return '—'
  const end = row.completedAt ?? Date.now()
  const ms = end - row.submittedAt
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

function formatConservationResidual(row: MethodRow): string {
  if (row.status !== 'succeeded' && row.status !== 'plotting') return '—'
  if (!row.diagnostics) return '—'
  if (row.method !== 'conservative') return 'n/a (not a conserving method)'
  if (row.diagnostics.conservation_residual === null) return '—'
  return row.diagnostics.conservation_residual.toExponential(2)
}

function formatNumber(value: number | null): string {
  return value === null ? '—' : value.toString()
}

/**
 * Marks whether a figure was measured by the run you just watched, or is a
 * recorded result from a verification performed elsewhere.
 *
 * Visible rather than a footnote, on purpose. A page that renders a live
 * measurement and a recorded benchmark in the same style is overstating one of
 * them, and the reader has no way to tell which.
 */
function ProvenanceBadge({ kind }: { kind: Provenance }) {
  const live = kind === 'live'
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        live ? 'bg-emerald-500/15 text-emerald-300' : 'bg-sky-500/15 text-sky-300'
      }`}
      title={
        live
          ? 'Measured by this run, on this hardware'
          : 'Recorded result from a verification performed elsewhere — not exercised by this demo'
      }
    >
      {live ? 'live run' : 'recorded verification'}
    </span>
  )
}

/**
 * The speed story, told with the viewer's own runs.
 *
 * ADR #290's keystone separation — weight GENERATION (expensive, oracle-gated)
 * from weight APPLICATION (cheap, parity-gated) — has one consequence a
 * non-specialist can see: rerun the same job and the expensive step vanishes,
 * because the operator is already in the cache. This panel shows that as a
 * cold/warm pair measured in this browser session, or tells the viewer how to
 * produce one. It never substitutes a recorded benchmark for the pair: a
 * speed claim on this page is either measured live or absent.
 *
 * Wall clock here includes queue + polling latency, and says so — the honest
 * comparison is end-to-end time for the same job, not a flattering subset.
 */
function WeightReusePanel({
  dataset,
  allowedMethods,
  runHistory,
}: {
  dataset: DatasetView
  allowedMethods: RegridMethod[]
  runHistory: RunHistory
}) {
  const pairs = allowedMethods
    .map((method) => ({
      method,
      pair: coldWarmPair(runHistory[historyKey(dataset.id, method)]),
    }))
    .filter((p): p is { method: RegridMethod; pair: NonNullable<ReturnType<typeof coldWarmPair>> } =>
      p.pair !== null,
    )

  return (
    <div className="mb-10">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-3">
        Weight reuse · {dataset.label}
      </h2>
      {pairs.length === 0 ? (
        <p className="text-sm text-gray-500">
          Run the same method twice on this dataset to measure it: the first run generates the
          remap operator (the expensive, accuracy-gated step), the second finds it in the cache
          and only applies it. Both runs are timed in this session — no recorded benchmark stands
          in for the pair.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-gray-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="border-b border-white/10 pb-2 pr-4">Method</th>
                <th className="border-b border-white/10 pb-2 pr-4">Cold (generates weights)</th>
                <th className="border-b border-white/10 pb-2 pr-4">Warm (reuses weights)</th>
                <th className="border-b border-white/10 pb-2 pr-4">Speedup</th>
                <th className="border-b border-white/10 pb-2">Provenance</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map(({ method, pair }) => (
                <tr key={method} className="text-gray-300">
                  <td className="border-b border-white/5 py-2 pr-4 font-medium text-white">
                    {METHOD_LABELS[method]}
                  </td>
                  <td className="border-b border-white/5 py-2 pr-4 font-mono">
                    {formatDuration(pair.cold.wallClockMs)}
                  </td>
                  <td className="border-b border-white/5 py-2 pr-4 font-mono">
                    {formatDuration(pair.warm.wallClockMs)}
                  </td>
                  <td className="border-b border-white/5 py-2 pr-4 font-mono text-emerald-300">
                    {pair.warm.wallClockMs > 0
                      ? `${(pair.cold.wallClockMs / pair.warm.wallClockMs).toFixed(1)}×`
                      : '—'}
                  </td>
                  <td className="border-b border-white/5 py-2">
                    <ProvenanceBadge kind="live" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-500">
            End-to-end wall clock, including queue and polling latency — the same overhead in both
            columns, so the difference is the generation step. Cold/warm classification comes from
            the engine&apos;s own <code>weight_cache_hit</code> diagnostic, not from run order.
          </p>
        </div>
      )}
    </div>
  )
}

export default function OmniGridderDemoPage() {
  const [datasets, setDatasets] = useState<DatasetView[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<RegridMethod>('bilinear')
  const [rows, setRows] = useState<Record<RegridMethod, MethodRow>>({
    nearest: idleRow('nearest'),
    bilinear: idleRow('bilinear'),
    conservative: idleRow('conservative'),
    ewa: idleRow('ewa'),
  })
  const [activeMethods, setActiveMethods] = useState<RegridMethod[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [plotUrl, setPlotUrl] = useState<string | null>(null)
  const [plotJobId, setPlotJobId] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [workerTriggered, setWorkerTriggered] = useState<boolean | null>(null)
  const [runHistory, setRunHistory] = useState<RunHistory>({})
  // The dataset a run was submitted UNDER, not whatever is selected when it
  // finishes. A job takes seconds and the picker stays live throughout, so
  // reading `selectedDatasetId` at completion time would file a GOES run under
  // whichever dataset the viewer clicked while waiting.
  const runDatasetIdRef = useRef<string | null>(null)
  /** Client-side submit time per method, consumed once when that run completes. */
  const runStartRef = useRef<Map<RegridMethod, number>>(new Map())
  const pollTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  // Input URI from the last submit response — passed back on the chainPlot
  // poll so the server can chain a before/after plot (server re-validates
  // it against its own allowlist; this is display plumbing, not authority).
  const inputUriRef = useRef<string>('')
  // Comparison mode: all regrid job ids from the batch, the set that have
  // succeeded so far, and whether the (single) multi-panel plot chain has
  // fired. The panel plot must wait for EVERY method to finish — chaining
  // on the primary alone would render panels for outputs that don't exist
  // yet. Server-side, the ids are re-validated and mapped to output URIs
  // by the server's own convention (see the status route).
  const panelJobIdsRef = useRef<string[]>([])
  const succeededJobsRef = useRef<Set<string>>(new Set())
  const panelChainFiredRef = useRef(false)

  // The catalog comes from the server rather than being duplicated here: the
  // compatibility matrix the page renders and the one the proxy ENFORCES must
  // be the same fact, or the UI will offer a combination the server refuses.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/admin/omni-gridder/datasets')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { datasets: DatasetView[] }
        if (cancelled) return
        if (!Array.isArray(data.datasets) || data.datasets.length === 0) {
          setCatalogError('The showcase catalog is empty')
          return
        }
        setDatasets(data.datasets)
        setSelectedDatasetId((current) => current ?? data.datasets[0].id)
      } catch (err) {
        if (!cancelled) {
          setCatalogError(err instanceof Error ? err.message : 'Could not load the dataset catalog')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedDataset = useMemo(
    () => datasets.find((d) => d.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  )
  const allowedMethods = useMemo(
    () => selectedDataset?.methods.filter((m) => m.allowed).map((m) => m.method) ?? [],
    [selectedDataset],
  )
  const primaryMethod: RegridMethod = selectedDataset?.primaryMethod ?? 'bilinear'

  // Keep the single-method selection valid when the dataset changes. Silently
  // leaving `bilinear` selected after switching to a satellite would submit a
  // combination the server refuses — the user would see an error for a choice
  // the UI made on their behalf.
  useEffect(() => {
    if (!selectedDataset) return
    if (!allowedMethods.includes(selectedMethod)) {
      setSelectedMethod(selectedDataset.primaryMethod)
    }
  }, [selectedDataset, allowedMethods, selectedMethod])

  const log = useCallback((label: string) => {
    setTimeline((prev) => [...prev, { at: Date.now(), label }])
  }, [])

  const stopAllPolling = useCallback(() => {
    for (const timer of pollTimers.current.values()) clearTimeout(timer)
    pollTimers.current.clear()
  }, [])

  const updateRow = useCallback((method: RegridMethod, patch: Partial<MethodRow>) => {
    setRows((prev) => ({ ...prev, [method]: { ...prev[method], ...patch } }))
  }, [])

  /**
   * Appends one completed regrid to the session's run history.
   *
   * Start times come from `runStartRef`, not from the `rows` state. This runs
   * inside a poll callback that may have closed over a stale render, and a
   * wrong start time would silently produce a wrong speedup — the exact kind
   * of number this panel exists to make trustworthy. A ref is also the only
   * place it can be read without doing state updates inside another updater,
   * which StrictMode would double-invoke into a double-counted run.
   */
  const recordRun = useCallback(
    (method: RegridMethod, completedAt: number, cacheHit: boolean | null) => {
      const datasetId = runDatasetIdRef.current
      const submittedAt = runStartRef.current.get(method)
      if (!datasetId || submittedAt === undefined) return
      // Consume it, so a chained plot poll or a duplicate terminal status
      // cannot append the same run twice.
      runStartRef.current.delete(method)
      const key = historyKey(datasetId, method)
      const observation: RunObservation = { wallClockMs: completedAt - submittedAt, cacheHit }
      setRunHistory((h) => ({ ...h, [key]: [...(h[key] ?? []), observation] }))
    },
    [],
  )

  // Plain function, not useCallback: it recurses on itself via setTimeout,
  // which the React Compiler's lint rules flag as unsafe inside a hook
  // (can't verify the self-reference is stable). It's only ever invoked from
  // event handlers below, never from an effect's dependency array, so it
  // doesn't need useCallback's referential-stability guarantee anyway.
  //
  // isPlotJob=true means this poll loop is tracking the chained Plot job,
  // not the regrid job — its result renders the map, not a row update.
  async function pollJob(
    jobId: string,
    method: RegridMethod,
    chainPlot: boolean,
    isPlotJob: boolean,
    lastStatus: string | null,
  ): Promise<void> {
    let res: Response
    try {
      const panelsQs =
        panelJobIdsRef.current.length > 1
          ? `&panels=${encodeURIComponent(panelJobIdsRef.current.join(','))}`
          : ''
      const qs = chainPlot
        ? `?chainPlot=1${inputUriRef.current ? `&compare=${encodeURIComponent(inputUriRef.current)}` : ''}${panelsQs}`
        : ''
      res = await fetch(`/api/admin/omni-gridder/status/${jobId}${qs}`)
    } catch {
      log(`Network error polling ${jobId} — retrying`)
      pollTimers.current.set(
        jobId,
        setTimeout(() => pollJob(jobId, method, chainPlot, isPlotJob, lastStatus), POLL_INTERVAL_MS),
      )
      return
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      const message = body.error ?? `Status check failed (${res.status})`
      if (isPlotJob) {
        setGlobalError(message)
      } else {
        updateRow(method, { status: 'failed', errorMessage: message, completedAt: Date.now() })
      }
      return
    }

    const data: JobStatusResponse = await res.json()
    if (data.status !== lastStatus) {
      log(`${data.job_id} (${data.processor_type}) → ${data.status}`)
    }

    if (data.status === 'failed') {
      if (isPlotJob) {
        // The chained Plot job failing does not make the regrid a failure —
        // the primary method's regrid already succeeded (that's what
        // scheduled this plot job in the first place). Keep the row
        // "succeeded" and surface the plot failure as a note underneath so
        // the table stays honest and isRunning can clear (it treats
        // 'plotting' as still-running, and this row would otherwise be
        // stuck there forever).
        setGlobalError(data.error_message ?? 'Plot job failed with no error message')
        updateRow(method, {
          errorMessage: `Plot rendering failed: ${data.error_message ?? 'no error message'} (regrid itself succeeded)`,
          status: 'succeeded',
        })
      } else {
        updateRow(method, {
          status: 'failed',
          errorMessage: data.error_message ?? 'Job failed with no error message',
          completedAt: Date.now(),
          diagnostics: data.diagnostics,
        })
      }
      return
    }

    if (data.status === 'succeeded') {
      if (isPlotJob) {
        if (data.result_uri) setPlotUrl(data.result_uri)
        // Transition the primary row out of 'plotting' now that the chained
        // plot job is done, so isRunning clears and the action buttons
        // re-enable.
        updateRow(method, { status: 'succeeded' })
        return
      }
      const completedAt = Date.now()
      updateRow(method, {
        status: data.nextJobId ? 'plotting' : 'succeeded',
        completedAt,
        diagnostics: data.diagnostics,
      })
      // Record the REGRID job only. A chained plot job is separate work and
      // its wall clock has nothing to say about weight reuse.
      recordRun(method, completedAt, data.diagnostics?.weight_cache_hit ?? null)
      if (data.nextJobId) {
        log(`Chained plot job ${data.nextJobId} (from ${method})`)
        setPlotJobId(data.nextJobId)
        pollTimers.current.set(
          data.nextJobId,
          setTimeout(() => pollJob(data.nextJobId!, method, false, true, null), POLL_INTERVAL_MS),
        )
        return
      }
      // Comparison mode: the multi-panel plot needs EVERY method's output on
      // GCS, so no per-method poll carries chainPlot — instead, the last
      // method to succeed fires one chain request against the primary job,
      // whose panels= param lists the whole batch.
      succeededJobsRef.current.add(jobId)
      if (
        panelJobIdsRef.current.length > 1 &&
        !panelChainFiredRef.current &&
        panelJobIdsRef.current.every((id) => succeededJobsRef.current.has(id))
      ) {
        panelChainFiredRef.current = true
        const primary =
          panelJobIdsRef.current.find((id) => id.endsWith(`-${primaryMethod}`)) ??
          panelJobIdsRef.current[0]
        log('All methods succeeded — chaining multi-panel comparison plot')
        void pollJob(primary, primaryMethod, true, false, 'succeeded')
      }
      return
    }

    if (!isPlotJob) {
      updateRow(method, { status: data.status === 'processing' ? 'processing' : 'queued' })
    }
    pollTimers.current.set(
      jobId,
      setTimeout(() => pollJob(jobId, method, chainPlot, isPlotJob, data.status), POLL_INTERVAL_MS),
    )
  }

  const runJobs = useCallback(
    async (methods: RegridMethod[]) => {
      // The catalog loads async; a click before it lands would submit
      // datasetId: null and let the server silently default. Refuse instead —
      // run history and the weight-reuse panel key off the dataset id.
      if (!selectedDatasetId) {
        setGlobalError('Catalog is still loading — select a dataset first')
        return
      }
      stopAllPolling()
      setGlobalError(null)
      setPlotUrl(null)
      setPlotJobId(null)
      setTimeline([])
      setWorkerTriggered(null)
      setActiveMethods(methods)
      setRows((prev) => {
        const next = { ...prev }
        for (const m of methods) next[m] = { ...idleRow(m), status: 'submitting' }
        return next
      })
      log(
        methods.length > 1
          ? `Submitting method comparison (${methods.map((m) => METHOD_LABELS[m]).join(', ')})`
          : `Submitting ${METHOD_LABELS[methods[0]]} regrid job to og-server`,
      )

      let res: Response
      try {
        res = await fetch('/api/admin/omni-gridder/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ methods, datasetId: selectedDatasetId }),
        })
      } catch {
        setGlobalError('Network error submitting job')
        for (const m of methods) updateRow(m, { status: 'failed', errorMessage: 'Network error' })
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        const message = body.error ?? `Submit failed (${res.status})`
        setGlobalError(message)
        for (const m of methods) updateRow(m, { status: 'failed', errorMessage: message })
        return
      }

      const data = (await res.json()) as {
        jobs: { jobId: string; method: RegridMethod }[]
        inputUri: string
        datasetId: string
        workerTriggered: boolean
      }
      inputUriRef.current = data.inputUri ?? ''
      setWorkerTriggered(data.workerTriggered)
      if (!data.workerTriggered) {
        log('Worker auto-trigger unavailable — jobs stay queued until og-worker is run manually')
      }

      const submittedAt = Date.now()
      // Record history under what the SERVER says ran — the resolved id in the
      // response — not the client-side selection it was derived from.
      runDatasetIdRef.current = data.datasetId ?? selectedDatasetId
      for (const { method } of data.jobs) runStartRef.current.set(method, submittedAt)
      const comparisonMode = data.jobs.length > 1
      // Comparison mode chains ONE multi-panel plot only after ALL methods
      // succeed (see the succeeded branch in pollJob) — so no per-method
      // poll carries chainPlot. Single-method mode keeps chaining its own
      // before/after plot directly.
      panelJobIdsRef.current = comparisonMode ? data.jobs.map((j) => j.jobId) : []
      succeededJobsRef.current = new Set()
      panelChainFiredRef.current = false
      const hasPrimary = data.jobs.some((j) => j.method === primaryMethod)
      for (const { jobId, method } of data.jobs) {
        log(`Submitted ${jobId}`)
        updateRow(method, { jobId, status: 'queued', submittedAt })
        const chainPlot = comparisonMode
          ? false
          : hasPrimary
            ? method === primaryMethod
            : method === data.jobs[0].method
        pollTimers.current.set(
          jobId,
          setTimeout(() => pollJob(jobId, method, chainPlot, false, null), POLL_INTERVAL_MS),
        )
      }
    },
    // pollJob is a plain function (not memoized) recreated every render —
    // intentionally omitted from deps, see its own definition above. The
    // disable is ONLY for pollJob: every state value the closure reads must
    // still be listed, because this suppression previously hid a real bug —
    // `selectedDatasetId` was omitted, so the memoized closure kept its
    // first-render value (null, the catalog loads async) and every submit
    // POSTed `datasetId: null` regardless of the picker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [log, stopAllPolling, updateRow, selectedDatasetId, primaryMethod],
  )

  const runSingle = useCallback(() => runJobs([selectedMethod]), [runJobs, selectedMethod])
  // Compare only what this dataset actually supports. Submitting a refused
  // combination to prove it gets refused would burn a real job to demonstrate
  // something the compatibility matrix already states.
  const runComparison = useCallback(
    () => runJobs(allowedMethods),
    [runJobs, allowedMethods],
  )

  const isRunning = activeMethods.some((m) => {
    const s = rows[m].status
    return s === 'submitting' || s === 'queued' || s === 'processing' || s === 'plotting'
  })

  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Omni-Gridder Showcase</h1>
          <p className="text-gray-400 font-light">
            Submits real regrid jobs to og-server on Google Cloud — no precomputed results.
            Every dataset below runs through the same engine; which interpolation methods are
            valid depends on the source geometry, and the engine refuses the combinations that
            do not apply rather than returning an approximation.
          </p>
        </div>

        {catalogError && (
          <div className="mb-10 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Could not load the dataset catalog: {catalogError}
          </div>
        )}

        {/* Dataset picker. Each card states what that dataset demonstrates that
            the others do not — the point of the catalog is variety of kind, not
            a longer list of files. */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {datasets.map((d) => {
            const active = d.id === selectedDatasetId
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDatasetId(d.id)}
                disabled={isRunning}
                className={`rounded-lg border p-4 text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  active
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/10 bg-[#0a0a0a] hover:border-white/25'
                }`}
              >
                <div className="text-sm font-medium text-white">{d.label}</div>
                <div className="mt-1 text-xs text-gray-400">{d.source}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {d.nativeResolution} → {d.targetSummary}
                  {d.destinationCells !== null && (
                    <> · {d.destinationCells.toLocaleString()} cells</>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500 italic">{d.demonstrates}</div>
              </button>
            )
          })}
        </div>

        {/* Compatibility matrix. Refused combinations carry the engine's own
            reason — "why not" is the interesting part of this product, so it is
            shown rather than hidden behind a disabled control with no
            explanation. */}
        {selectedDataset && (
          <div className="mb-10 rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
            <div className="mb-3 text-xs uppercase tracking-wider text-gray-500">
              Method compatibility · {selectedDataset.label}
            </div>
            <div className="space-y-2">
              {selectedDataset.methods.map((m) => (
                <div key={m.method} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className={m.allowed ? 'text-white' : 'text-gray-500 line-through'}>
                    {METHOD_LABELS[m.method]}
                  </span>
                  {m.allowed ? (
                    <span className="text-xs text-emerald-400">available</span>
                  ) : (
                    <span className="text-xs text-gray-500">{m.reason}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Target CRS: {selectedDataset.targetCrsLabel}
            </div>
          </div>
        )}

        <div className="mb-10 flex flex-wrap items-center gap-4">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as RegridMethod)}
            disabled={isRunning || allowedMethods.length === 0}
            className="h-11 rounded-md border border-white/10 bg-[#0a0a0a] px-4 text-sm text-white disabled:opacity-40"
          >
            {/* Only valid methods are offered. A disabled option for a refused
                combination would be a dead affordance — it reads as "one click
                away" for something the server will reject. */}
            {allowedMethods.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </select>
          <button
            onClick={runSingle}
            disabled={isRunning}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-white/20 px-6 text-sm font-medium text-white hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running…' : 'Run Single Job'}
          </button>
          <button
            onClick={runComparison}
            disabled={isRunning}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running…' : 'Run Method Comparison'}
          </button>
        </div>

        {globalError && (
          <div className="mb-10 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {globalError}
          </div>
        )}

        {/* Acceleration. Deliberately NOT a device toggle: the GPU apply path
            exists and is parity-verified, but this demo does not exercise it,
            and a control implying otherwise would be a dead affordance. The
            live execution path arrives with the routing layer, where the
            engine chooses the device and shows why. */}
        <div className="mb-10 rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-gray-500">Acceleration</span>
            <ProvenanceBadge kind="verified" />
          </div>
          <p className="text-sm text-gray-300">
            The engine separates weight <em>generation</em> (where accuracy lives) from weight{' '}
            <em>application</em> (where speed lives). A GPU backend applies the same frozen
            operator the CPU does, and is gated at ≤1e-12 relative error against the CPU result
            — so a faster backend cannot change the science, by construction.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="pb-2 pr-6 font-normal">Method</th>
                  <th className="pb-2 pr-6 font-normal">Max relative error vs CPU</th>
                  <th className="pb-2 font-normal">Result</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr>
                  <td className="py-1 pr-6">Bilinear</td>
                  <td className="py-1 pr-6 font-mono text-xs">1.2e-15</td>
                  <td className="py-1 text-emerald-400">pass</td>
                </tr>
                <tr>
                  <td className="py-1 pr-6">Nearest neighbour</td>
                  <td className="py-1 pr-6 font-mono text-xs">0.0 (bitwise identical)</td>
                  <td className="py-1 text-emerald-400">pass</td>
                </tr>
                <tr>
                  <td className="py-1 pr-6">Conservative</td>
                  <td className="py-1 pr-6 font-mono text-xs">1.0e-15</td>
                  <td className="py-1 text-emerald-400">pass</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs italic text-gray-500">
            Recorded verification on an NVIDIA L4, not a live run in this demo. The runs below
            execute on CPU; the live GPU execution path ships with the routing layer.
          </p>
        </div>

        {workerTriggered === false && (
          <div className="mb-10 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
            Worker auto-trigger unavailable (see console/server logs for the reason — likely the
            demo service account still needs a Cloud Run IAM grant on og-worker). Jobs are
            submitted and will run once og-worker is next executed.
          </div>
        )}

        {activeMethods.length > 0 && (
          <div className="mb-10 overflow-x-auto">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-3">
              Comparison
            </h2>
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-gray-500 font-mono text-[11px] uppercase tracking-wider">
                  <th className="border-b border-white/10 pb-2 pr-4">Method</th>
                  <th className="border-b border-white/10 pb-2 pr-4">Status</th>
                  <th className="border-b border-white/10 pb-2 pr-4">Wall clock</th>
                  <th className="border-b border-white/10 pb-2 pr-4">Cache hit</th>
                  <th className="border-b border-white/10 pb-2 pr-4">RMSE</th>
                  <th className="border-b border-white/10 pb-2 pr-4">Max abs error</th>
                  <th className="border-b border-white/10 pb-2 pr-4">Conservation residual</th>
                  <th className="border-b border-white/10 pb-2">NaN count</th>
                </tr>
              </thead>
              <tbody>
                {activeMethods.map((m) => {
                  const row = rows[m]
                  return (
                    <tr key={m} className="text-gray-300">
                      <td className="border-b border-white/5 py-2 pr-4 font-medium text-white">
                        {METHOD_LABELS[m]}
                      </td>
                      <td className="border-b border-white/5 py-2 pr-4">
                        <span
                          className={
                            row.status === 'failed'
                              ? 'text-red-400'
                              : row.status === 'succeeded'
                                ? 'text-green-400'
                                : 'text-gray-300'
                          }
                        >
                          {row.status}
                        </span>
                        {row.errorMessage && (
                          <div className="text-xs text-red-400 mt-1">{row.errorMessage}</div>
                        )}
                      </td>
                      <td className="border-b border-white/5 py-2 pr-4 font-mono">
                        {formatWallClock(row)}
                      </td>
                      <td className="border-b border-white/5 py-2 pr-4 font-mono">
                        {row.diagnostics
                          ? row.diagnostics.weight_cache_hit === null
                            ? '—'
                            : row.diagnostics.weight_cache_hit
                              ? 'yes'
                              : 'no'
                          : '—'}
                      </td>
                      <td className="border-b border-white/5 py-2 pr-4 font-mono">
                        {row.diagnostics ? formatNumber(row.diagnostics.rmse) : '—'}
                      </td>
                      <td className="border-b border-white/5 py-2 pr-4 font-mono">
                        {row.diagnostics ? formatNumber(row.diagnostics.max_abs_error) : '—'}
                      </td>
                      <td className="border-b border-white/5 py-2 pr-4 font-mono">
                        {formatConservationResidual(row)}
                      </td>
                      <td className="border-b border-white/5 py-2 font-mono">
                        {row.diagnostics ? formatNumber(row.diagnostics.nan_count) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedDataset && (
          <WeightReusePanel
            dataset={selectedDataset}
            allowedMethods={allowedMethods}
            runHistory={runHistory}
          />
        )}

        <div className="grid gap-10 md:grid-cols-2">
          {timeline.length > 0 && (
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-3">
                Progress
              </h2>
              <ol className="space-y-2 border-l border-white/10 pl-5">
                {timeline.map((entry, i) => (
                  <li key={i} className="text-sm text-gray-300 font-mono">
                    <span className="text-gray-600">
                      {new Date(entry.at).toLocaleTimeString()}
                    </span>{' '}
                    {entry.label}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {plotUrl && (
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-3">
                Result ({METHOD_LABELS[primaryMethod]})
              </h2>
              {/* Signed GCS URL from og-server — not a same-origin/known-host
                  asset, so next/image's optimizer can't be used without adding
                  the bucket host to next.config; a plain <img> is correct here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plotUrl}
                alt="Regridded 500mb height field from this demo run"
                className="w-full max-w-xl rounded-lg border border-white/10"
              />
              <div className="mt-3 flex items-center gap-4">
                {plotJobId && (
                  <a
                    href={`/api/admin/omni-gridder/download?job=${encodeURIComponent(plotJobId)}`}
                    className="inline-block rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
                  >
                    Download PNG
                  </a>
                )}
                <p className="text-xs text-gray-500">
                  Rendered from a short-lived signed URL (15-minute TTL) — reload and run again if
                  it expires.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
