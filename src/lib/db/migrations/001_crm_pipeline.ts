import type { DatabaseMigration } from './types'

export const crmPipelineMigration: DatabaseMigration = {
  id: '001_crm_pipeline',
  description: 'Create the canonical CRM pipeline and link intake, clients, and projects',
  up: (sql) => [
    sql.query(`
      DO $$
      DECLARE missing_tables text;
      BEGIN
        SELECT string_agg(required.name, ', ' ORDER BY required.name)
          INTO missing_tables
        FROM (VALUES ('clients'), ('projects'), ('intake_submissions'), ('invoices')) AS required(name)
        WHERE to_regclass('public.' || required.name) IS NULL;

        IF missing_tables IS NOT NULL THEN
          RAISE EXCEPTION
            'CRM migration blocked: required base table(s) are missing: %. Run the base schema bootstrap first.',
            missing_tables;
        END IF;
      END $$
    `),

    sql.query(`
      ALTER TABLE clients
        ADD COLUMN IF NOT EXISTS relationship_status text,
        ADD COLUMN IF NOT EXISTS next_touch timestamptz,
        ADD COLUMN IF NOT EXISTS notes text,
        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()
    `),

    sql.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id                    serial PRIMARY KEY,
        name                  text NOT NULL,
        email                 text NOT NULL,
        organization          text,
        phone                 text,
        service               text,
        message               text NOT NULL,
        source                text NOT NULL DEFAULT 'unknown',
        external_id           text,
        stage                 text NOT NULL DEFAULT 'new',
        estimated_value_cents integer,
        next_follow_up        timestamptz,
        notes                 text,
        client_id             integer REFERENCES clients(id) ON DELETE SET NULL,
        created_at            timestamptz NOT NULL DEFAULT now(),
        updated_at            timestamptz NOT NULL DEFAULT now()
      )
    `),

    sql.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS organization text,
        ADD COLUMN IF NOT EXISTS phone text,
        ADD COLUMN IF NOT EXISTS service text,
        ADD COLUMN IF NOT EXISTS source text DEFAULT 'unknown',
        ADD COLUMN IF NOT EXISTS external_id text,
        ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new',
        ADD COLUMN IF NOT EXISTS estimated_value_cents integer,
        ADD COLUMN IF NOT EXISTS next_follow_up timestamptz,
        ADD COLUMN IF NOT EXISTS notes text,
        ADD COLUMN IF NOT EXISTS client_id integer REFERENCES clients(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()
    `),

    sql.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS lead_id integer REFERENCES leads(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS source text,
        ADD COLUMN IF NOT EXISTS external_id text,
        ADD COLUMN IF NOT EXISTS proposal_sent_at timestamptz,
        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
        ADD COLUMN IF NOT EXISTS docuseal_submission_id text,
        ADD COLUMN IF NOT EXISTS signed_pdf_base64 text,
        ADD COLUMN IF NOT EXISTS signed_at timestamptz,
        ADD COLUMN IF NOT EXISTS start_date date,
        ADD COLUMN IF NOT EXISTS end_date date
    `),

    sql.query(`
      ALTER TABLE intake_submissions
        ADD COLUMN IF NOT EXISTS lead_id integer REFERENCES leads(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS source text DEFAULT 'legacy_intake',
        ADD COLUMN IF NOT EXISTS external_id text,
        ADD COLUMN IF NOT EXISTS platform_preference text,
        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()
    `),

    sql.query(`
      DO $$
      DECLARE duplicate_groups integer;
      BEGIN
        SELECT count(*) INTO duplicate_groups
        FROM (
          SELECT lower(btrim(email))
          FROM clients
          GROUP BY lower(btrim(email))
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_groups > 0 THEN
          RAISE EXCEPTION
            'CRM migration blocked: % case-insensitive duplicate client email group(s) must be merged before migration.',
            duplicate_groups;
        END IF;
      END $$
    `),

    sql.query(`
      DO $$
      DECLARE invalid_projects integer;
      BEGIN
        SELECT count(*) INTO invalid_projects
        FROM projects
        WHERE status IS NULL
           OR lower(btrim(status)) NOT IN (
             'proposal', 'signed', 'active', 'canceled', 'cancelled',
             'intake', 'pending', 'closed'
           );

        IF invalid_projects > 0 THEN
          RAISE EXCEPTION
            'CRM migration blocked: % project row(s) use an unrecognized lifecycle status.',
            invalid_projects;
        END IF;
      END $$
    `),

    sql.query(`
      DO $$
      DECLARE duplicate_keys integer;
      BEGIN
        SELECT count(*) INTO duplicate_keys
        FROM (
          SELECT lower(btrim(source)) AS source, btrim(external_id) AS external_id
          FROM leads
          WHERE NULLIF(btrim(external_id), '') IS NOT NULL
          GROUP BY lower(btrim(source)), btrim(external_id)
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_keys > 0 THEN
          RAISE EXCEPTION
            'CRM migration blocked: % duplicate lead source/external-id key(s) must be resolved.',
            duplicate_keys;
        END IF;

        SELECT count(*) INTO duplicate_keys
        FROM (
          SELECT lower(btrim(source)) AS source, btrim(external_id) AS external_id
          FROM projects
          WHERE NULLIF(btrim(external_id), '') IS NOT NULL
          GROUP BY lower(btrim(source)), btrim(external_id)
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_keys > 0 THEN
          RAISE EXCEPTION
            'CRM migration blocked: % duplicate project source/external-id key(s) must be resolved.',
            duplicate_keys;
        END IF;

        SELECT count(*) INTO duplicate_keys
        FROM (
          SELECT lower(btrim(source)) AS source, btrim(external_id) AS external_id
          FROM intake_submissions
          WHERE NULLIF(btrim(external_id), '') IS NOT NULL
          GROUP BY lower(btrim(source)), btrim(external_id)
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_keys > 0 THEN
          RAISE EXCEPTION
            'CRM migration blocked: % duplicate intake source/external-id key(s) must be resolved.',
            duplicate_keys;
        END IF;

        SELECT count(*) INTO duplicate_keys
        FROM (
          SELECT docuseal_submission_id
          FROM projects
          WHERE docuseal_submission_id IS NOT NULL
          GROUP BY docuseal_submission_id
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_keys > 0 THEN
          RAISE EXCEPTION
            'CRM migration blocked: % duplicate DocuSeal submission id(s) must be resolved.',
            duplicate_keys;
        END IF;

        SELECT count(*) INTO duplicate_keys
        FROM (
          SELECT stripe_invoice_id
          FROM invoices
          WHERE stripe_invoice_id IS NOT NULL
          GROUP BY stripe_invoice_id
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_keys > 0 THEN
          RAISE EXCEPTION
            'CRM migration blocked: % duplicate Stripe invoice id(s) must be resolved.',
            duplicate_keys;
        END IF;
      END $$
    `),

    sql.query(`
      UPDATE clients
      SET relationship_status = COALESCE(NULLIF(lower(btrim(relationship_status)), ''), 'active'),
          updated_at = COALESCE(updated_at, created_at, now())
    `),

    sql.query(`
      UPDATE projects
      SET status = CASE lower(btrim(status))
          WHEN 'intake' THEN 'proposal'
          WHEN 'pending' THEN 'proposal'
          WHEN 'closed' THEN 'canceled'
          WHEN 'cancelled' THEN 'canceled'
          ELSE lower(btrim(status))
        END,
        source = NULLIF(lower(btrim(source)), ''),
        external_id = NULLIF(btrim(external_id), ''),
        updated_at = COALESCE(updated_at, created_at, now())
    `),

    sql.query(`
      UPDATE leads
      SET source = COALESCE(NULLIF(lower(btrim(source)), ''), 'unknown'),
          external_id = NULLIF(btrim(external_id), ''),
          stage = COALESCE(NULLIF(lower(btrim(stage)), ''), 'new'),
          created_at = COALESCE(created_at, now()),
          updated_at = COALESCE(updated_at, created_at, now())
    `),

    sql.query(`
      UPDATE intake_submissions
      SET source = COALESCE(NULLIF(lower(btrim(source)), ''), 'legacy_intake'),
          external_id = NULLIF(btrim(external_id), ''),
          updated_at = COALESCE(updated_at, submitted_at, now())
    `),

    sql.query(`
      ALTER TABLE clients
        ALTER COLUMN relationship_status SET DEFAULT 'prospect',
        ALTER COLUMN relationship_status SET NOT NULL,
        ALTER COLUMN updated_at SET DEFAULT now(),
        ALTER COLUMN updated_at SET NOT NULL
    `),

    sql.query(`
      ALTER TABLE projects
        ALTER COLUMN status SET DEFAULT 'proposal',
        ALTER COLUMN updated_at SET DEFAULT now(),
        ALTER COLUMN updated_at SET NOT NULL
    `),

    sql.query(`
      ALTER TABLE leads
        ALTER COLUMN source SET DEFAULT 'unknown',
        ALTER COLUMN source SET NOT NULL,
        ALTER COLUMN stage SET DEFAULT 'new',
        ALTER COLUMN stage SET NOT NULL,
        ALTER COLUMN created_at SET DEFAULT now(),
        ALTER COLUMN created_at SET NOT NULL,
        ALTER COLUMN updated_at SET DEFAULT now(),
        ALTER COLUMN updated_at SET NOT NULL
    `),

    sql.query(`
      ALTER TABLE intake_submissions
        ALTER COLUMN source SET DEFAULT 'legacy_intake',
        ALTER COLUMN source SET NOT NULL,
        ALTER COLUMN updated_at SET DEFAULT now(),
        ALTER COLUMN updated_at SET NOT NULL
    `),

    sql.query(`ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_relationship_status_check`),
    sql.query(`
      ALTER TABLE clients ADD CONSTRAINT clients_relationship_status_check
        CHECK (relationship_status IN ('prospect', 'active', 'on_hold', 'complete', 'archived'))
    `),
    sql.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check`),
    sql.query(`
      ALTER TABLE projects ADD CONSTRAINT projects_status_check
        CHECK (status IN ('intake', 'proposal', 'signed', 'active', 'canceled'))
    `),
    sql.query(`ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check`),
    sql.query(`
      ALTER TABLE leads ADD CONSTRAINT leads_stage_check
        CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'))
    `),
    sql.query(`ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check`),
    sql.query(`
      ALTER TABLE leads ADD CONSTRAINT leads_source_check
        CHECK (btrim(source) <> '')
    `),
    sql.query(`ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_external_key_check`),
    sql.query(`
      ALTER TABLE leads ADD CONSTRAINT leads_external_key_check
        CHECK (external_id IS NULL OR (btrim(source) <> '' AND btrim(external_id) <> ''))
    `),
    sql.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_external_key_check`),
    sql.query(`
      ALTER TABLE projects ADD CONSTRAINT projects_external_key_check
        CHECK (external_id IS NULL OR (source IS NOT NULL AND btrim(source) <> '' AND btrim(external_id) <> ''))
    `),
    sql.query(`ALTER TABLE intake_submissions DROP CONSTRAINT IF EXISTS intake_external_key_check`),
    sql.query(`
      ALTER TABLE intake_submissions ADD CONSTRAINT intake_external_key_check
        CHECK (external_id IS NULL OR (btrim(source) <> '' AND btrim(external_id) <> ''))
    `),

    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS clients_email_normalized_uidx
        ON clients ((lower(btrim(email))))
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS clients_relationship_status_idx
        ON clients (relationship_status)
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS clients_next_touch_idx
        ON clients (next_touch) WHERE next_touch IS NOT NULL
    `),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS leads_source_external_uidx
        ON leads (source, external_id) WHERE external_id IS NOT NULL
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS leads_email_normalized_idx
        ON leads ((lower(btrim(email))))
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS leads_stage_follow_up_idx
        ON leads (stage, next_follow_up)
    `),
    sql.query(`CREATE INDEX IF NOT EXISTS leads_client_id_idx ON leads (client_id)`),
    sql.query(`CREATE INDEX IF NOT EXISTS projects_lead_id_idx ON projects (lead_id)`),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS projects_source_external_uidx
        ON projects (source, external_id) WHERE external_id IS NOT NULL
    `),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS projects_docuseal_submission_uidx
        ON projects (docuseal_submission_id) WHERE docuseal_submission_id IS NOT NULL
    `),
    sql.query(`
      CREATE INDEX IF NOT EXISTS intake_submissions_lead_id_idx
        ON intake_submissions (lead_id)
    `),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS intake_source_external_uidx
        ON intake_submissions (source, external_id) WHERE external_id IS NOT NULL
    `),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS invoices_stripe_invoice_uidx
        ON invoices (stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL
    `),
  ],
}
