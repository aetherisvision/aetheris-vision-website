'use client'

import { useCallback, useRef, useState } from 'react'

type RegridMethod = 'nearest' | 'bilinear' | 'conservative'
const METHODS: RegridMethod[] = ['nearest', 'bilinear', 'conservative']
const METHOD_LABELS: Record<RegridMethod, string> = {
  nearest: 'Nearest neighbor',
  bilinear: 'Bilinear',
  conservative: 'Conservative',
}

// Bilinear is the "primary" method whose regrid result gets plotted — it's
// the one method present in both single mode and every comparison run, so
// the map panel never has to pick between three plots.
const PRIMARY_METHOD: RegridMethod = 'bilinear'

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

export default function OmniGridderDemoPage() {
  const [selectedMethod, setSelectedMethod] = useState<RegridMethod>('bilinear')
  const [rows, setRows] = useState<Record<RegridMethod, MethodRow>>({
    nearest: idleRow('nearest'),
    bilinear: idleRow('bilinear'),
    conservative: idleRow('conservative'),
  })
  const [activeMethods, setActiveMethods] = useState<RegridMethod[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [plotUrl, setPlotUrl] = useState<string | null>(null)
  const [plotJobId, setPlotJobId] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [workerTriggered, setWorkerTriggered] = useState<boolean | null>(null)
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
      updateRow(method, {
        status: data.nextJobId ? 'plotting' : 'succeeded',
        completedAt: Date.now(),
        diagnostics: data.diagnostics,
      })
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
          panelJobIdsRef.current.find((id) => id.endsWith(`-${PRIMARY_METHOD}`)) ??
          panelJobIdsRef.current[0]
        log('All methods succeeded — chaining multi-panel comparison plot')
        void pollJob(primary, PRIMARY_METHOD, true, false, 'succeeded')
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
          body: JSON.stringify({ methods }),
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
        workerTriggered: boolean
      }
      inputUriRef.current = data.inputUri ?? ''
      setWorkerTriggered(data.workerTriggered)
      if (!data.workerTriggered) {
        log('Worker auto-trigger unavailable — jobs stay queued until og-worker is run manually')
      }

      const submittedAt = Date.now()
      const comparisonMode = data.jobs.length > 1
      // Comparison mode chains ONE multi-panel plot only after ALL methods
      // succeed (see the succeeded branch in pollJob) — so no per-method
      // poll carries chainPlot. Single-method mode keeps chaining its own
      // before/after plot directly.
      panelJobIdsRef.current = comparisonMode ? data.jobs.map((j) => j.jobId) : []
      succeededJobsRef.current = new Set()
      panelChainFiredRef.current = false
      const hasPrimary = data.jobs.some((j) => j.method === PRIMARY_METHOD)
      for (const { jobId, method } of data.jobs) {
        log(`Submitted ${jobId}`)
        updateRow(method, { jobId, status: 'queued', submittedAt })
        const chainPlot = comparisonMode
          ? false
          : hasPrimary
            ? method === PRIMARY_METHOD
            : method === data.jobs[0].method
        pollTimers.current.set(
          jobId,
          setTimeout(() => pollJob(jobId, method, chainPlot, false, null), POLL_INTERVAL_MS),
        )
      }
    },
    // pollJob is a plain function (not memoized) recreated every render —
    // intentionally omitted from deps, see its own definition above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [log, stopAllPolling, updateRow],
  )

  const runSingle = useCallback(() => runJobs([selectedMethod]), [runJobs, selectedMethod])
  const runComparison = useCallback(() => runJobs(METHODS), [runJobs])

  const isRunning = activeMethods.some((m) => {
    const s = rows[m].status
    return s === 'submitting' || s === 'queued' || s === 'processing' || s === 'plotting'
  })

  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Omni-Gridder Method Comparison</h1>
          <p className="text-gray-400 font-light">
            Submits real regrid jobs to og-server on Google Cloud (esmai-dev) against a live
            0.25° GFS 500mb height field, regridded to a 0.5° CONUS grid, and compares
            nearest-neighbor, bilinear, and conservative interpolation side by side.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap items-center gap-4">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as RegridMethod)}
            disabled={isRunning}
            className="h-11 rounded-md border border-white/10 bg-[#0a0a0a] px-4 text-sm text-white disabled:opacity-40"
          >
            {METHODS.map((m) => (
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
                Result ({METHOD_LABELS[PRIMARY_METHOD]})
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
