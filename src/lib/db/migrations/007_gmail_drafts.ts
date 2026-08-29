import type { DatabaseMigration } from './types'

export const gmailDraftsMigration: DatabaseMigration = {
  id: '007_gmail_drafts',
  description: 'Track granted OAuth scopes and per-lead Gmail draft state',
  up: (sql) => [
    // oauth_tokens predates the versioned migration system (created once by
    // the now-dead createTables() bootstrap) and has never recorded which
    // scopes a stored refresh token actually covers. Recording it here lets
    // the draft-email route give a clear "reconnect Gmail" error instead of
    // an opaque Google 403 when a token was granted before compose access
    // was added.
    sql.query(`
      ALTER TABLE oauth_tokens
        ADD COLUMN IF NOT EXISTS scopes text
    `),
    // Marks a lead as drafted (not sent -- sending stays a human action in
    // Gmail) so the admin UI can show "Draft created" instead of allowing a
    // second click to silently create a duplicate draft.
    sql.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS gmail_draft_id text,
        ADD COLUMN IF NOT EXISTS gmail_draft_created_at timestamptz
    `),
  ],
}
