import { sql } from '../index'
import { crmPipelineMigration } from './001_crm_pipeline'
import { clientFollowUpMigration } from './002_client_follow_up'
import { depositLifecycleMigration } from './003_deposit_lifecycle'
import { invoiceDeliveryMigration } from './004_invoice_delivery'
import { contactVerificationMigration } from './005_contact_verification'
import { buildGuardedMigrationSql } from './execution'
import type { DatabaseMigration } from './types'

const migrations: readonly DatabaseMigration[] = [
  crmPipelineMigration,
  clientFollowUpMigration,
  depositLifecycleMigration,
  invoiceDeliveryMigration,
  contactVerificationMigration,
]

const requiredColumns = [
  'clients.relationship_status',
  'clients.next_touch',
  'clients.notes',
  'clients.updated_at',
  'leads.id',
  'leads.source',
  'leads.external_id',
  'leads.stage',
  'leads.client_id',
  'leads.location',
  'leads.email_verified_at',
  'leads.updated_at',
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
  'projects.source',
  'projects.external_id',
  'projects.proposal_sent_at',
  'projects.deposit_amount_cents',
  'projects.updated_at',
  'intake_submissions.lead_id',
  'intake_submissions.source',
  'intake_submissions.external_id',
  'intake_submissions.updated_at',
  'invoices.project_id',
  'invoices.purpose',
  'invoices.notification_idempotency_key',
  'invoices.notification_sent_at',
] as const

const requiredIndexes = [
  'clients_email_normalized_uidx',
  'clients_next_touch_idx',
  'leads_source_external_uidx',
  'leads_stage_follow_up_idx',
  'contact_verification_purpose_submission_uidx',
  'contact_verification_expires_at_idx',
  'projects_lead_id_idx',
  'projects_source_external_uidx',
  'projects_docuseal_submission_uidx',
  'intake_submissions_lead_id_idx',
  'intake_source_external_uidx',
  'invoices_stripe_invoice_uidx',
  'invoices_project_purpose_uidx',
  'invoices_number_uidx',
  'invoices_notification_idempotency_uidx',
] as const

const requiredConstraints = [
  'clients_relationship_status_check',
  'projects_status_check',
  'leads_stage_check',
  'leads_source_check',
  'leads_external_key_check',
  'projects_external_key_check',
  'intake_external_key_check',
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

interface MigrationRow {
  id: string
}

interface ColumnRow {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: 'YES' | 'NO'
  column_default: string | null
}

interface IndexRow {
  indexname: string
}

interface ConstraintRow {
  conname: string
}

interface IntegrityRow {
  missing_invoice_number_sequence: number
  duplicate_client_emails: number
  invalid_client_statuses: number
  invalid_project_statuses: number
  invalid_lead_stages: number
  duplicate_lead_external_keys: number
  duplicate_project_external_keys: number
  duplicate_intake_external_keys: number
  invalid_project_deposits: number
  invalid_invoice_purposes: number
  duplicate_invoice_purposes: number
  deposit_invoice_amount_mismatches: number
  duplicate_invoice_numbers: number
  duplicate_invoice_notification_keys: number
  invalid_invoice_notification_states: number
  invalid_contact_verification_states: number
  duplicate_contact_verification_bindings: number
}

export interface MigrationVerification {
  appliedMigrations: string[]
  verifiedColumns: number
  verifiedIndexes: number
  verifiedConstraints: number
}

async function ensureMigrationLedger() {
  await sql.transaction(
    (transactionSql) => [
      transactionSql.query(
        "SELECT pg_advisory_xact_lock(hashtext('aetherisvision-schema-migrations-ledger'))",
      ),
      transactionSql.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id          text PRIMARY KEY,
          description text NOT NULL,
          applied_at  timestamptz NOT NULL DEFAULT now()
        )
      `),
    ],
    { isolationLevel: 'ReadCommitted' },
  )
}

export async function verifyCrmSchema(): Promise<MigrationVerification> {
  const [columnRows, indexRows, constraintRows, integrityRows, appliedRows] = await Promise.all([
    sql`
      SELECT table_name, column_name, data_type, is_nullable, column_default
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
    `,
    sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `,
    sql`
      SELECT conname
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
    `,
    sql`
      SELECT
        CASE WHEN to_regclass('public.invoice_number_seq') IS NULL THEN 1 ELSE 0 END
          AS missing_invoice_number_sequence,
        (
          SELECT count(*)::integer
          FROM (
            SELECT lower(btrim(email))
            FROM clients
            GROUP BY lower(btrim(email))
            HAVING count(*) > 1
          ) duplicates
        ) AS duplicate_client_emails,
        (SELECT count(*)::integer FROM clients
          WHERE relationship_status NOT IN ('prospect', 'active', 'on_hold', 'complete', 'archived'))
          AS invalid_client_statuses,
        (SELECT count(*)::integer FROM projects
          WHERE status NOT IN ('intake', 'proposal', 'signed', 'active', 'canceled'))
          AS invalid_project_statuses,
        (SELECT count(*)::integer FROM leads
          WHERE stage NOT IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'))
          AS invalid_lead_stages,
        (
          SELECT count(*)::integer
          FROM (
            SELECT source, external_id FROM leads
            WHERE external_id IS NOT NULL
            GROUP BY source, external_id HAVING count(*) > 1
          ) duplicates
        ) AS duplicate_lead_external_keys,
        (
          SELECT count(*)::integer
          FROM (
            SELECT source, external_id FROM projects
            WHERE external_id IS NOT NULL
            GROUP BY source, external_id HAVING count(*) > 1
          ) duplicates
        ) AS duplicate_project_external_keys,
        (
          SELECT count(*)::integer
          FROM (
            SELECT source, external_id FROM intake_submissions
            WHERE external_id IS NOT NULL
            GROUP BY source, external_id HAVING count(*) > 1
          ) duplicates
        ) AS duplicate_intake_external_keys,
        (SELECT count(*)::integer FROM projects
          WHERE deposit_amount_cents IS NOT NULL AND deposit_amount_cents <= 0)
          AS invalid_project_deposits,
        (SELECT count(*)::integer FROM invoices
          WHERE purpose IS NOT NULL AND (purpose <> 'deposit' OR amount_cents <= 0))
          AS invalid_invoice_purposes,
        (
          SELECT count(*)::integer
          FROM (
            SELECT project_id, purpose FROM invoices
            WHERE project_id IS NOT NULL AND purpose IS NOT NULL
            GROUP BY project_id, purpose HAVING count(*) > 1
          ) duplicates
        ) AS duplicate_invoice_purposes,
        (SELECT count(*)::integer
          FROM invoices
          JOIN projects ON projects.id = invoices.project_id
          WHERE invoices.purpose = 'deposit'
            AND invoices.amount_cents IS DISTINCT FROM projects.deposit_amount_cents)
          AS deposit_invoice_amount_mismatches,
        (
          SELECT count(*)::integer
          FROM (
            SELECT number FROM invoices
            GROUP BY number HAVING count(*) > 1
          ) duplicates
        ) AS duplicate_invoice_numbers,
        (
          SELECT count(*)::integer
          FROM (
            SELECT notification_idempotency_key FROM invoices
            WHERE notification_idempotency_key IS NOT NULL
            GROUP BY notification_idempotency_key HAVING count(*) > 1
          ) duplicates
        ) AS duplicate_invoice_notification_keys,
        (SELECT count(*)::integer FROM invoices
          WHERE (notification_idempotency_key IS NOT NULL
                   AND btrim(notification_idempotency_key) = '')
             OR (notification_sent_at IS NOT NULL
                   AND notification_idempotency_key IS NULL))
          AS invalid_invoice_notification_states,
        (SELECT count(*)::integer FROM contact_verification_challenges
          WHERE purpose NOT IN ('contact', 'intake')
             OR char_length(btrim(submission_id)) NOT BETWEEN 1 AND 128
             OR email_hash !~ '^[0-9a-f]{64}$'
             OR code_hash !~ '^[0-9a-f]{64}$'
             OR attempts NOT BETWEEN 0 AND 6
             OR expires_at <= created_at
             OR verified_at < created_at
             OR verified_at > expires_at
             OR (completed_at IS NOT NULL
                   AND (verified_at IS NULL
                     OR completed_at < verified_at
                     OR completed_at > expires_at)))
          AS invalid_contact_verification_states,
        (
          SELECT count(*)::integer
          FROM (
            SELECT purpose, submission_id
            FROM contact_verification_challenges
            GROUP BY purpose, submission_id
            HAVING count(*) > 1
          ) duplicates
        ) AS duplicate_contact_verification_bindings
    `,
    sql`SELECT id FROM schema_migrations ORDER BY id`,
  ])

  const columns = columnRows as ColumnRow[]
  const indexes = indexRows as IndexRow[]
  const constraints = constraintRows as ConstraintRow[]
  const integrity = (integrityRows as IntegrityRow[])[0]
  const applied = appliedRows as MigrationRow[]

  const presentColumns = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`))
  const presentIndexes = new Set(indexes.map((row) => row.indexname))
  const presentConstraints = new Set(constraints.map((row) => row.conname))
  const appliedIds = new Set(applied.map((row) => row.id))
  const errors: string[] = []

  for (const column of requiredColumns) {
    if (!presentColumns.has(column)) errors.push(`missing column ${column}`)
  }

  for (const index of requiredIndexes) {
    if (!presentIndexes.has(index)) errors.push(`missing index ${index}`)
  }

  for (const constraint of requiredConstraints) {
    if (!presentConstraints.has(constraint)) errors.push(`missing constraint ${constraint}`)
  }

  for (const migration of migrations) {
    if (!appliedIds.has(migration.id)) errors.push(`migration ${migration.id} is not recorded`)
  }

  const projectsLeadId = columns.find(
    (row) => row.table_name === 'projects' && row.column_name === 'lead_id',
  )
  const intakeLeadId = columns.find(
    (row) => row.table_name === 'intake_submissions' && row.column_name === 'lead_id',
  )
  const clientStatus = columns.find(
    (row) => row.table_name === 'clients' && row.column_name === 'relationship_status',
  )
  const clientNextTouch = columns.find(
    (row) => row.table_name === 'clients' && row.column_name === 'next_touch',
  )
  const clientNotes = columns.find(
    (row) => row.table_name === 'clients' && row.column_name === 'notes',
  )
  const projectStatus = columns.find(
    (row) => row.table_name === 'projects' && row.column_name === 'status',
  )
  const projectDepositAmount = columns.find(
    (row) => row.table_name === 'projects' && row.column_name === 'deposit_amount_cents',
  )
  const invoicePurpose = columns.find(
    (row) => row.table_name === 'invoices' && row.column_name === 'purpose',
  )
  const invoiceNotificationKey = columns.find(
    (row) => row.table_name === 'invoices' && row.column_name === 'notification_idempotency_key',
  )
  const invoiceNotificationSentAt = columns.find(
    (row) => row.table_name === 'invoices' && row.column_name === 'notification_sent_at',
  )
  const leadLocation = columns.find(
    (row) => row.table_name === 'leads' && row.column_name === 'location',
  )
  const leadEmailVerifiedAt = columns.find(
    (row) => row.table_name === 'leads' && row.column_name === 'email_verified_at',
  )
  const verificationId = columns.find(
    (row) => row.table_name === 'contact_verification_challenges' && row.column_name === 'id',
  )
  const verificationAttempts = columns.find(
    (row) =>
      row.table_name === 'contact_verification_challenges' && row.column_name === 'attempts',
  )
  const verificationExpiresAt = columns.find(
    (row) =>
      row.table_name === 'contact_verification_challenges' && row.column_name === 'expires_at',
  )

  if (projectsLeadId?.is_nullable !== 'YES') errors.push('projects.lead_id must remain nullable')
  if (intakeLeadId?.is_nullable !== 'YES') errors.push('intake_submissions.lead_id must remain nullable')
  if (
    !clientNextTouch ||
    clientNextTouch.data_type !== 'timestamp with time zone' ||
    clientNextTouch.is_nullable !== 'YES'
  ) {
    errors.push('clients.next_touch must be a nullable timestamptz')
  }
  if (!clientNotes || clientNotes.data_type !== 'text' || clientNotes.is_nullable !== 'YES') {
    errors.push('clients.notes must be nullable text')
  }
  if (!clientStatus?.column_default?.includes('prospect')) {
    errors.push('clients.relationship_status default must be prospect')
  }
  if (!projectStatus?.column_default?.includes('proposal')) {
    errors.push('projects.status default must be proposal')
  }
  if (
    !projectDepositAmount ||
    projectDepositAmount.data_type !== 'integer' ||
    projectDepositAmount.is_nullable !== 'YES'
  ) {
    errors.push('projects.deposit_amount_cents must be a nullable integer')
  }
  if (!invoicePurpose || invoicePurpose.data_type !== 'text' || invoicePurpose.is_nullable !== 'YES') {
    errors.push('invoices.purpose must be nullable text')
  }
  if (
    !invoiceNotificationKey ||
    invoiceNotificationKey.data_type !== 'text' ||
    invoiceNotificationKey.is_nullable !== 'YES'
  ) {
    errors.push('invoices.notification_idempotency_key must be nullable text')
  }
  if (
    !invoiceNotificationSentAt ||
    invoiceNotificationSentAt.data_type !== 'timestamp with time zone' ||
    invoiceNotificationSentAt.is_nullable !== 'YES'
  ) {
    errors.push('invoices.notification_sent_at must be a nullable timestamptz')
  }
  if (!leadLocation || leadLocation.data_type !== 'text' || leadLocation.is_nullable !== 'YES') {
    errors.push('leads.location must be nullable text')
  }
  if (
    !leadEmailVerifiedAt ||
    leadEmailVerifiedAt.data_type !== 'timestamp with time zone' ||
    leadEmailVerifiedAt.is_nullable !== 'YES'
  ) {
    errors.push('leads.email_verified_at must be a nullable timestamptz')
  }
  if (!verificationId || verificationId.data_type !== 'uuid' || verificationId.is_nullable !== 'NO') {
    errors.push('contact_verification_challenges.id must be a non-null uuid')
  }
  if (
    !verificationAttempts ||
    verificationAttempts.data_type !== 'integer' ||
    verificationAttempts.is_nullable !== 'NO' ||
    !verificationAttempts.column_default?.includes('0')
  ) {
    errors.push('contact_verification_challenges.attempts must be a non-null integer defaulting to 0')
  }
  if (
    !verificationExpiresAt ||
    verificationExpiresAt.data_type !== 'timestamp with time zone' ||
    verificationExpiresAt.is_nullable !== 'NO'
  ) {
    errors.push('contact_verification_challenges.expires_at must be a non-null timestamptz')
  }

  if (!integrity) {
    errors.push('integrity verification returned no result')
  } else {
    for (const [check, count] of Object.entries(integrity)) {
      if (count !== 0) errors.push(`${check}=${count}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`CRM schema verification failed: ${errors.join('; ')}`)
  }

  return {
    appliedMigrations: applied.map((row) => row.id),
    verifiedColumns: requiredColumns.length,
    verifiedIndexes: requiredIndexes.length,
    verifiedConstraints: requiredConstraints.length,
  }
}

export async function runMigrations(): Promise<MigrationVerification> {
  await ensureMigrationLedger()

  const appliedRows = (await sql`SELECT id FROM schema_migrations`) as MigrationRow[]
  const applied = new Set(appliedRows.map((row) => row.id))

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue

    await sql.transaction(
      (transactionSql) => [
        transactionSql.query(
          `SELECT pg_advisory_xact_lock(hashtext('aetherisvision-schema-migrations'), hashtext($1))`,
          [migration.id],
        ),
        transactionSql.query(buildGuardedMigrationSql(migration)),
      ],
      { isolationLevel: 'ReadCommitted' },
    )
  }

  return verifyCrmSchema()
}
