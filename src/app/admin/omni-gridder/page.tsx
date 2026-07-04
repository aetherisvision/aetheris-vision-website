'use client'

import { useCallback, useRef, useState } from 'react'

type JobPhase = 'idle' | 'submitting' | 'regridding' | 'plotting' | 'done' | 'error'

interface JobStatusResponse {
  job_id: string
  processor_type: string
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  submitted_at: number
  result_uri: string | null
  error_message: string | null
  nextJobId?: string
}

interface TimelineEntry {
  at: number
  label: string
}

const POLL_INTERVAL_MS = 3000

export default function OmniGridderDemoPage() {
  const [phase, setPhase] = useState<JobPhase>('idle')
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [plotUrl, setPlotUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const log = useCallback((label: string) => {
    setTimeline((prev) => [...prev, { at: Date.now(), label }])
  }, [])

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current)
    pollTimer.current = null
  }, [])

  // Plain function, not useCallback: it recurses on itself via setTimeout,
  // which the React Compiler's lint rules flag as unsafe inside a hook
  // (can't verify the self-reference is stable). It's only ever invoked from
  // event handlers below, never from an effect's dependency array, so it
  // doesn't need useCallback's referential-stability guarantee anyway.
  async function poll(jobId: string, lastStatus: string | null): Promise<void> {
    let res: Response
    try {
      res = await fetch(`/api/admin/omni-gridder/status/${jobId}`)
    } catch {
      log(`Network error polling ${jobId} — retrying`)
      pollTimer.current = setTimeout(() => poll(jobId, lastStatus), POLL_INTERVAL_MS)
      return
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      setError(body.error ?? `Status check failed (${res.status})`)
      setPhase('error')
      return
    }

    const data: JobStatusResponse = await res.json()

    if (data.status !== lastStatus) {
      log(`${data.job_id} (${data.processor_type}) → ${data.status}`)
    }

    if (data.status === 'failed') {
      setError(data.error_message ?? 'Job failed with no error message')
      setPhase('error')
      return
    }

    if (data.status === 'succeeded') {
      if (data.nextJobId) {
        // Regrid stage done — status route already chained the Plot job.
        setPhase('plotting')
        log(`Chained plot job ${data.nextJobId}`)
        pollTimer.current = setTimeout(() => poll(data.nextJobId!, null), POLL_INTERVAL_MS)
        return
      }
      // Plot stage done — result_uri is a signed, directly-usable HTTPS URL.
      if (data.processor_type === 'plot' && data.result_uri) {
        setPlotUrl(data.result_uri)
        setPhase('done')
        return
      }
    }

    setPhase(data.processor_type === 'plot' ? 'plotting' : 'regridding')
    pollTimer.current = setTimeout(() => poll(jobId, data.status), POLL_INTERVAL_MS)
  }

  const runDemo = useCallback(async () => {
    stopPolling()
    setError(null)
    setPlotUrl(null)
    setTimeline([])
    setPhase('submitting')
    log('Submitting regrid job to og-server')

    let res: Response
    try {
      res = await fetch('/api/admin/omni-gridder/submit', { method: 'POST' })
    } catch {
      setError('Network error submitting job')
      setPhase('error')
      return
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      setError(body.error ?? `Submit failed (${res.status})`)
      setPhase('error')
      return
    }

    const { jobId } = (await res.json()) as { jobId: string }
    log(`Submitted ${jobId}`)
    setPhase('regridding')
    poll(jobId, null)
  // poll is a plain function (not memoized) recreated every render —
  // intentionally omitted from deps, see its own definition above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, stopPolling])

  const isRunning = phase === 'submitting' || phase === 'regridding' || phase === 'plotting'

  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Omni-Gridder Live Demo</h1>
          <p className="text-gray-400 font-light">
            Submits a real job to og-server on Google Cloud (esmai-dev), watches it move through
            the pipeline, and renders the resulting plot when it lands.
          </p>
        </div>

        <button
          onClick={runDemo}
          disabled={isRunning}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed mb-10"
        >
          {isRunning ? 'Running…' : 'Run Live Demo Job'}
        </button>

        {error && (
          <div className="mb-10 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {timeline.length > 0 && (
          <div className="mb-10">
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
              Result
            </h2>
            {/* Signed GCS URL from og-server — not a same-origin/known-host
                asset, so next/image's optimizer can't be used without adding
                the bucket host to next.config; a plain <img> is correct here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plotUrl}
              alt="Regridded temperature field from this demo run"
              className="w-full max-w-xl rounded-lg border border-white/10"
            />
            <p className="mt-3 text-xs text-gray-500">
              This link is a short-lived signed URL (15-minute TTL) — reload the page and run
              again if it expires.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
