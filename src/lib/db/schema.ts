import { sql } from './index'

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
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id                       SERIAL PRIMARY KEY,
      client_id                INTEGER REFERENCES clients(id),
      name                     TEXT NOT NULL,
      status                   TEXT NOT NULL DEFAULT 'active',
      docuseal_submission_id   TEXT,
      signed_pdf_base64        TEXT,
      signed_at                TIMESTAMPTZ,
      start_date               DATE,
      end_date                 DATE,
      created_at               TIMESTAMPTZ DEFAULT NOW()
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
      number                TEXT NOT NULL,
      description           TEXT NOT NULL,
      amount_cents          INTEGER NOT NULL,
      status                TEXT NOT NULL DEFAULT 'draft',
      stripe_invoice_id     TEXT,
      stripe_invoice_url    TEXT,
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
      status               TEXT NOT NULL DEFAULT 'new',
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
      created_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `

  console.log('Tables created successfully')
}

createTables().catch(console.error)
