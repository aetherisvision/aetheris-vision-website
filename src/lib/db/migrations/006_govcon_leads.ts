import type { DatabaseMigration } from './types'

export const govconLeadsMigration: DatabaseMigration = {
  id: '006_govcon_leads',
  description: 'Add structured government-contracting fields for opportunity-radar leads',
  up: (sql) => [
    // Nullable, source-scoped structured data -- not a second leads table.
    // Only rows with source='opportunity-radar' populate this; every other
    // lead source leaves it null. Holds fields the base leads table has no
    // columns for: NAICS/PSC codes, set-aside type, the SAM.gov/HigherGov
    // URL, the solicitation number, and the contracting officer's contact
    // info, none of which apply to a website contact-form lead.
    sql.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS govcon jsonb
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS leads_govcon_idx
        ON leads USING gin (govcon) WHERE govcon IS NOT NULL
    `),
  ],
}
