import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetInMemoryRateLimit } from '@/lib/rate-limit'

const { submitJobMock, getJobStatusMock, triggerWorkerRunMock } = vi.hoisted(() => ({
  submitJobMock: vi.fn(),
  getJobStatusMock: vi.fn(),
  triggerWorkerRunMock: vi.fn(),
}))

vi.mock('@/lib/omni-gridder-client', () => ({
  submitJob: submitJobMock,
  getJobStatus: getJobStatusMock,
  triggerWorkerRun: triggerWorkerRunMock,
}))

const TEST_BUCKET = 'test-staging-bucket'

beforeEach(() => {
  vi.resetModules()
  __resetInMemoryRateLimit()
  vi.stubEnv('OG_GCS_STAGING_BUCKET', TEST_BUCKET)
  vi.stubEnv('CONTACT_VERIFICATION_SECRET', 'test-contact-verification-secret-32-bytes')
  vi.stubEnv('OG_PUBLIC_DAILY_JOB_BUDGET', '4')
  submitJobMock.mockReset()
  submitJobMock.mockResolvedValue(undefined)
  getJobStatusMock.mockReset()
  triggerWorkerRunMock.mockReset()
  triggerWorkerRunMock.mockResolvedValue({ triggered: true })
})

afterEach(() => {
  vi.unstubAllEnvs()
  __resetInMemoryRateLimit()
})

describe('GET /api/omni-gridder/datasets (#89)', () => {
  it('returns the client-safe dataset catalog without gs:// URIs', async () => {
    const { GET } = await import('@/app/api/omni-gridder/datasets/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('public, max-age=300')
    const body = (await res.json()) as { datasets: Array<{ id: string; uri?: string }> }
    expect(body.datasets.length).toBeGreaterThanOrEqual(4)
    expect(body.datasets[0].id).toBe('gfs-hgt500')
    expect(body.datasets[0].uri).toBeUndefined()
  })
})

describe('POST /api/omni-gridder/submit — spend control and compatibility (#89)', () => {
  function submitRequest(
    body: Record<string, unknown>,
    ip = '198.51.100.10',
    origin = 'http://localhost',
  ) {
    return new NextRequest('http://localhost/api/omni-gridder/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(body),
    })
  }

  it('rejects cross-origin submissions with 403 before consuming budget', async () => {
    const { POST } = await import('@/app/api/omni-gridder/submit/route')
    const res = await POST(submitRequest({ methods: ['bilinear'] }, '198.51.100.10', 'https://evil.example'))
    expect(res.status).toBe(403)
    expect(submitJobMock).not.toHaveBeenCalled()
  })

  it('rejects incompatible method × dataset combinations with 400 before consuming budget', async () => {
    const { POST } = await import('@/app/api/omni-gridder/submit/route')
    const res = await POST(
      submitRequest({ datasetId: 'goes18-abi-c13', methods: ['bilinear'] }, '198.51.100.11'),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/swath geometry/i)
    expect(submitJobMock).not.toHaveBeenCalled()
  })

  it('enforces the per-IP rate limit (2 submissions / 10 min)', async () => {
    vi.stubEnv('OG_PUBLIC_DAILY_JOB_BUDGET', '50')
    const { POST } = await import('@/app/api/omni-gridder/submit/route')

    const first = await POST(submitRequest({ methods: ['bilinear'] }, '198.51.100.12'))
    expect(first.status).toBe(200)

    const second = await POST(submitRequest({ methods: ['nearest'] }, '198.51.100.12'))
    expect(second.status).toBe(200)

    const third = await POST(submitRequest({ methods: ['conservative'] }, '198.51.100.12'))
    expect(third.status).toBe(429)
    const body = await third.json()
    expect(body.budgetExhausted).toBeUndefined()
  })

  it('enforces the global daily job budget across different visitor IPs and returns budgetExhausted: true', async () => {
    vi.stubEnv('OG_PUBLIC_DAILY_JOB_BUDGET', '3')
    const { POST } = await import('@/app/api/omni-gridder/submit/route')

    // Visitor 1 runs a 2-method batch (consumes 2 of 3 daily jobs)
    const v1 = await POST(
      submitRequest({ methods: ['bilinear', 'nearest'] }, '198.51.100.20'),
    )
    expect(v1.status).toBe(200)

    // Visitor 2 runs a 2-method batch (1st job consumes 3rd slot, 2nd job trips daily cap)
    const v2 = await POST(
      submitRequest({ methods: ['bilinear', 'conservative'] }, '198.51.100.21'),
    )
    expect(v2.status).toBe(429)
    const body = await v2.json()
    expect(body.budgetExhausted).toBe(true)
    expect(body.error).toMatch(/daily|compute budget/i)
  })
})

describe('GET /api/omni-gridder/status — batched polling and plot chaining (#89)', () => {
  it('polls multiple jobs in one request and chains one multi-panel plot when all succeed', async () => {
    const jobA = 'demo-batch1-nearest'
    const jobB = 'demo-batch1-bilinear'
    getJobStatusMock.mockImplementation(async (jobId: string) => ({
      job_id: jobId,
      processor_type: 'regrid',
      status: 'succeeded',
      submitted_at: Date.now(),
      result_uri: `https://storage.googleapis.com/${TEST_BUCKET}/demo/regrid/${jobId}/output.nc`,
      error_message: null,
      diagnostics: {
        interpolation_method: jobId.endsWith('nearest') ? 'nearest' : 'bilinear',
        weight_cache_hit: false,
        rmse: 0.01,
        max_abs_error: 0.05,
        conservation_residual: null,
        nan_count: 0,
        artifact_flags: [],
        notes: [],
      },
    }))

    const { GET } = await import('@/app/api/omni-gridder/status/route')
    const req = new NextRequest(
      `http://localhost/api/omni-gridder/status?jobs=${jobA},${jobB}&chainPlot=1&primary=${jobB}`,
    )
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = (await res.json()) as {
      jobs: Array<{ job_id: string; nextJobId?: string }>
    }
    expect(body.jobs).toHaveLength(2)
    const primaryStatus = body.jobs.find((j) => j.job_id === jobB)
    expect(primaryStatus?.nextJobId).toBe(`${jobB}-plot`)
    expect(submitJobMock).toHaveBeenCalledTimes(1)
  })

  it('rejects non-demo job IDs with 400', async () => {
    const { GET } = await import('@/app/api/omni-gridder/status/route')
    const req = new NextRequest('http://localhost/api/omni-gridder/status?jobs=arbitrary-job-id')
    const res = await GET(req)
    expect(res.status).toBe(400)
    expect(getJobStatusMock).not.toHaveBeenCalled()
  })
})
