import { sql } from './index'
import { runMigrations } from './migrations'

// Invoke explicitly from a setup script; this module must remain side-effect-free on import.
export async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id          SERIAL PRIMARY KEY,
      date        DATE NOT NULL,
      vendor      TEXT NOT NULL,
      description TEXT NOT NULL,
      category    TEXT NOT NULL,
      amount      NUMERIC(10, 2) NOT NULL,
      tax_year    INTEGER NOT NULL,
      receipt_url TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email        TEXT NOT NULL,
      phone        TEXT,
      address      TEXT,
      relationship_status TEXT NOT NULL DEFAULT 'prospect',
      next_touch   TIMESTAMPTZ,
      notes        TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id                    SERIAL PRIMARY KEY,
      name                  TEXT NOT NULL,
      email                 TEXT NOT NULL,
      organization          TEXT,
      phone                 TEXT,
      service               TEXT,
      message               TEXT NOT NULL,
      source                TEXT NOT NULL DEFAULT 'unknown',
      external_id           TEXT,
      stage                 TEXT NOT NULL DEFAULT 'new',
      estimated_value_cents INTEGER,
      next_follow_up        TIMESTAMPTZ,
      notes                 TEXT,
      location              TEXT,
      email_verified_at     TIMESTAMPTZ,
      client_id             INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS contact_verification_challenges (
      id            UUID PRIMARY KEY,
      purpose       TEXT NOT NULL
        CONSTRAINT contact_verification_purpose_check
        CHECK (purpose IN ('contact', 'intake')),
      submission_id TEXT NOT NULL
        CONSTRAINT contact_verification_submission_id_check
        CHECK (char_length(btrim(submission_id)) BETWEEN 1 AND 128),
      email_hash    TEXT NOT NULL
        CONSTRAINT contact_verification_email_hash_check
        CHECK (email_hash ~ '^[0-9a-f]{64}$'),
      code_hash     TEXT NOT NULL
        CONSTRAINT contact_verification_code_hash_check
        CHECK (code_hash ~ '^[0-9a-f]{64}$'),
      attempts      INTEGER NOT NULL DEFAULT 0
        CONSTRAINT contact_verification_attempts_check
        CHECK (attempts BETWEEN 0 AND 6),
      expires_at    TIMESTAMPTZ NOT NULL,
      verified_at   TIMESTAMPTZ,
      completed_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT contact_verification_expiry_check CHECK (expires_at > created_at),
      CONSTRAINT contact_verification_state_check CHECK (
        (verified_at IS NULL OR (verified_at >= created_at AND verified_at <= expires_at))
        AND (completed_at IS NULL OR verified_at IS NOT NULL)
        AND (completed_at IS NULL OR (completed_at >= verified_at AND completed_at <= expires_at))
      )
    )
  `

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS contact_verification_purpose_submission_uidx
      ON contact_verification_challenges (purpose, submission_id)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS contact_verification_expires_at_idx
      ON contact_verification_challenges (expires_at)
  `

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id                       SERIAL PRIMARY KEY,
      client_id                INTEGER REFERENCES clients(id),
      lead_id                  INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      name                     TEXT NOT NULL,
      status                   TEXT NOT NULL DEFAULT 'proposal',
      source                   TEXT,
      external_id              TEXT,
      docuseal_submission_id   TEXT,
      proposal_sent_at         TIMESTAMPTZ,
      signed_pdf_base64        TEXT,
      signed_at                TIMESTAMPTZ,
      deposit_amount_cents     INTEGER,
      start_date               DATE,
      end_date                 DATE,
      created_at               TIMESTAMPTZ DEFAULT NOW(),
      updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier  TEXT NOT NULL,
      token       TEXT NOT NULL,
      expires     TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id                    SERIAL PRIMARY KEY,
      client_id             INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      project_id            INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      purpose               TEXT,
      number                TEXT NOT NULL,
      description           TEXT NOT NULL,
      amount_cents          INTEGER NOT NULL,
      status                TEXT NOT NULL DEFAULT 'draft',
      stripe_invoice_id     TEXT,
      stripe_invoice_url    TEXT,
      notification_idempotency_key TEXT,
      notification_sent_at  TIMESTAMPTZ,
      due_date              DATE,
      paid_at               TIMESTAMPTZ,
      created_at            TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Add stripe_customer_id to clients if it doesn't exist
  await sql`
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT
  `

  await sql`
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id           SERIAL PRIMARY KEY,
      account      TEXT NOT NULL UNIQUE,
      refresh_token TEXT NOT NULL,
      email        TEXT,
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Add Gmail scanner columns to expenses if they don't exist
  await sql`
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS gmail_message_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS source TEXT
  `

  await sql`
    CREATE TABLE IF NOT EXISTS intake_submissions (
      id                   SERIAL PRIMARY KEY,
      client_id            INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      project_id           INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      lead_id              INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      status               TEXT NOT NULL DEFAULT 'new',
      source               TEXT NOT NULL DEFAULT 'legacy_intake',
      external_id          TEXT,
      company_name         TEXT NOT NULL,
      industry             TEXT,
      location             TEXT,
      revenue              TEXT,
      contact_name         TEXT NOT NULL,
      contact_title        TEXT,
      contact_email        TEXT NOT NULL,
      contact_phone        TEXT,
      budget_range         TEXT,
      timeline             TEXT,
      objectives           TEXT[],
      special_requirements TEXT,
      questions_for_us     TEXT,
      raw_data             JSONB,
      pro_bono             BOOLEAN NOT NULL DEFAULT FALSE,
      submitted_at         TIMESTAMPTZ DEFAULT NOW(),
      created_at           TIMESTAMPTZ DEFAULT NOW(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // documents table — used by /api/admin/documents and /api/client/documents
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id          SERIAL PRIMARY KEY,
      client_id   INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      title       TEXT NOT NULL,
      content     TEXT,
      type        TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id             SERIAL PRIMARY KEY,
      client_name    TEXT NOT NULL,
      client_role    TEXT,
      client_company TEXT,
      rating         INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      body           TEXT NOT NULL,
      approved       BOOLEAN NOT NULL DEFAULT false,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  // Project phase tracking columns
  await sql`
    ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS current_phase          TEXT,
    ADD COLUMN IF NOT EXISTS phase_proposal_date    DATE,
    ADD COLUMN IF NOT EXISTS phase_kickoff_date     DATE,
    ADD COLUMN IF NOT EXISTS phase_design_date      DATE,
    ADD COLUMN IF NOT EXISTS phase_development_date DATE,
    ADD COLUMN IF NOT EXISTS phase_review_date      DATE,
    ADD COLUMN IF NOT EXISTS phase_launched_date    DATE
  `

  // platform_preference on intake_submissions
  await sql`
    ALTER TABLE intake_submissions
    ADD COLUMN IF NOT EXISTS platform_preference TEXT
  `

  // Versioned migrations reconcile existing deployments with this fresh-install schema.
  await runMigrations()
}
