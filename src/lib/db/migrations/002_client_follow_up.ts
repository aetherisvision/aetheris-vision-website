import type { DatabaseMigration } from './types'

export const clientFollowUpMigration: DatabaseMigration = {
  id: '002_client_follow_up',
  description: 'Add client follow-up scheduling and account notes',
  up: (sql) => [
    sql.query(`
      ALTER TABLE clients
        ADD COLUMN IF NOT EXISTS next_touch timestamptz,
        ADD COLUMN IF NOT EXISTS notes text
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS clients_next_touch_idx
        ON clients (next_touch) WHERE next_touch IS NOT NULL
    `),
  ],
}
