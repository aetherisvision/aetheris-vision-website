/** Local-only queue worker. The hosted website never receives Claude OAuth credentials. */
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { sql } from '../src/lib/db'
import { isClaudeSubscriptionInput } from '../src/lib/claude-subscription-limits'
import {
  checkSubscriptionAuth, invokeSubscriptionClaude, SubscriptionCliError,
} from './lib/claude-subscription-cli'

interface Job {
  id: string
  kind: string
  input: unknown
}

export function parseJobInput(job: Job): { model: string; system: string; prompt: string } {
  if (!['assistant', 'lead_email'].includes(job.kind) || !job.input || typeof job.input !== 'object') {
    throw new SubscriptionCliError('claude_job_failed')
  }
  const input = job.input
  if (!isClaudeSubscriptionInput(input)) {
    throw new SubscriptionCliError('claude_job_failed')
  }
  return { model: input.model, system: input.system, prompt: input.prompt }
}

export async function runWorker(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required for the local worker')
  const db = sql
  const binary = process.env.CLAUDE_SUBSCRIPTION_BINARY || '/opt/homebrew/bin/claude'
  const workerId = `av-claude-subscription-${randomUUID()}`
  let stopped = false
  let state: 'ready' | 'busy' | 'auth_required' | 'limited' | 'error' = 'auth_required'
  let authMethod = 'none'
  let lastAuthCheck = 0
  let lastCleanup = 0
  let activeClaim: { id: string; token: string } | null = null
  const stop = () => { stopped = true }
  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const heartbeat = async () => {
    await db`
      INSERT INTO admin_ai_workers (id, state, auth_method, last_seen_at)
      VALUES (${workerId}, ${state}, ${authMethod}, now())
      ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state,
        auth_method = EXCLUDED.auth_method, last_seen_at = now()
    `
    // Renew only this process's exact lease; slow DB writes or a long pause
    // must not let another worker reclaim text generation that is still live.
    const owned = activeClaim
    if (owned) await db`
      UPDATE admin_ai_jobs SET claimed_at = now()
      WHERE id = ${owned.id} AND claim_token = ${owned.token} AND status = 'running'
    `
  }
  const timer = setInterval(() => { void heartbeat().catch(() => {}) }, 10_000)
  try {
    while (!stopped) {
      if (Date.now() - lastAuthCheck > 30_000 || authMethod !== 'subscription') {
        if (!await checkSubscriptionAuth(binary)) {
          state = 'auth_required'; authMethod = 'none'
          await heartbeat()
          await sleep(15_000)
          continue
        }
        lastAuthCheck = Date.now()
      }
      state = 'ready'; authMethod = 'subscription'
      await heartbeat()
      // Inputs and outputs are private transient data; retain only one day.
      if (Date.now() - lastCleanup > 60_000) {
        await db`DELETE FROM admin_ai_jobs WHERE updated_at < now() - interval '24 hours'`
        await db`DELETE FROM admin_ai_workers WHERE last_seen_at < now() - interval '1 day'`
        lastCleanup = Date.now()
      }
      // A dead worker's lease can be retried once; normal model errors require an explicit user retry.
      await db`
        UPDATE admin_ai_jobs SET status = CASE WHEN attempts < 2 THEN 'queued' ELSE 'failed' END,
          error_code = CASE WHEN attempts < 2 THEN NULL ELSE 'claude_job_failed' END,
          claim_token = NULL, updated_at = now()
        WHERE status = 'running' AND claimed_at < now() - interval '3 minutes'
      `
      await db`
        UPDATE admin_ai_jobs SET status = 'failed', error_code = 'claude_job_timeout', updated_at = now()
        WHERE status = 'queued' AND queued_at < now() - interval '1 hour'
      `
      const claimToken = randomUUID()
      const rows = await db`
        UPDATE admin_ai_jobs SET status = 'running', claim_token = ${claimToken},
          claimed_at = now(), updated_at = now(), attempts = attempts + 1
        WHERE id = (
          SELECT id FROM admin_ai_jobs WHERE status = 'queued' AND attempts < 2
          ORDER BY queued_at LIMIT 1 FOR UPDATE SKIP LOCKED
        )
        RETURNING id, kind, input
      ` as Job[]
      const job = rows[0]
      if (!job) { await sleep(3000); continue }
      activeClaim = { id: job.id, token: claimToken }
      state = 'busy'
      await heartbeat()
      try {
        const text = await invokeSubscriptionClaude(parseJobInput(job), binary)
        await db`
          UPDATE admin_ai_jobs SET status = 'complete', result = ${text}, error_code = NULL,
            completed_at = now(), updated_at = now(), claim_token = NULL
          WHERE id = ${job.id} AND claim_token = ${claimToken} AND status = 'running'
        `
      } catch (error) {
        const code = error instanceof SubscriptionCliError ? error.code : 'claude_job_failed'
        await db`
          UPDATE admin_ai_jobs SET status = 'failed', error_code = ${code},
            completed_at = now(), updated_at = now(), claim_token = NULL
          WHERE id = ${job.id} AND claim_token = ${claimToken} AND status = 'running'
        `
        state = code === 'claude_subscription_auth' ? 'auth_required'
          : code === 'claude_subscription_limit' ? 'limited' : 'error'
        if (state === 'auth_required') authMethod = 'none'
        await heartbeat()
        // Never print model output, prompts, credentials, or raw provider errors.
        console.error(`Claude subscription job failed: ${code}`)
        if (state === 'limited') await sleep(60_000)
      } finally {
        activeClaim = null
      }
    }
  } finally {
    clearInterval(timer)
    await db`DELETE FROM admin_ai_workers WHERE id = ${workerId}`
    process.off('SIGTERM', stop)
    process.off('SIGINT', stop)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWorker().catch(() => {
    console.error('Claude subscription worker stopped; check database access and native Claude Code sign-in.')
    process.exitCode = 1
  })
}
