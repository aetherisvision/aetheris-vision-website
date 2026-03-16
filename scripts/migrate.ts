import { sql } from '../src/lib/db/index'

async function migrate() {
  // Add columns to projects that were added to schema.ts but never migrated
  await sql`
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS docuseal_submission_id TEXT,
      ADD COLUMN IF NOT EXISTS signed_pdf_base64      TEXT,
      ADD COLUMN IF NOT EXISTS signed_at              TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS start_date             DATE,
      ADD COLUMN IF NOT EXISTS end_date               DATE
  `
  console.log('Migration complete')
}

migrate().catch(console.error)
