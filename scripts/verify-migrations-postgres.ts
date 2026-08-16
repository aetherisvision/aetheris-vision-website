import { Client, type QueryResultRow } from 'pg'

import { crmPipelineMigration } from '../src/lib/db/migrations/001_crm_pipeline'
import { clientFollowUpMigration } from '../src/lib/db/migrations/002_client_follow_up'
import { depositLifecycleMigration } from '../src/lib/db/migrations/003_deposit_lifecycle'
import { invoiceDeliveryMigration } from '../src/lib/db/migrations/004_invoice_delivery'
import { contactVerificationMigration } from '../src/lib/db/migrations/005_contact_verification'
import { buildGuardedMigrationSql } from '../src/lib/db/migrations/execution'
import type { DatabaseMigration } from '../src/lib/db/migrations/types'

const migrations: readonly DatabaseMigration[] = [
  crmPipelineMigration,
  clientFollowUpMigration,
  depositLifecycleMigration,
  invoiceDeliveryMigration,
  contactVerificationMigration,
]

const requiredIndexes = [
  'clients_email_normalized_uidx',
  'clients_next_touch_idx',
  'leads_source_external_uidx',
  'projects_source_external_uidx',
  'projects_docuseal_submission_uidx',
  'intake_source_external_uidx',
  'invoices_project_purpose_uidx',
  'invoices_number_uidx',
  'invoices_notification_idempotency_uidx',
  'contact_verification_purpose_submission_uidx',
  'contact_verification_expires_at_idx',
] as const

const requiredConstraints = [
  'clients_relationship_status_check',
  'projects_status_check',
  'leads_stage_check',
  'projects_deposit_amount_check',
  'invoices_purpose_check',
  'invoices_notification_state_check',
  'contact_verification_purpose_check',
  'contact_verification_submission_id_check',
  'contact_verification_email_hash_check',
  'contact_verification_code_hash_check',
  'contact_verification_attempts_check',
  'contact_verification_expiry_check',
  'contact_verification_state_check',
] as const

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function localVerificationUrl(): string {
  const connectionString = process.env.MIGRATION_VERIFY_DATABASE_URL
  if (!connectionString) {
    throw new Error('MIGRATION_VERIFY_DATABASE_URL is required')
  }

  const url = new URL(connectionString)
  const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])
  assert(loopbackHosts.has(url.hostname), 'Migration verification refuses non-loopback databases')
  assert(url.pathname === '/avcrm', 'Migration verification requires the disposable avcrm database')
  return connectionString
}

async function resetToLegacySchema(client: Client) {
  await client.query('DROP SCHEMA public CASCADE')
  await client.query('CREATE SCHEMA public')
  await client.query(`
    CREATE TABLE clients (
      id                 serial PRIMARY KEY,
      name               text NOT NULL,
      contact_name       text NOT NULL,
      email              text NOT NULL,
      phone              text,
      address            text,
      stripe_customer_id text,
      created_at         timestamptz DEFAULT now()
    )
  `)
  await client.query(`
    CREATE TABLE projects (
      id         serial PRIMARY KEY,
      client_id  integer REFERENCES clients(id),
      name       text NOT NULL,
      status     text NOT NULL DEFAULT 'intake',
      created_at timestamptz DEFAULT now()
    )
  `)
  await client.query(`
    CREATE TABLE intake_submissions (
      id            serial PRIMARY KEY,
      client_id     integer REFERENCES clients(id) ON DELETE SET NULL,
      project_id    integer REFERENCES projects(id) ON DELETE SET NULL,
      status        text NOT NULL DEFAULT 'new',
      company_name  text NOT NULL,
      contact_name  text NOT NULL,
      contact_email text NOT NULL,
      submitted_at  timestamptz DEFAULT now()
    )
  `)
  await client.query(`
    CREATE TABLE invoices (
      id                 serial PRIMARY KEY,
      client_id          integer REFERENCES clients(id) ON DELETE CASCADE,
      project_id         integer REFERENCES projects(id) ON DELETE SET NULL,
      number             text NOT NULL,
      description        text NOT NULL,
      amount_cents       integer NOT NULL,
      status             text NOT NULL DEFAULT 'draft',
      stripe_invoice_id  text,
      stripe_invoice_url text,
      due_date           date,
      paid_at            timestamptz,
      created_at         timestamptz DEFAULT now()
    )
  `)
}

async function ensureLedger(client: Client) {
  await client.query('BEGIN ISOLATION LEVEL READ COMMITTED')
  try {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('aetherisvision-schema-migrations-ledger'))",
    )
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          text PRIMARY KEY,
        description text NOT NULL,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )
    `)
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function runMigrations(client: Client) {
  await ensureLedger(client)

  for (const migration of migrations) {
    const applied = await client.query<{ id: string }>(
      'SELECT id FROM schema_migrations WHERE id = $1',
      [migration.id],
    )
    if (applied.rowCount) continue

    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    try {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext('aetherisvision-schema-migrations'), hashtext($1))",
        [migration.id],
      )
      await client.query(buildGuardedMigrationSql(migration))
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
}

async function waitForAdvisoryWaiter(client: Client, waitingPid: number) {
  const deadline = Date.now() + 2_000
  while (Date.now() < deadline) {
    const result = await client.query<{ waiting: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM pg_locks
         WHERE pid = $1
           AND locktype = 'advisory'
           AND NOT granted
       ) AS waiting`,
      [waitingPid],
    )
    if (result.rows[0]?.waiting) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  throw new Error('Concurrent migration verifier did not observe the second runner waiting')
}

async function oneRow<Row extends QueryResultRow>(client: Client, text: string): Promise<Row> {
  const result = await client.query<Row>(text)
  assert(result.rows.length === 1, `Expected one row from verification query: ${text}`)
  return result.rows[0]
}

async function verifySchema(client: Client) {
  const ledger = await oneRow<{ count: string }>(
    client,
    'SELECT count(*)::text AS count FROM schema_migrations',
  )
  assert(Number(ledger.count) === migrations.length, 'Migration ledger is incomplete')

  const indexes = await client.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
  )
  const indexNames = new Set(indexes.rows.map((row) => row.indexname))
  for (const index of requiredIndexes) {
    assert(indexNames.has(index), `Missing required index ${index}`)
  }

  const constraints = await client.query<{ conname: string }>(
    `SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace`,
  )
  const constraintNames = new Set(constraints.rows.map((row) => row.conname))
  for (const constraint of requiredConstraints) {
    assert(constraintNames.has(constraint), `Missing required constraint ${constraint}`)
  }

  const columns = await client.query<{ column_name: string; table_name: string }>(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'clients',
        'leads',
        'contact_verification_challenges',
        'projects',
        'intake_submissions',
        'invoices'
      )
  `)
  const columnNames = new Set(columns.rows.map((row) => `${row.table_name}.${row.column_name}`))
  for (const column of [
    'clients.relationship_status',
    'clients.next_touch',
    'clients.notes',
    'leads.stage',
    'leads.location',
    'leads.email_verified_at',
    'contact_verification_challenges.id',
    'contact_verification_challenges.purpose',
    'contact_verification_challenges.submission_id',
    'contact_verification_challenges.email_hash',
    'contact_verification_challenges.code_hash',
    'contact_verification_challenges.attempts',
    'contact_verification_challenges.expires_at',
    'contact_verification_challenges.verified_at',
    'contact_verification_challenges.completed_at',
    'contact_verification_challenges.created_at',
    'contact_verification_challenges.updated_at',
    'projects.lead_id',
    'projects.deposit_amount_cents',
    'intake_submissions.lead_id',
    'invoices.purpose',
    'invoices.notification_idempotency_key',
  ]) {
    assert(columnNames.has(column), `Missing required column ${column}`)
  }

  const defaults = await oneRow<{
    client_default: string | null
    project_default: string | null
  }>(
    client,
    `SELECT
       (SELECT column_default FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients'
          AND column_name = 'relationship_status') AS client_default,
       (SELECT column_default FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects'
          AND column_name = 'status') AS project_default`,
  )
  assert(defaults.client_default?.includes('prospect'), 'New clients must default to prospect')
  assert(defaults.project_default?.includes('proposal'), 'New projects must default to proposal')
}

async function verifyEmptyLegacyDatabase(client: Client) {
  await resetToLegacySchema(client)
  await runMigrations(client)
  await runMigrations(client)
  await verifySchema(client)

  const clientInsert = await oneRow<{ id: number; relationship_status: string }>(
    client,
    `INSERT INTO clients (name, contact_name, email)
     VALUES ('New Account', 'New Contact', 'new@example.test')
     RETURNING id, relationship_status`,
  )
  assert(clientInsert.relationship_status === 'prospect', 'Fresh client default is not prospect')

  const projectInserts = await client.query<{ status: string }>(
    `INSERT INTO projects (client_id, name, status)
     VALUES
       ($1, 'Legacy writer project', 'intake'),
       ($1, 'CRM writer project', 'proposal')
     RETURNING status`,
    [clientInsert.id],
  )
  const acceptedProjectStatuses = new Set(projectInserts.rows.map((row) => row.status))
  assert(
    acceptedProjectStatuses.has('intake') && acceptedProjectStatuses.has('proposal'),
    'Expand-first project status constraint must accept both intake and proposal',
  )

  console.log('✓ Empty legacy schema migrates cleanly and accepts old and new project writers')
}

async function verifyRepresentativeLegacyDatabase(client: Client) {
  await resetToLegacySchema(client)
  await client.query(`
    INSERT INTO clients (id, name, contact_name, email)
    VALUES (1, 'Legacy Customer', 'Casey Client', 'Casey@Example.test')
  `)
  await client.query(`
    INSERT INTO projects (id, client_id, name, status)
    VALUES
      (1, 1, 'Pending engagement', 'intake'),
      (2, 1, 'Completed legacy engagement', 'closed')
  `)
  await client.query(`
    INSERT INTO intake_submissions (
      id, client_id, project_id, status, company_name, contact_name, contact_email
    ) VALUES (
      1, 1, 1, 'new', 'Legacy Customer', 'Casey Client', 'Casey@Example.test'
    )
  `)
  await client.query(`
    INSERT INTO invoices (
      id, client_id, project_id, number, description, amount_cents, status
    ) VALUES (
      1, 1, 1, 'INV-202607-0042', 'Legacy invoice', 125000, 'draft'
    )
  `)

  await runMigrations(client)
  const appliedBeforeRerun = await client.query<{ id: string; applied_at: Date }>(
    'SELECT id, applied_at FROM schema_migrations ORDER BY id',
  )
  await runMigrations(client)
  const appliedAfterRerun = await client.query<{ id: string; applied_at: Date }>(
    'SELECT id, applied_at FROM schema_migrations ORDER BY id',
  )

  await verifySchema(client)
  assert(
    JSON.stringify(appliedAfterRerun.rows) === JSON.stringify(appliedBeforeRerun.rows),
    'A migration rerun changed the ledger',
  )

  const lifecycle = await oneRow<{
    client_status: string
    current_status: string
    closed_status: string
    intake_source: string
  }>(
    client,
    `SELECT
       (SELECT relationship_status FROM clients WHERE id = 1) AS client_status,
       (SELECT status FROM projects WHERE id = 1) AS current_status,
       (SELECT status FROM projects WHERE id = 2) AS closed_status,
       (SELECT source FROM intake_submissions WHERE id = 1) AS intake_source`,
  )
  assert(lifecycle.client_status === 'active', 'Legacy clients must remain active')
  assert(lifecycle.current_status === 'proposal', 'Legacy intake projects must become proposals')
  assert(lifecycle.closed_status === 'canceled', 'Legacy closed projects must become canceled')
  assert(lifecycle.intake_source === 'legacy_intake', 'Legacy intake source was not backfilled')

  const sequence = await oneRow<{ next_number: string }>(
    client,
    `SELECT nextval('invoice_number_seq')::text AS next_number`,
  )
  assert(Number(sequence.next_number) > 42, 'Invoice sequence did not advance past legacy numbers')

  console.log('✓ Representative records migrate without lifecycle or numbering regressions')
}

async function verifyConcurrentLedgerCreation(
  client: Client,
  secondClient: Client,
  secondPid: number,
) {
  let firstTransactionOpen = false
  let secondTransactionOpen = false
  let secondLock: Promise<unknown> | undefined

  try {
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    firstTransactionOpen = true
    await secondClient.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    secondTransactionOpen = true

    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('aetherisvision-schema-migrations-ledger'))",
    )
    secondLock = secondClient.query(
      "SELECT pg_advisory_xact_lock(hashtext('aetherisvision-schema-migrations-ledger'))",
    )
    await waitForAdvisoryWaiter(client, secondPid)

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          text PRIMARY KEY,
        description text NOT NULL,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )
    `)
    await client.query('COMMIT')
    firstTransactionOpen = false

    await secondLock
    await secondClient.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          text PRIMARY KEY,
        description text NOT NULL,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )
    `)
    await secondClient.query('COMMIT')
    secondTransactionOpen = false

    const ledger = await oneRow<{ exists: boolean; count: string }>(
      client,
      `SELECT to_regclass('public.schema_migrations') IS NOT NULL AS exists,
              (SELECT count(*)::text FROM schema_migrations) AS count`,
    )
    assert(ledger.exists, 'Concurrent runners did not create the migration ledger')
    assert(Number(ledger.count) === 0, 'Migration ledger was unexpectedly populated')
  } catch (error) {
    if (firstTransactionOpen) await client.query('ROLLBACK').catch(() => undefined)
    if (secondLock) await secondLock.catch(() => undefined)
    if (secondTransactionOpen) await secondClient.query('ROLLBACK').catch(() => undefined)
    throw error
  }
}

async function verifyConcurrentMigrationRunners(client: Client, connectionString: string) {
  await resetToLegacySchema(client)

  const secondClient = new Client({ connectionString })
  await secondClient.connect()

  const migration = migrations[0]
  let firstTransactionOpen = false
  let secondTransactionOpen = false
  let secondLock: Promise<unknown> | undefined

  try {
    const secondPid = await oneRow<{ pid: number }>(
      secondClient,
      'SELECT pg_backend_pid() AS pid',
    )

    await verifyConcurrentLedgerCreation(client, secondClient, secondPid.pid)

    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    firstTransactionOpen = true
    await secondClient.query('BEGIN ISOLATION LEVEL READ COMMITTED')
    secondTransactionOpen = true

    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('aetherisvision-schema-migrations'), hashtext($1))",
      [migration.id],
    )
    secondLock = secondClient.query(
      "SELECT pg_advisory_xact_lock(hashtext('aetherisvision-schema-migrations'), hashtext($1))",
      [migration.id],
    )
    await waitForAdvisoryWaiter(client, secondPid.pid)

    await client.query(buildGuardedMigrationSql(migration))
    await client.query('COMMIT')
    firstTransactionOpen = false

    await secondLock
    await secondClient.query(buildGuardedMigrationSql(migration))
    await secondClient.query('COMMIT')
    secondTransactionOpen = false

    const ledger = await oneRow<{ count: string }>(
      client,
      `SELECT count(*)::text AS count
       FROM schema_migrations
       WHERE id = '${migration.id}'`,
    )
    assert(Number(ledger.count) === 1, 'Concurrent migration runners duplicated the ledger entry')

    await runMigrations(client)
    await verifySchema(client)
    console.log(
      '✓ Concurrent runners serialize ledger creation and recheck migrations after waiting',
    )
  } catch (error) {
    if (firstTransactionOpen) {
      await client.query('ROLLBACK').catch(() => undefined)
      firstTransactionOpen = false
    }
    if (secondLock) await secondLock.catch(() => undefined)
    if (secondTransactionOpen) {
      await secondClient.query('ROLLBACK').catch(() => undefined)
      secondTransactionOpen = false
    }
    throw error
  } finally {
    await secondClient.end()
  }
}

async function main() {
  const connectionString = localVerificationUrl()
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const database = await oneRow<{ database_name: string }>(
      client,
      'SELECT current_database() AS database_name',
    )
    assert(database.database_name === 'avcrm', 'Connected database is not the disposable avcrm database')

    await verifyEmptyLegacyDatabase(client)
    await verifyRepresentativeLegacyDatabase(client)
    await verifyConcurrentMigrationRunners(client, connectionString)
    console.log(`✓ ${migrations.length} CRM migrations verified against disposable PostgreSQL`)
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
