import type { DatabaseMigration } from './types'

export const contactVerificationMigration: DatabaseMigration = {
  id: '005_contact_verification',
  description: 'Add privacy-preserving contact verification and verified lead metadata',
  up: (sql) => [
    sql.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS location text,
        ADD COLUMN IF NOT EXISTS email_verified_at timestamptz
    `),
    sql.query(`
      CREATE TABLE IF NOT EXISTS contact_verification_challenges (
        id            uuid PRIMARY KEY,
        purpose       text NOT NULL,
        submission_id text NOT NULL,
        email_hash    text NOT NULL,
        code_hash     text NOT NULL,
        attempts      integer NOT NULL DEFAULT 0,
        expires_at    timestamptz NOT NULL,
        verified_at   timestamptz,
        completed_at  timestamptz,
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now()
      )
    `),
    sql.query(`
      ALTER TABLE contact_verification_challenges
        DROP CONSTRAINT IF EXISTS contact_verification_purpose_check,
        DROP CONSTRAINT IF EXISTS contact_verification_submission_id_check,
        DROP CONSTRAINT IF EXISTS contact_verification_email_hash_check,
        DROP CONSTRAINT IF EXISTS contact_verification_code_hash_check,
        DROP CONSTRAINT IF EXISTS contact_verification_attempts_check,
        DROP CONSTRAINT IF EXISTS contact_verification_expiry_check,
        DROP CONSTRAINT IF EXISTS contact_verification_state_check
    `),
    sql.query(`
      ALTER TABLE contact_verification_challenges
        ADD CONSTRAINT contact_verification_purpose_check
          CHECK (purpose IN ('contact', 'intake')),
        ADD CONSTRAINT contact_verification_submission_id_check
          CHECK (char_length(btrim(submission_id)) BETWEEN 1 AND 128),
        ADD CONSTRAINT contact_verification_email_hash_check
          CHECK (email_hash ~ '^[0-9a-f]{64}$'),
        ADD CONSTRAINT contact_verification_code_hash_check
          CHECK (code_hash ~ '^[0-9a-f]{64}$'),
        ADD CONSTRAINT contact_verification_attempts_check
          CHECK (attempts BETWEEN 0 AND 6),
        ADD CONSTRAINT contact_verification_expiry_check
          CHECK (expires_at > created_at),
        ADD CONSTRAINT contact_verification_state_check
          CHECK (
            (verified_at IS NULL OR (verified_at >= created_at AND verified_at <= expires_at))
            AND (completed_at IS NULL OR verified_at IS NOT NULL)
            AND (completed_at IS NULL OR (completed_at >= verified_at AND completed_at <= expires_at))
          )
    `),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS contact_verification_purpose_submission_uidx
        ON contact_verification_challenges (purpose, submission_id)
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS contact_verification_expires_at_idx
        ON contact_verification_challenges (expires_at)
    `),
  ],
}
