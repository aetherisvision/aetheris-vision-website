import type { DatabaseMigration } from './types'

export const depositLifecycleMigration: DatabaseMigration = {
  id: '003_deposit_lifecycle',
  description: 'Add a project deposit amount and one idempotent deposit invoice per project',
  up: (sql) => [
    sql.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS deposit_amount_cents integer
    `),
    sql.query(`
      ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS purpose text
    `),
    sql.query(`
      UPDATE invoices
      SET purpose = NULLIF(lower(btrim(purpose)), '')
      WHERE purpose IS NOT NULL
    `),
    sql.query(`
      DO $$
      DECLARE invalid_rows integer;
              duplicate_groups integer;
      BEGIN
        SELECT count(*) INTO invalid_rows
        FROM projects
        WHERE deposit_amount_cents IS NOT NULL AND deposit_amount_cents <= 0;

        IF invalid_rows > 0 THEN
          RAISE EXCEPTION
            'Deposit migration blocked: % project deposit amount(s) are not positive.',
            invalid_rows;
        END IF;

        SELECT count(*) INTO invalid_rows
        FROM invoices
        WHERE purpose IS NOT NULL AND purpose <> 'deposit';

        IF invalid_rows > 0 THEN
          RAISE EXCEPTION
            'Deposit migration blocked: % invoice row(s) use an unsupported purpose.',
            invalid_rows;
        END IF;

        SELECT count(*) INTO invalid_rows
        FROM invoices
        WHERE purpose = 'deposit' AND amount_cents <= 0;

        IF invalid_rows > 0 THEN
          RAISE EXCEPTION
            'Deposit migration blocked: % deposit invoice amount(s) are not positive.',
            invalid_rows;
        END IF;

        SELECT count(*) INTO duplicate_groups
        FROM (
          SELECT project_id, purpose
          FROM invoices
          WHERE project_id IS NOT NULL AND purpose IS NOT NULL
          GROUP BY project_id, purpose
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_groups > 0 THEN
          RAISE EXCEPTION
            'Deposit migration blocked: % project/purpose invoice duplicate group(s) must be resolved.',
            duplicate_groups;
        END IF;
      END $$
    `),
    sql.query(`
      UPDATE projects
      SET deposit_amount_cents = invoices.amount_cents,
          updated_at = now()
      FROM invoices
      WHERE invoices.project_id = projects.id
        AND invoices.purpose = 'deposit'
        AND projects.deposit_amount_cents IS NULL
    `),
    sql.query(`
      DO $$
      DECLARE mismatch_rows integer;
      BEGIN
        SELECT count(*) INTO mismatch_rows
        FROM invoices
        JOIN projects ON projects.id = invoices.project_id
        WHERE invoices.purpose = 'deposit'
          AND invoices.amount_cents <> projects.deposit_amount_cents;

        IF mismatch_rows > 0 THEN
          RAISE EXCEPTION
            'Deposit migration blocked: % deposit invoice(s) disagree with the project deposit amount.',
            mismatch_rows;
        END IF;
      END $$
    `),
    sql.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_deposit_amount_check`),
    sql.query(`
      ALTER TABLE projects ADD CONSTRAINT projects_deposit_amount_check
        CHECK (deposit_amount_cents IS NULL OR deposit_amount_cents > 0)
    `),
    sql.query(`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_purpose_check`),
    sql.query(`
      ALTER TABLE invoices ADD CONSTRAINT invoices_purpose_check
        CHECK (purpose IS NULL OR (purpose = 'deposit' AND amount_cents > 0))
    `),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS invoices_project_purpose_uidx
        ON invoices (project_id, purpose)
        WHERE project_id IS NOT NULL AND purpose IS NOT NULL
    `),
  ],
}
