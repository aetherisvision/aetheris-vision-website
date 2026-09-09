import { createHash, randomUUID } from 'node:crypto'
import { sql } from '@/lib/db'
import { isClaudeSubscriptionInput, type ClaudeSubscriptionInput } from '@/lib/claude-subscription-limits'

export type ClaudeSubscriptionErrorCode =
  | 'claude_worker_offline'
  | 'claude_subscription_auth'
  | 'claude_subscription_limit'
  | 'claude_job_failed'
  | 'claude_generation_timeout'
  | 'claude_job_timeout'

const ERROR_MESSAGES: Record<ClaudeSubscriptionErrorCode, string> = {
  claude_worker_offline: 'Claude is unavailable because the analysis worker on your Mac is offline. It resumes automatically when your Mac is awake.',
  claude_subscription_auth: 'Claude Code needs you to sign in to your Claude subscription on your Mac. Your request will not use paid API credits.',
  claude_subscription_limit: 'Your Claude subscription has reached its usage limit. Try again after the limit resets.',
  claude_job_failed: 'Claude could not finish this request. Please try again.',
  claude_generation_timeout: 'Claude reached the time limit for this request. For a long conversation, clear older messages or ask a shorter question before retrying.',
  claude_job_timeout: 'Your request is still waiting for Claude. Try again to pick up the result.',
}

export class ClaudeSubscriptionError extends Error {
  readonly status = 503
  constructor(readonly code: ClaudeSubscriptionErrorCode, message = ERROR_MESSAGES[code]) {
    super(message)
    this.name = 'ClaudeSubscriptionError'
  }
}

const WAIT_MS = 180_000
const POLL_MS = 1500

export async function requireSubscriptionWorker(): Promise<void> {
  const rows = (await sql`
    SELECT state, auth_method FROM admin_ai_workers
    WHERE last_seen_at > now() - interval '45 seconds'
    ORDER BY CASE WHEN state IN ('ready', 'busy') THEN 0 ELSE 1 END, last_seen_at DESC
    LIMIT 1
  `) as { state: string; auth_method: string }[]
  const worker = rows[0]
  if (worker?.state === 'auth_required') throw new ClaudeSubscriptionError('claude_subscription_auth')
  if (worker?.state === 'limited') throw new ClaudeSubscriptionError('claude_subscription_limit')
  if (!worker || !['ready', 'busy'].includes(worker.state) || worker.auth_method !== 'subscription') {
    throw new ClaudeSubscriptionError('claude_worker_offline')
  }
}

/** Only the owner-authenticated routes call this. Claude credentials never leave the Mac. */
export async function runClaudeSubscription(
  kind: 'assistant' | 'lead_email',
  input: ClaudeSubscriptionInput,
): Promise<string> {
  if (!isClaudeSubscriptionInput(input)) throw new ClaudeSubscriptionError('claude_job_failed')
  const serialized = JSON.stringify(input)
  const dedupeKey = createHash('sha256').update(`${kind}\n${serialized}`).digest('hex')

  // A completed response can be retrieved even if the Mac has since gone to sleep.
  const cached = (await sql`
    SELECT result FROM admin_ai_jobs
    WHERE dedupe_key = ${dedupeKey} AND status = 'complete'
      AND completed_at > now() - interval '24 hours'
  `) as { result: string }[]
  if (cached[0]?.result) return cached[0].result

  await requireSubscriptionWorker()
  const ids = (await sql`
    INSERT INTO admin_ai_jobs (id, dedupe_key, kind, input)
    VALUES (${randomUUID()}, ${dedupeKey}, ${kind}, ${serialized}::jsonb)
    ON CONFLICT (dedupe_key) DO UPDATE SET
      status = 'queued', result = NULL, error_code = NULL, attempts = 0,
      queued_at = now(), claimed_at = NULL, completed_at = NULL, claim_token = NULL,
      updated_at = now()
    WHERE admin_ai_jobs.status = 'failed'
      OR (admin_ai_jobs.status = 'complete' AND admin_ai_jobs.completed_at <= now() - interval '24 hours')
    RETURNING id
  `) as { id: string }[]
  // A concurrent request owns an active job (or completed between our cache read and insert).
  const existing = ids[0] ? ids : (await sql`
    SELECT id FROM admin_ai_jobs WHERE dedupe_key = ${dedupeKey}
  `) as { id: string }[]
  const id = existing[0]?.id
  if (!id) throw new ClaudeSubscriptionError('claude_job_failed')

  const deadline = Date.now() + WAIT_MS
  while (Date.now() < deadline) {
    const rows = (await sql`
      SELECT status, result, error_code FROM admin_ai_jobs WHERE id = ${id}
    `) as { status: string; result: string | null; error_code: string | null }[]
    const job = rows[0]
    if (job?.status === 'complete' && job.result) return job.result
    if (!job || job.status === 'failed') {
      const code = job?.error_code && Object.hasOwn(ERROR_MESSAGES, job.error_code)
        ? job.error_code as ClaudeSubscriptionErrorCode
        : 'claude_job_failed'
      throw new ClaudeSubscriptionError(code)
    }
    await new Promise(resolve => setTimeout(resolve, POLL_MS))
  }
  throw new ClaudeSubscriptionError('claude_job_timeout')
}
