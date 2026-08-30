import type { DatabaseMigration } from './types'

export const reviewDeclinedStagesMigration: DatabaseMigration = {
  id: '008_review_declined_stages',
  description: 'Add review/declined lead stages for auto-synced opportunity-radar leads',
  up: (sql) => [
    // 'review' is the entry stage for every opportunity-radar lead synced
    // from a scan (not just pursued ones) -- 'declined' is a distinct
    // outcome from 'lost' on purpose: 'lost' means "we bid and didn't win";
    // 'declined' means "we chose not to pursue it" (or it expired
    // unactioned). Conflating them would wreck win-rate/bid-ratio numbers
    // once declines are the majority of synced rows.
    sql.query(`
      ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check
    `),
    sql.query(`
      ALTER TABLE leads ADD CONSTRAINT leads_stage_check
        CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'review', 'declined'))
    `),
  ],
}
