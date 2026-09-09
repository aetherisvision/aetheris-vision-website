import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClaudeSubscriptionError, runClaudeSubscription } from '@/lib/claude-subscription'

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }))
vi.mock('@/lib/db', () => ({ sql: sqlMock }))
const input = { model: 'claude-fable-5' as const, system: 'Review provided facts.', prompt: 'A synthetic opportunity.' }

describe('subscription queue adapter', () => {
  beforeEach(() => { sqlMock.mockReset() })

  it('returns an existing response without needing a running Mac', async () => {
    sqlMock.mockResolvedValueOnce([{ result: 'Cached advice.' }])
    await expect(runClaudeSubscription('assistant', input)).resolves.toBe('Cached advice.')
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('does not enqueue when the worker is offline', async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([])
    await expect(runClaudeSubscription('assistant', input)).rejects.toMatchObject({ code: 'claude_worker_offline', status: 503 })
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it('rejects a heartbeat that is not subscription authenticated', async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ state: 'ready', auth_method: 'api_key' }])
    await expect(runClaudeSubscription('assistant', input)).rejects.toBeInstanceOf(ClaudeSubscriptionError)
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['auth_required', 'claude_subscription_auth'],
    ['limited', 'claude_subscription_limit'],
  ])('reports %s before any enqueue', async (state, code) => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ state, auth_method: 'none' }])
    await expect(runClaudeSubscription('assistant', input)).rejects.toMatchObject({ code })
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it('deduplicates the bounded input and returns the worker result without an API key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    sqlMock.mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ state: 'ready', auth_method: 'subscription' }])
      .mockResolvedValueOnce([{ id: 'job-id' }])
      .mockResolvedValueOnce([{ status: 'complete', result: 'Review the deadline.', error_code: null }])
    await expect(runClaudeSubscription('assistant', input)).resolves.toBe('Review the deadline.')
    expect(sqlMock.mock.calls[2][2]).toMatch(/^[a-f0-9]{64}$/)
    expect(sqlMock.mock.calls[2][4]).toBe(JSON.stringify(input))
  })

  it('returns only known safe failure codes, not arbitrary worker error text', async () => {
    sqlMock.mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ state: 'busy', auth_method: 'subscription' }])
      .mockResolvedValueOnce([{ id: 'job-id' }])
      .mockResolvedValueOnce([{ status: 'failed', result: null, error_code: 'secret diagnostic text' }])
    await expect(runClaudeSubscription('assistant', input)).rejects.toMatchObject({ code: 'claude_job_failed' })
  })

  it('reuses a concurrently claimed job instead of submitting duplicate work', async () => {
    sqlMock.mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ state: 'busy', auth_method: 'subscription' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'existing-job' }])
      .mockResolvedValueOnce([{ status: 'complete', result: 'Existing result.' }])
    await expect(runClaudeSubscription('assistant', input)).resolves.toBe('Existing result.')
    expect(sqlMock.mock.calls[4][1]).toBe('existing-job')
  })

  it('ends the HTTP wait after 180 seconds while leaving the job available for retry', async () => {
    vi.useFakeTimers()
    try {
      sqlMock.mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ state: 'busy', auth_method: 'subscription' }])
        .mockResolvedValueOnce([{ id: 'job-id' }])
        .mockResolvedValue([{ status: 'queued', result: null, error_code: null }])
      const assertion = expect(runClaudeSubscription('assistant', input)).rejects.toMatchObject({ code: 'claude_job_timeout' })
      await vi.advanceTimersByTimeAsync(180_001)
      await assertion
      expect(sqlMock.mock.calls.slice(3).every(call => call[0].join('').includes('SELECT status, result, error_code'))).toBe(true)
    } finally { vi.useRealTimers() }
  })
})
