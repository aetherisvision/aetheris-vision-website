import type { DatabaseMigration } from './types'

export const leadWorkspaceMigration: DatabaseMigration = {
  id: '009_lead_workspace',
  description: 'Recoverable opportunity removal, versioned workflow edits, and server-owned activity history',
  up: (sql) => [
    // Removal is independent of sales stage. Keeping the row and its external
    // key is the tombstone that prevents a radar rescan from re-importing it.
    sql.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS removed_at timestamptz,
        ADD COLUMN IF NOT EXISTS removal_reason text,
        ADD COLUMN IF NOT EXISTS workflow_version integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS activity_history jsonb NOT NULL DEFAULT '[]'::jsonb
    `),
    sql.query(`
      ALTER TABLE leads
        ADD CONSTRAINT leads_workflow_version_check CHECK (workflow_version >= 0),
        ADD CONSTRAINT leads_activity_history_check CHECK (jsonb_typeof(activity_history) = 'array'),
        ADD CONSTRAINT leads_removal_state_check CHECK (
          (removed_at IS NOT NULL OR removal_reason IS NULL)
          AND (removal_reason IS NULL OR char_length(removal_reason) <= 1000)
        )
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS leads_visible_stage_follow_up_idx
        ON leads (stage, next_follow_up) WHERE removed_at IS NULL
    `),
  ],
}
