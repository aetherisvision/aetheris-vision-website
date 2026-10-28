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
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
  vi.stubEnv('TURNSTILE_SECRET_KEY', '')
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

describe('POST /api/omni-gridder/submit — spend control, IP spoofing protection, and public response shape (#89)', () => {
  function submitRequest(
    body: Record<string, unknown>,
    ip = '198.51.100.10',
    origin = 'http://localhost',
    extraHeaders: Record<string, string> = {},
  ) {
    return new NextRequest('http://localhost/api/omni-gridder/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        'x-forwarded-for': ip,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    })
  }

  it('rejects cross-origin submissions with 403 before consuming budget', async () => {
    const { POST } = await import('@/app/api/omni-gridder/submit/route')
    const res = await POST(
      submitRequest({ methods: ['bilinear'] }, '198.51.100.10', 'https://evil.example'),
    )
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

  it('omits gs:// inputUri from public submit responses and sanitizes 500 upstream errors', async () => {
    const { POST } = await import('@/app/api/omni-gridder/submit/route')
    const okRes = await POST(submitRequest({ methods: ['bilinear'] }, '198.51.100.15'))
    expect(okRes.status).toBe(200)
    const okBody = (await okRes.json()) as Record<string, unknown>
    expect(okBody).not.toHaveProperty('inputUri')
    expect(JSON.stringify(okBody)).not.toContain('gs://')

    submitJobMock.mockRejectedValueOnce(new Error('internal WIF token detail'))
    const errRes = await POST(submitRequest({ methods: ['bilinear'] }, '198.51.100.16'))
    expect(errRes.status).toBe(500)
    const errBody = (await errRes.json()) as { error: string }
    expect(errBody.error).toBe(
      'The regridding service is temporarily unavailable. Please try again shortly.',
    )
    expect(errBody.error).not.toContain('WIF')
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

  it('ignores spoofed X-Forwarded-For rotation when trusted ingress headers are absent in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('K_SERVICE', '')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://upstash.example')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'upstash-token')
    vi.stubEnv('OG_PUBLIC_DAILY_JOB_BUDGET', '50')

    // Force rateLimit to use the in-memory limiter while keeping assertDistributedRateLimitAvailable satisfied
    const rateLimitMod = await import('@/lib/rate-limit')
    const realRateLimit = rateLimitMod.rateLimit
    vi.spyOn(rateLimitMod, 'rateLimit').mockImplementation((id, opts) =>
      realRateLimit(id, { ...opts, requireDistributed: false }),
    )
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const reqSecMod = await import('@/lib/request-security')
    vi.spyOn(reqSecMod, 'assertDistributedRateLimitAvailable').mockImplementation(() => {})

    const { POST } = await import('@/app/api/omni-gridder/submit/route')

    // In production without a trusted ingress the expected origin is the
    // configured site, so the browser Origin must be the public one.
    const publicOrigin = 'https://aetherisvision.com'

    // Caller rotates X-Forwarded-For on every request, but in production without
    // trusted ingress headers getTrustedClientIp returns null -> all three share
    // the single 'no-trusted-client-ip' bucket.
    const r1 = await POST(submitRequest({ methods: ['bilinear'] }, '203.0.113.1', publicOrigin))
    expect(r1.status).toBe(200)
    const r2 = await POST(submitRequest({ methods: ['nearest'] }, '203.0.113.2', publicOrigin))
    expect(r2.status).toBe(200)
    const r3 = await POST(submitRequest({ methods: ['conservative'] }, '203.0.113.3', publicOrigin))
    expect(r3.status).toBe(429)
  })

  it('enforces the global daily job budget across different visitor IPs and returns budgetExhausted: true', async () => {
    vi.stubEnv('OG_PUBLIC_DAILY_JOB_BUDGET', '3')
    const { POST } = await import('@/app/api/omni-gridder/submit/route')

    const v1 = await POST(
      submitRequest({ methods: ['bilinear', 'nearest'] }, '198.51.100.20'),
    )
    expect(v1.status).toBe(200)

    const v2 = await POST(
      submitRequest({ methods: ['bilinear', 'conservative'] }, '198.51.100.21'),
    )
    expect(v2.status).toBe(429)
    const body = await v2.json()
    expect(body.budgetExhausted).toBe(true)
    expect(body.error).toMatch(/daily|compute budget/i)
  })

  it('requires and verifies a Turnstile token when NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '1x00000000000000000000AA')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'turnstile-prod-secret')
    const fetchSpy = vi.spyOn(global, 'fetch')
    const { POST } = await import('@/app/api/omni-gridder/submit/route')

    // 1. Missing token -> 400 before siteverify or submitJob
    const missingRes = await POST(submitRequest({ methods: ['bilinear'] }, '198.51.100.30'))
    expect(missingRes.status).toBe(400)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(submitJobMock).not.toHaveBeenCalled()

    // 2. Rejected token -> 403 before submitJob
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const invalidRes = await POST(
      submitRequest(
        { methods: ['bilinear'], turnstileToken: 'bad-token' },
        '198.51.100.31',
      ),
    )
    expect(invalidRes.status).toBe(403)
    expect(submitJobMock).not.toHaveBeenCalled()

    // 3. Valid token for omni-gridder-showcase action -> 200
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          action: 'omni-gridder-showcase',
          hostname: 'localhost',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    const validRes = await POST(
      submitRequest(
        { methods: ['bilinear'], turnstileToken: 'valid-token' },
        '198.51.100.32',
      ),
    )
    expect(validRes.status).toBe(200)
    expect(submitJobMock).toHaveBeenCalledTimes(1)
    fetchSpy.mockRestore()
  })
})

describe('GET /api/omni-gridder/status and /download — server-side panels and sanitized URIs (#89)', () => {
  it('derives panels and compare_uri server-side and strips signed storage.googleapis.com URLs', async () => {
    const jobA = 'demo-batch1-nearest'
    const jobB = 'demo-batch1-bilinear'
    const plotId = `${jobB}-plot`
    getJobStatusMock.mockImplementation(async (jobId: string) => ({
      job_id: jobId,
      processor_type: jobId.endsWith('-plot') ? 'plot' : 'regrid',
      status: 'succeeded',
      submitted_at: Date.now(),
      result_uri: `https://storage.googleapis.com/${TEST_BUCKET}/demo/regrid/${jobId}/out?X-Goog-Signature=secret`,
      error_message: null,
      diagnostics: null,
    }))

    const { GET } = await import('@/app/api/omni-gridder/status/route')
    // Even if a caller passes poisoned panels or compare query params, publicMode ignores them
    const req = new NextRequest(
      `http://localhost/api/omni-gridder/status?jobs=${jobA},${jobB}&chainPlot=1&primary=${jobB}&datasetId=gfs-hgt500&panels=demo-other-nearest&compare=gs://evil/bucket.nc`,
    )
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = (await res.json()) as {
      jobs: Array<{ job_id: string; result_uri: string | null; nextJobId?: string }>
    }
    expect(body.jobs).toHaveLength(2)
    // Regrid jobs never expose their signed result_uri in public mode
    expect(body.jobs[0].result_uri).toBeNull()
    expect(body.jobs[1].result_uri).toBeNull()
    expect(body.jobs[1].nextJobId).toBe(plotId)

    // Verify submitJob received server-derived panels (jobA, jobB) and catalog compare_uri
    expect(submitJobMock).toHaveBeenCalledTimes(1)
    const plotParams = submitJobMock.mock.calls[0][0].params as {
      compare_uri?: string
      panel_uris?: Array<{ uri: string; label: string }>
    }
    expect(plotParams.compare_uri).toBe(
      'gs://aetherisvision-og-demo/inputs/gfs/hgt500_2026070706_f006.nc',
    )
    expect(plotParams.panel_uris?.map((p) => p.label)).toEqual(['Nearest', 'Bilinear'])

    // Polling the succeeded plot job returns the same-origin proxy path, never the signed URL
    const plotRes = await GET(
      new NextRequest(`http://localhost/api/omni-gridder/status?jobs=${plotId}`),
    )
    const plotBody = (await plotRes.json()) as {
      jobs: Array<{ job_id: string; result_uri: string | null }>
    }
    expect(plotBody.jobs[0].result_uri).toBe(
      `/api/omni-gridder/download?job=${encodeURIComponent(plotId)}&inline=1`,
    )
    expect(JSON.stringify(plotBody)).not.toContain('X-Goog-Signature')
  })

  it('rejects non-demo job IDs on both status and download routes with 400', async () => {
    const { GET: getStatus } = await import('@/app/api/omni-gridder/status/route')
    const statusRes = await getStatus(
      new NextRequest('http://localhost/api/omni-gridder/status?jobs=arbitrary-job-id'),
    )
    expect(statusRes.status).toBe(400)

    const { GET: getDownload } = await import('@/app/api/omni-gridder/download/route')
    // Valid admin plot ID shape, but missing `demo-` prefix and method suffix -> rejected on public route
    const downloadRes = await getDownload(
      new NextRequest('http://localhost/api/omni-gridder/download?job=internal-job-plot'),
    )
    expect(downloadRes.status).toBe(400)
    expect(getJobStatusMock).not.toHaveBeenCalled()
  })
})
