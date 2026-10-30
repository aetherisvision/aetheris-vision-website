'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TurnstileWidget from '@/components/TurnstileWidget'
import type { OmniGridderJobStatus } from '@/lib/omni-gridder-client'
import type { RegridMethod } from '@/lib/omni-gridder-proxy'
import { METHOD_LABELS, type DatasetView } from '@/lib/showcase-catalog-view'
import { TURNSTILE_ACTIONS } from '@/lib/turnstile'

type Provenance = 'live' | 'verified'
type RowStatus =
  | 'idle'
  | 'submitting'
  | 'queued'
  | 'running'
  | 'plotting'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

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

interface JobStatusResponse extends OmniGridderJobStatus {
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

interface RunObservation {
  wallClockMs: number
  cacheHit: boolean | null
}

type RunHistory = Record<string, RunObservation[]>

export interface OmniGridderShowcaseProps {
  mode: 'admin' | 'public'
}

function historyKey(datasetId: string, method: RegridMethod): string {
  return `${datasetId}::${method}`
}

export function coldWarmPair(
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

const ADMIN_POLL_INTERVAL_MS = 3_000
const MAX_POLL_ATTEMPTS = 120
/** Surface a cold-start / scheduler pickup explanation when a job stays queued >= 90s (#89 item 5). */
export const QUEUED_WARNING_MS = 90_000

/**
 * Adaptive polling backoff for the public showcase (`#89` item 4):
 * 5s for the first 6 polls (0–30s), 10s for polls 7–15 (30–120s), and 15s thereafter.
 */
export function publicPollDelayMs(attempt: number): number {
  if (attempt <= 6) return 5_000
  if (attempt <= 15) return 10_000
  return 15_000
}

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
    .filter(
      (p): p is { method: RegridMethod; pair: NonNullable<ReturnType<typeof coldWarmPair>> } =>
        p.pair !== null,
    )

  return (
    <div className="mb-10">
      <h3 className="font-mono text-[11px] uppercase tracking-wider text-gray-400 mb-3">
        Weight reuse · {dataset.label}
      </h3>
      {pairs.length === 0 ? (
        <p className="text-sm text-gray-400">
          Run the same method twice on this dataset to measure it: the first run generates the
          remap operator (the expensive, accuracy-gated step), the second finds it in the cache
          and only applies it. Both runs are timed in this session — no recorded benchmark stands
          in for the pair.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-gray-400 font-mono text-[11px] uppercase tracking-wider">
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
          <p className="mt-2 text-xs text-gray-400">
            End-to-end wall clock, including queue and polling latency — the same overhead in both
            columns, so the difference is the generation step. Cold/warm classification comes from
            the engine&apos;s own <code>weight_cache_hit</code> diagnostic, not from run order.
          </p>
        </div>
      )}
    </div>
  )
}

export default function OmniGridderShowcase({ mode }: OmniGridderShowcaseProps) {
  const apiBase = mode === 'admin' ? '/api/admin/omni-gridder' : '/api/omni-gridder'
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
  const [budgetExhausted, setBudgetExhausted] = useState(false)
  const [queuedLongNotice, setQueuedLongNotice] = useState(false)
  const [workerTriggered, setWorkerTriggered] = useState<boolean | null>(null)
  const [runHistory, setRunHistory] = useState<RunHistory>({})
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)
  const requiresTurnstile =
    mode === 'public' && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

  const runDatasetIdRef = useRef<string | null>(null)
  const runStartRef = useRef<Map<RegridMethod, number>>(new Map())
  const pollTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const inputUriRef = useRef<string>('')
  const panelJobIdsRef = useRef<string[]>([])
  const succeededJobsRef = useRef<Set<string>>(new Set())
  const panelChainFiredRef = useRef(false)
  const lastStatusesRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`${apiBase}/datasets`)
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
          setCatalogError(
            err instanceof Error ? err.message : 'Could not load the dataset catalog',
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiBase])

  const selectedDataset = useMemo(
    () => datasets.find((d) => d.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  )
  const allowedMethods = useMemo(
    () => selectedDataset?.methods.filter((m) => m.allowed).map((m) => m.method) ?? [],
    [selectedDataset],
  )
  const primaryMethod: RegridMethod = selectedDataset?.primaryMethod ?? 'bilinear'

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

  useEffect(() => () => stopAllPolling(), [stopAllPolling])

  const updateRow = useCallback((method: RegridMethod, patch: Partial<MethodRow>) => {
    setRows((prev) => ({ ...prev, [method]: { ...prev[method], ...patch } }))
  }, [])

  const recordRun = useCallback(
    (method: RegridMethod, completedAt: number, cacheHit: boolean | null) => {
      const datasetId = runDatasetIdRef.current
      const submittedAt = runStartRef.current.get(method)
      if (!datasetId || submittedAt === undefined) return
      runStartRef.current.delete(method)
      const key = historyKey(datasetId, method)
      const observation: RunObservation = { wallClockMs: completedAt - submittedAt, cacheHit }
      setRunHistory((h) => ({ ...h, [key]: [...(h[key] ?? []), observation] }))
    },
    [],
  )

  function failPollTimeout(method: RegridMethod, isPlotJob: boolean): void {
    const message = `Job polling timed out after ${MAX_POLL_ATTEMPTS} attempts`
    log(message)
    if (isPlotJob) {
      setGlobalError(message)
      updateRow(method, {
        errorMessage: 'Plot rendering timed out (regrid itself succeeded)',
        status: 'succeeded',
      })
    } else {
      updateRow(method, { status: 'failed', errorMessage: message, completedAt: Date.now() })
    }
  }

  async function pollPublicBatch(
    jobMethodPairs: { jobId: string; method: RegridMethod }[],
    primary: { jobId: string; method: RegridMethod },
    attempt = 1,
  ): Promise<void> {
    const activeIds = jobMethodPairs.map((j) => j.jobId)
    const delay = publicPollDelayMs(attempt)
    const earliestSubmit = Math.min(
      ...jobMethodPairs.map(({ method }) => runStartRef.current.get(method) ?? Date.now()),
    )
    if (Date.now() - earliestSubmit >= QUEUED_WARNING_MS) {
      setQueuedLongNotice(true)
    }

    let res: Response
    try {
      const qs = new URLSearchParams({
        jobs: activeIds.join(','),
        chainPlot: '1',
        primary: primary.jobId,
      })
      if (runDatasetIdRef.current) qs.set('datasetId', runDatasetIdRef.current)
      res = await fetch(`${apiBase}/status?${qs.toString()}`)
    } catch {
      if (attempt >= MAX_POLL_ATTEMPTS) {
        for (const { method } of jobMethodPairs) failPollTimeout(method, false)
        return
      }
      log('Network error polling batch — retrying')
      pollTimers.current.set(
        'batch',
        setTimeout(() => pollPublicBatch(jobMethodPairs, primary, attempt + 1), delay),
      )
      return
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      const message = body.error ?? `Status check failed (${res.status})`
      setGlobalError(message)
      for (const { method } of jobMethodPairs) {
        updateRow(method, { status: 'failed', errorMessage: message, completedAt: Date.now() })
      }
      return
    }

    const payload = (await res.json()) as { jobs: JobStatusResponse[] }
    let allTerminal = true
    let chainedPlotId: string | null = null

    for (const data of payload.jobs) {
      const pair = jobMethodPairs.find((j) => j.jobId === data.job_id)
      if (!pair) continue
      const prevStatus = lastStatusesRef.current.get(data.job_id)
      if (data.status !== prevStatus) {
        lastStatusesRef.current.set(data.job_id, data.status)
        log(`${data.job_id} (${data.processor_type}) → ${data.status}`)
      }

      if (data.status === 'failed' || data.status === 'cancelled') {
        updateRow(pair.method, {
          status: data.status,
          errorMessage:
            data.error_message ??
            (data.status === 'cancelled' ? 'Job was cancelled' : 'Job failed'),
          completedAt: Date.now(),
          diagnostics: data.diagnostics,
        })
      } else if (data.status === 'succeeded') {
        const completedAt = Date.now()
        recordRun(pair.method, completedAt, data.diagnostics?.weight_cache_hit ?? null)
        updateRow(pair.method, {
          status: data.nextJobId ? 'plotting' : 'succeeded',
          completedAt,
          diagnostics: data.diagnostics,
        })
        if (data.nextJobId) chainedPlotId = data.nextJobId
      } else {
        allTerminal = false
        updateRow(pair.method, { status: data.status === 'running' ? 'running' : 'queued' })
      }
    }

    if (chainedPlotId) {
      setQueuedLongNotice(false)
      log(`Chained plot job ${chainedPlotId} (from ${primary.method})`)
      setPlotJobId(chainedPlotId)
      pollTimers.current.set(
        chainedPlotId,
        setTimeout(() => pollSinglePlotPublic(chainedPlotId!, primary.method, 1), publicPollDelayMs(1)),
      )
      return
    }

    if (!allTerminal) {
      if (attempt >= MAX_POLL_ATTEMPTS) {
        for (const { method } of jobMethodPairs) failPollTimeout(method, false)
        return
      }
      pollTimers.current.set(
        'batch',
        setTimeout(() => pollPublicBatch(jobMethodPairs, primary, attempt + 1), delay),
      )
    } else {
      setQueuedLongNotice(false)
    }
  }

  async function pollSinglePlotPublic(
    plotId: string,
    primaryMethodName: RegridMethod,
    attempt = 1,
  ): Promise<void> {
    const delay = publicPollDelayMs(attempt)
    let res: Response
    try {
      res = await fetch(`${apiBase}/status?jobs=${encodeURIComponent(plotId)}`)
    } catch {
      if (attempt >= MAX_POLL_ATTEMPTS) {
        failPollTimeout(primaryMethodName, true)
        return
      }
      pollTimers.current.set(
        plotId,
        setTimeout(() => pollSinglePlotPublic(plotId, primaryMethodName, attempt + 1), delay),
      )
      return
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      const message = body.error ?? `Plot status check failed (${res.status})`
      setGlobalError(message)
      updateRow(primaryMethodName, { status: 'succeeded' })
      return
    }

    const payload = (await res.json()) as { jobs: JobStatusResponse[] }
    const data = payload.jobs?.[0]
    if (!data) return

    const prevStatus = lastStatusesRef.current.get(data.job_id)
    if (data.status !== prevStatus) {
      lastStatusesRef.current.set(data.job_id, data.status)
      log(`${data.job_id} (${data.processor_type}) → ${data.status}`)
    }

    if (data.status === 'succeeded') {
      if (data.result_uri) setPlotUrl(data.result_uri)
      updateRow(primaryMethodName, { status: 'succeeded' })
      return
    }
    if (data.status === 'failed' || data.status === 'cancelled') {
      const msg = data.error_message ?? `Plot job ${data.status}`
      setGlobalError(msg)
      updateRow(primaryMethodName, {
        errorMessage: `Plot rendering ${data.status}: ${msg} (regrid itself succeeded)`,
        status: 'succeeded',
      })
      return
    }

    if (attempt >= MAX_POLL_ATTEMPTS) {
      failPollTimeout(primaryMethodName, true)
      return
    }
    pollTimers.current.set(
      plotId,
      setTimeout(() => pollSinglePlotPublic(plotId, primaryMethodName, attempt + 1), delay),
    )
  }

  async function pollAdminJob(
    jobId: string,
    method: RegridMethod,
    chainPlot: boolean,
    isPlotJob: boolean,
    lastStatus: OmniGridderJobStatus['status'] | null,
    attempt = 1,
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
      res = await fetch(`${apiBase}/status/${jobId}${qs}`)
    } catch {
      if (attempt >= MAX_POLL_ATTEMPTS) {
        failPollTimeout(method, isPlotJob)
        return
      }
      log(`Network error polling ${jobId} — retrying`)
      pollTimers.current.set(
        jobId,
        setTimeout(
          () => pollAdminJob(jobId, method, chainPlot, isPlotJob, lastStatus, attempt + 1),
          ADMIN_POLL_INTERVAL_MS,
        ),
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

    if (data.status === 'cancelled') {
      const message = data.error_message ?? 'Job was cancelled'
      if (isPlotJob) {
        setGlobalError(message)
        updateRow(method, {
          errorMessage: 'Plot job was cancelled (regrid itself succeeded)',
          status: 'succeeded',
        })
      } else {
        updateRow(method, {
          status: 'cancelled',
          errorMessage: message,
          completedAt: Date.now(),
          diagnostics: data.diagnostics,
        })
      }
      return
    }

    if (data.status === 'succeeded') {
      if (isPlotJob) {
        if (data.result_uri) setPlotUrl(data.result_uri)
        updateRow(method, { status: 'succeeded' })
        return
      }
      const completedAt = Date.now()
      updateRow(method, {
        status: data.nextJobId ? 'plotting' : 'succeeded',
        completedAt,
        diagnostics: data.diagnostics,
      })
      recordRun(method, completedAt, data.diagnostics?.weight_cache_hit ?? null)
      if (data.nextJobId) {
        log(`Chained plot job ${data.nextJobId} (from ${method})`)
        setPlotJobId(data.nextJobId)
        pollTimers.current.set(
          data.nextJobId,
          setTimeout(
            () => pollAdminJob(data.nextJobId!, method, false, true, null),
            ADMIN_POLL_INTERVAL_MS,
          ),
        )
        return
      }
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
        void pollAdminJob(primary, primaryMethod, true, false, 'succeeded')
      }
      return
    }

    if (attempt >= MAX_POLL_ATTEMPTS) {
      failPollTimeout(method, isPlotJob)
      return
    }
    if (!isPlotJob) {
      updateRow(method, { status: data.status === 'running' ? 'running' : 'queued' })
    }
    pollTimers.current.set(
      jobId,
      setTimeout(
        () => pollAdminJob(jobId, method, chainPlot, isPlotJob, data.status, attempt + 1),
        ADMIN_POLL_INTERVAL_MS,
      ),
    )
  }

  const runJobs = useCallback(
    async (methods: RegridMethod[]) => {
      if (!selectedDatasetId) {
        setGlobalError('Catalog is still loading — select a dataset first')
        return
      }
      if (requiresTurnstile && !turnstileToken) {
        setGlobalError('Please complete the human verification before starting a live run.')
        return
      }
      stopAllPolling()
      setGlobalError(null)
      setBudgetExhausted(false)
      setQueuedLongNotice(false)
      setPlotUrl(null)
      setPlotJobId(null)
      setTimeline([])
      setWorkerTriggered(null)
      setActiveMethods(methods)
      lastStatusesRef.current.clear()
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

      const submittedToken = turnstileToken
      if (requiresTurnstile) {
        setTurnstileToken(null)
        setTurnstileResetKey((key) => key + 1)
      }

      let res: Response
      try {
        res = await fetch(`${apiBase}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            methods,
            datasetId: selectedDatasetId,
            ...(mode === 'public' && submittedToken ? { turnstileToken: submittedToken } : {}),
          }),
        })
      } catch {
        setGlobalError('Network error submitting job')
        for (const m of methods) updateRow(m, { status: 'failed', errorMessage: 'Network error' })
        return
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as {
          error?: string
          budgetExhausted?: boolean
        }
        const message = body.error ?? `Submit failed (${res.status})`
        if (body.budgetExhausted) {
          setBudgetExhausted(true)
        }
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
        log('Worker auto-trigger unavailable — jobs stay queued until og-worker is next executed')
      }

      const submittedAt = Date.now()
      runDatasetIdRef.current = data.datasetId ?? selectedDatasetId
      for (const { method } of data.jobs) runStartRef.current.set(method, submittedAt)

      if (mode === 'public') {
        for (const { jobId, method } of data.jobs) {
          log(`Submitted ${jobId}`)
          updateRow(method, { jobId, status: 'queued', submittedAt })
        }
        const primaryPair =
          data.jobs.find((j) => j.method === primaryMethod) ?? data.jobs[0]
        pollTimers.current.set(
          'batch',
          setTimeout(
            () => pollPublicBatch(data.jobs, primaryPair, 1),
            publicPollDelayMs(1),
          ),
        )
        return
      }

      const comparisonMode = data.jobs.length > 1
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
          setTimeout(
            () => pollAdminJob(jobId, method, chainPlot, false, null),
            ADMIN_POLL_INTERVAL_MS,
          ),
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      apiBase,
      log,
      mode,
      primaryMethod,
      requiresTurnstile,
      selectedDatasetId,
      stopAllPolling,
      turnstileToken,
      updateRow,
    ],
  )

  const runSingle = useCallback(() => runJobs([selectedMethod]), [runJobs, selectedMethod])
  const runComparison = useCallback(
    () => runJobs(allowedMethods),
    [runJobs, allowedMethods],
  )

  const isRunning = activeMethods.some((m) => {
    const s = rows[m].status
    return s === 'submitting' || s === 'queued' || s === 'running' || s === 'plotting'
  })

  return (
    <div className="rounded-xl border border-white/10 bg-[#050505] text-white p-6 sm:p-10">
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {mode === 'admin' ? 'Omni-Gridder Showcase' : 'Live Cloud Run Showcase'}
          </h2>
          <ProvenanceBadge kind="live" />
        </div>
        <p className="text-gray-400 font-light text-sm sm:text-base">
          Submits real regrid jobs to og-server on Google Cloud — no precomputed results.
          Every dataset below runs through the same engine; which interpolation methods are
          valid depends on the source geometry, and the engine refuses the combinations that
          do not apply rather than returning an approximation.
        </p>
      </div>

      {catalogError && (
        <div role="alert" className="mb-8 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Could not load the dataset catalog: {catalogError}
        </div>
      )}

      {/* Dataset picker */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {datasets.map((d) => {
          const active = d.id === selectedDatasetId
          return (
            <button
              key={d.id}
              type="button"
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
              <div className="mt-2 text-xs text-gray-400">
                {d.nativeResolution} → {d.targetSummary}
                {d.destinationCells !== null && (
                  <> · {d.destinationCells.toLocaleString()} cells</>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400 italic">{d.demonstrates}</div>
            </button>
          )
        })}
      </div>

      {/* Compatibility matrix */}
      {selectedDataset && (
        <div className="mb-8 rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
          <div className="mb-3 text-xs uppercase tracking-wider text-gray-400">
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
                  <span className="text-xs text-gray-400">{m.reason}</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Target CRS: {selectedDataset.targetCrsLabel}
          </div>
        </div>
      )}

      {mode === 'public' && (
        <div className="mb-6">
          <TurnstileWidget
            action={TURNSTILE_ACTIONS.omniGridderShowcase}
            onTokenChange={setTurnstileToken}
            resetKey={turnstileResetKey}
          />
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <select
          aria-label="Regridding method"
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value as RegridMethod)}
          disabled={isRunning || allowedMethods.length === 0}
          className="h-11 rounded-md border border-white/10 bg-[#0a0a0a] px-4 text-sm text-white disabled:opacity-40"
        >
          {allowedMethods.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={runSingle}
          disabled={isRunning || (requiresTurnstile && !turnstileToken)}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-[#5BA8D9] px-6 text-sm font-medium text-[#9fd0ef] hover:bg-[#5BA8D9]/15 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running…' : 'Run Single Job'}
        </button>
        <button
          type="button"
          onClick={runComparison}
          disabled={isRunning || (requiresTurnstile && !turnstileToken)}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#5BA8D9] px-6 text-sm font-medium text-[#0a1628] hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running…' : 'Run Method Comparison'}
        </button>
      </div>

      {budgetExhausted ? (
        <div
          role="status"
          className="mb-8 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100"
        >
          <p className="font-medium">Daily live-demo compute budget reached</p>
          <p className="mt-1 text-amber-200/90">
            {globalError}{' '}
            <a href="/book" className="underline font-semibold hover:text-white">
              Schedule a free consultation
            </a>
            .
          </p>
        </div>
      ) : (
        globalError && (
          <div
            role="alert"
            className="mb-8 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {globalError}
          </div>
        )
      )}

      {queuedLongNotice && isRunning && (
        <div
          role="status"
          className="mb-8 rounded-lg border border-sky-400/30 bg-sky-500/10 p-4 text-sm text-sky-200"
        >
          Still queued on the Cloud Run worker — cold start or scheduled worker pickup is in
          progress (live multi-method runs with plot rendering typically take 1–2.5 minutes
          end-to-end).
        </div>
      )}

      {/* Recorded GPU parity table */}
      <div className="mb-8 rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-gray-400">Acceleration</span>
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
            <thead className="text-xs uppercase tracking-wider text-gray-400">
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
        <p className="mt-3 text-xs italic text-gray-400">
          Recorded verification on an NVIDIA L4, not a live run in this demo. The runs below
          execute on CPU; the live GPU execution path ships with the routing layer.
        </p>
      </div>

      {workerTriggered === false && (
        <div className="mb-8 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Worker auto-trigger unavailable — jobs are submitted and will run on the next scheduled
          Cloud Run worker execution.
        </div>
      )}

      {activeMethods.length > 0 && (
        <div className="mb-8 overflow-x-auto">
          <h3 className="font-mono text-[11px] uppercase tracking-wider text-gray-400 mb-3">
            Comparison
          </h3>
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-gray-400 font-mono text-[11px] uppercase tracking-wider">
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
                          row.status === 'failed' || row.status === 'cancelled'
                            ? 'text-red-400'
                            : row.status === 'succeeded'
                              ? 'text-green-400'
                              : 'text-gray-300'
                        }
                      >
                        {row.status === 'running'
                          ? 'Running'
                          : row.status === 'cancelled'
                            ? 'Cancelled'
                            : row.status}
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
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-gray-400 mb-3">
              Progress
            </h3>
            <ol className="space-y-2 border-l border-white/10 pl-5">
              {timeline.map((entry, i) => (
                <li key={i} className="text-sm text-gray-300 font-mono">
                  <span className="text-gray-400">
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
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-gray-400 mb-3">
              Result ({METHOD_LABELS[primaryMethod]})
            </h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plotUrl}
              alt="Regridded field from this demo run"
              className="w-full max-w-xl rounded-lg border border-white/10"
            />
            <div className="mt-3 flex items-center gap-4">
              {plotJobId && (
                <a
                  href={`${apiBase}/download?job=${encodeURIComponent(plotJobId)}`}
                  className="inline-block rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
                >
                  Download PNG
                </a>
              )}
              <p className="text-xs text-gray-400">
                Rendered from a short-lived signed URL (15-minute TTL) — reload and run again if
                it expires.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
