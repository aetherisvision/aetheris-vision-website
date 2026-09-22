import type { DatabaseMigration } from './types'

export const leadCorrespondenceMigration: DatabaseMigration = {
  id: '012_lead_correspondence',
  description: 'Remember Gmail draft identity for verified sent-mail matching',
  up: sql => [
    sql.query(`ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS gmail_draft_subject text,
      ADD COLUMN IF NOT EXISTS gmail_thread_id text,
      ADD COLUMN IF NOT EXISTS last_sent_message_id text`),
  ],
}
