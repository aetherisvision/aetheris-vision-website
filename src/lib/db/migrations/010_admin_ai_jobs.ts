import type { DatabaseMigration } from './types'

export const adminAiJobsMigration: DatabaseMigration = {
  id: '010_admin_ai_jobs',
  description: 'Queue private CRM analysis for the owner’s subscribed Claude Code worker',
  up: (sql) => [
    sql.query(`
      CREATE TABLE IF NOT EXISTS admin_ai_jobs (
        id uuid PRIMARY KEY,
        dedupe_key text NOT NULL UNIQUE,
        kind text NOT NULL CHECK (kind IN ('assistant', 'lead_email')),
        input jsonb NOT NULL,
        status text NOT NULL DEFAULT 'queued'
          CHECK (status IN ('queued', 'running', 'complete', 'failed')),
        result text,
        error_code text,
        attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 2),
        claim_token uuid,
        queued_at timestamptz NOT NULL DEFAULT now(),
        claimed_at timestamptz,
        completed_at timestamptz,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS admin_ai_jobs_pending
        ON admin_ai_jobs (queued_at) WHERE status IN ('queued', 'running')
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS admin_ai_workers (
        id text PRIMARY KEY,
        state text NOT NULL CHECK (state IN ('ready', 'busy', 'auth_required', 'limited', 'error')),
        auth_method text NOT NULL DEFAULT 'none',
        last_seen_at timestamptz NOT NULL DEFAULT now()
      )
    `),
  ],
}
