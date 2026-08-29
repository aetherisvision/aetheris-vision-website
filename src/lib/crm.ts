import { sql } from '@/lib/db'

export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const
export const PROJECT_LIFECYCLE_STATUSES = ['proposal', 'signed', 'active', 'canceled'] as const
export const INVOICE_PURPOSES = ['deposit'] as const
export const CLIENT_RELATIONSHIP_STATUSES = [
  'prospect',
  'active',
  'on_hold',
  'complete',
  'archived',
] as const

export type LeadStage = (typeof LEAD_STAGES)[number]
export type ManualLeadStage = Exclude<LeadStage, 'won'>
export type ProjectLifecycleStatus = (typeof PROJECT_LIFECYCLE_STATUSES)[number]
export type InvoicePurpose = (typeof INVOICE_PURPOSES)[number]
export type ClientRelationshipStatus = (typeof CLIENT_RELATIONSHIP_STATUSES)[number]

export interface ContactLeadInput {
  name: string
  email: string
  message: string
  emailVerifiedAt: Date | string
  /** Optional client-supplied city, state/province, or operating region. */
  coarseLocation?: string | null
  organization?: string | null
  phone?: string | null
  service?: string | null
  source?: string
  externalRef?: string | null
}

export interface LeadCaptureResult {
  leadId: number
  stage: LeadStage
  created: boolean
}

/**
 * A government-contracting lead surfaced by opportunity-radar (a SAM.gov/
 * HigherGov/etc. solicitation, or a utility/insurer BD contact) -- not a
 * website visitor. Deliberately has no emailVerifiedAt: there is no human
 * submitting a form to verify. contactEmail is optional because many
 * government notices simply don't list one.
 */
export interface GovconLeadInput {
  /** Solicitation title or the contact's organization name -- becomes leads.name. */
  title: string
  agency?: string | null
  externalRef: string
  contactEmail?: string | null
  contactPhone?: string | null
  estimatedValueCents?: number | null
  /** Response deadline, or next planned outreach touch. */
  nextFollowUp?: Date | string | null
  notes?: string | null
  /** NAICS/PSC/set-aside/solicitation number/contracting-officer/source URL, etc. */
  govcon?: Record<string, unknown> | null
  source?: string
}

export interface GovconLeadUpdateInput {
  externalRef: string
  stage?: ManualLeadStage
  notes?: string | null
  nextFollowUp?: Date | string | null
  estimatedValueCents?: number | null
  /** Shallow-merged into the existing govcon JSON, not a full overwrite. */
  govconPatch?: Record<string, unknown> | null
  source?: string
}

export interface IntakeGraphInput {
  externalRef: string
  companyName: string
  contactName: string
  contactEmail: string
  emailVerifiedAt: Date | string
  /** Optional lead-level region; distinct from and never inferred from the project location. */
  coarseLocation?: string | null
  projectName?: string
  source?: string
  industry?: string | null
  location?: string | null
  revenue?: string | null
  contactTitle?: string | null
  contactPhone?: string | null
  budgetRange?: string | null
  timeline?: string | null
  objectives?: string[]
  specialRequirements?: string | null
  questionsForUs?: string | null
  platformPreference?: string | null
  proBono?: boolean
  service?: string | null
  message?: string
  rawData?: unknown
}

export interface IntakeGraphResult {
  leadId: number
  clientId: number
  projectId: number
  intakeId: number
  leadStage: LeadStage
  projectStatus: ProjectLifecycleStatus
  /** True only for the first insert; false when source + externalRef recovers a retry. */
  created: boolean
}

export interface PrepareLeadProposalInput {
  leadId: number
  projectName: string
  source?: string
  externalRef?: string
}

export interface ProposalPreparationResult {
  leadId: number
  clientId: number
  projectId: number
  leadStage: LeadStage
  projectStatus: ProjectLifecycleStatus
}

export interface LeadStageResult {
  leadId: number
  stage: LeadStage
}

export interface UpdateLeadInput {
  leadId: number
  stage: ManualLeadStage
  estimatedValueCents: number | null
  nextFollowUp: Date | string | null
  notes: string | null
}

export interface LeadUpdateResult extends LeadStageResult {
  estimatedValueCents: number | null
  nextFollowUp: string | null
  notes: string | null
}

export interface ProjectLifecycleResult {
  projectId: number
  projectStatus: ProjectLifecycleStatus
  clientId: number | null
  clientStatus: ClientRelationshipStatus | null
  leadId: number | null
  leadStage: LeadStage | null
}

export interface IntakeLinkResult {
  intakeId: number
  projectId: number | null
  clientId: number | null
  leadId: number
}

export interface ReserveDepositInvoiceInput {
  projectId: number
  invoiceNumber: string
  amountCents: number
  description?: string
  dueDate?: Date | string | null
}

export interface DepositInvoiceReservation {
  invoiceId: number
  projectId: number
  clientId: number
  purpose: 'deposit'
  amountCents: number
  status: string
  stripeInvoiceId: string | null
  created: boolean
}

export interface LinkDepositInvoiceInput {
  projectId: number
  stripeInvoiceId: string
  stripeInvoiceUrl?: string | null
}

export interface DepositInvoiceLinkResult {
  invoiceId: number
  projectId: number
  stripeInvoiceId: string
  stripeInvoiceUrl: string | null
}

export interface ReserveInvoiceNotificationInput {
  invoiceId: number
  idempotencyKey: string
}

export interface InvoiceNotificationReservation {
  invoiceId: number
  idempotencyKey: string
  notificationSentAt: string | null
  /** True only when this call first assigns the key to the invoice. */
  reserved: boolean
  /** True for a new claim or an unsent retry using the same provider key. */
  shouldSend: boolean
}

export interface MarkInvoiceNotificationSentInput extends ReserveInvoiceNotificationInput {
  sentAt?: Date | string
}

export interface InvoiceNotificationResult {
  invoiceId: number
  idempotencyKey: string
  notificationSentAt: string
}

interface LeadCaptureRow {
  lead_id: number
  stage: LeadStage
  created: boolean
}

interface IntakeGraphRow {
  lead_id: number
  client_id: number
  project_id: number
  intake_id: number
  lead_stage: LeadStage
  project_status: ProjectLifecycleStatus
  created: boolean
}

interface ProposalPreparationRow {
  lead_id: number
  client_id: number
  project_id: number
  lead_stage: LeadStage
  project_status: ProjectLifecycleStatus
}

interface LeadStageRow {
  lead_id: number
  stage: LeadStage
}

interface LeadUpdateRow extends LeadStageRow {
  estimated_value_cents: number | null
  next_follow_up: Date | string | null
  notes: string | null
}

interface ProjectLifecycleRow {
  project_id: number
  project_status: ProjectLifecycleStatus
  client_id: number | null
  client_status: ClientRelationshipStatus | null
  lead_id: number | null
  lead_stage: LeadStage | null
}

interface IntakeLinkRow {
  intake_id: number
  project_id: number | null
  client_id: number | null
  lead_id: number
}

interface DepositInvoiceReservationRow {
  invoice_id: number
  project_id: number
  client_id: number
  purpose: 'deposit'
  amount_cents: number
  status: string
  stripe_invoice_id: string | null
  created: boolean
}

interface DepositInvoiceLinkRow {
  invoice_id: number
  project_id: number
  stripe_invoice_id: string
  stripe_invoice_url: string | null
}

interface InvoiceNotificationReservationRow {
  invoice_id: number
  notification_idempotency_key: string
  notification_sent_at: Date | string | null
  reserved: boolean
  should_send: boolean
}

interface InvoiceNotificationRow {
  invoice_id: number
  notification_idempotency_key: string
  notification_sent_at: Date | string
}

function requiredText(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} is required`)
  return normalized
}

function optionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizedEmail(value: string): string {
  const email = requiredText(value, 'email').toLowerCase()
  if (!email.includes('@')) throw new Error('email is invalid')
  return email
}

function normalizedSource(value: string | undefined, fallback: string): string {
  return requiredText(value ?? fallback, 'source').toLowerCase()
}

function normalizedCoarseLocation(value: string | null | undefined): string | null {
  const location = optionalText(value)
  if (location !== null && location.length > 160) {
    throw new Error('coarseLocation must be 160 characters or fewer')
  }
  return location
}

function positiveId(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${field} must be a positive integer`)
  return value
}

function timestamp(value: Date | string | undefined): string {
  const parsed = value instanceof Date ? value : value ? new Date(value) : new Date()
  if (Number.isNaN(parsed.valueOf())) throw new Error('timestamp is invalid')
  return parsed.toISOString()
}

function requiredTimestamp(value: Date | string, field: string): string {
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.valueOf())) throw new Error(`${field} is invalid`)
  return parsed.toISOString()
}

function nullableTimestamp(value: Date | string | null, field: string): string | null {
  if (value === null) return null
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.valueOf())) throw new Error(`${field} is invalid`)
  return parsed.toISOString()
}

function nullableCurrencyCents(value: number | null): number | null {
  if (value === null) return null
  if (!Number.isSafeInteger(value) || value < 0 || value > 2_147_483_647) {
    throw new Error('estimatedValueCents must be a non-negative 32-bit integer or null')
  }
  return value
}

function positiveCurrencyCents(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2_147_483_647) {
    throw new Error(`${field} must be a positive 32-bit integer`)
  }
  return value
}

function nullableDate(value: Date | string | null | undefined, field: string): string | null {
  if (value === null || value === undefined) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.valueOf())) throw new Error(`${field} is invalid`)
    return value.toISOString().slice(0, 10)
  }

  const normalized = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${field} must use YYYY-MM-DD`)
  }
  const parsed = new Date(`${normalized}T00:00:00.000Z`)
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new Error(`${field} is invalid`)
  }
  return normalized
}

/** Thrown only for a genuine (source, external_id) conflict -- lets route
 * handlers map this to 409 while every other thrown Error (validation) maps
 * to 400. */
export class LeadConflictError extends Error {}

function firstRow<T>(rows: unknown, message: string): T {
  const row = (rows as T[])[0]
  if (!row) throw new Error(message)
  return row
}

function firstConflictRow<T>(rows: unknown, message: string): T {
  const row = (rows as T[])[0]
  if (!row) throw new LeadConflictError(message)
  return row
}

function isoTimestamp(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function nullableIsoTimestamp(value: Date | string | null): string | null {
  return value === null ? null : isoTimestamp(value)
}

function toProjectLifecycleResult(row: ProjectLifecycleRow): ProjectLifecycleResult {
  return {
    projectId: row.project_id,
    projectStatus: row.project_status,
    clientId: row.client_id,
    clientStatus: row.client_status,
    leadId: row.lead_id,
    leadStage: row.lead_stage,
  }
}

/**
 * Capture a sales lead. When externalRef is supplied, source + externalRef is an
 * idempotency key; a retry returns the original row without overwriting its content.
 */
export async function captureContactLead(input: ContactLeadInput): Promise<LeadCaptureResult> {
  const name = requiredText(input.name, 'name')
  const email = normalizedEmail(input.email)
  const message = requiredText(input.message, 'message')
  const source = normalizedSource(input.source, 'website_contact')
  const externalRef = optionalText(input.externalRef)
  const coarseLocation = normalizedCoarseLocation(input.coarseLocation)
  const emailVerifiedAt = requiredTimestamp(input.emailVerifiedAt, 'emailVerifiedAt')

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      INSERT INTO leads (
        name, email, organization, phone, service, message, source, external_id,
        location, email_verified_at
      )
      VALUES (
        ${name}, ${email}, ${optionalText(input.organization)}, ${optionalText(input.phone)},
        ${optionalText(input.service)}, ${message}, ${source}, ${externalRef},
        ${coarseLocation}, ${emailVerifiedAt}::timestamptz
      )
      ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL
      DO UPDATE SET
        location = COALESCE(leads.location, EXCLUDED.location),
        email_verified_at = COALESCE(leads.email_verified_at, EXCLUDED.email_verified_at),
        updated_at = now()
      WHERE lower(btrim(leads.email)) = lower(btrim(EXCLUDED.email))
      RETURNING id AS lead_id, stage, (xmax = 0) AS created
    `,
  ])

  const row = firstConflictRow<LeadCaptureRow>(
    rows,
    'The external reference is already assigned to a different lead',
  )
  return { leadId: row.lead_id, stage: row.stage, created: row.created }
}

const GOVCON_DEFAULT_SOURCE = 'opportunity-radar'

/**
 * Capture (or recover, idempotently) a government-contracting lead from
 * opportunity-radar. Mirrors captureContactLead's ON CONFLICT (source,
 * external_id) idempotency key, but without the email-verification/coarse-
 * location semantics that only make sense for a human-submitted web form.
 * A retry with the same externalRef returns the existing row rather than
 * duplicating or overwriting it -- opportunity-radar's own local state
 * (workflow_status, engagement history) stays authoritative for anything
 * finer-grained than this lead's funnel stage.
 */
export async function captureGovconLead(input: GovconLeadInput): Promise<LeadCaptureResult> {
  const name = requiredText(input.title, 'title')
  const source = normalizedSource(input.source, GOVCON_DEFAULT_SOURCE)
  const externalRef = requiredText(input.externalRef, 'externalRef')
  const govconJson = input.govcon ? JSON.stringify(input.govcon) : null
  const estimatedValueCents = nullableCurrencyCents(input.estimatedValueCents ?? null)
  const nextFollowUp = nullableTimestamp(input.nextFollowUp ?? null, 'nextFollowUp')

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      INSERT INTO leads (
        name, email, organization, phone, service, message, source, external_id,
        estimated_value_cents, next_follow_up, notes, govcon
      )
      VALUES (
        ${name}, ${optionalText(input.contactEmail) ?? ''}, ${optionalText(input.agency)},
        ${optionalText(input.contactPhone)}, ${source}, ${name}, ${source}, ${externalRef},
        ${estimatedValueCents}, ${nextFollowUp}::timestamptz,
        ${optionalText(input.notes)}, ${govconJson}::jsonb
      )
      ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL
      DO UPDATE SET updated_at = now()
      RETURNING id AS lead_id, stage, (xmax = 0) AS created
    `,
  ])

  const row = firstRow<LeadCaptureRow>(rows, 'Failed to capture govcon lead')
  return { leadId: row.lead_id, stage: row.stage, created: row.created }
}

/**
 * Update a govcon lead's funnel state. Every write is scoped to
 * `source = 'opportunity-radar'` IN THE SQL, not just validated in the
 * route handler above this function -- this is the actual boundary that
 * keeps opportunity-radar's integration credential from being able to
 * touch a website-originated lead, even if the route layer had a bug.
 * Returns null (not an error) when no matching row exists, so the caller
 * can 404 rather than assume success.
 */
export async function updateGovconLead(
  input: GovconLeadUpdateInput,
): Promise<{ leadId: number; stage: LeadStage } | null> {
  const source = normalizedSource(input.source, GOVCON_DEFAULT_SOURCE)
  const externalRef = requiredText(input.externalRef, 'externalRef')
  const govconPatchJson = input.govconPatch ? JSON.stringify(input.govconPatch) : null
  const estimatedValueCents = nullableCurrencyCents(input.estimatedValueCents ?? null)
  const nextFollowUp = nullableTimestamp(input.nextFollowUp ?? null, 'nextFollowUp')

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      UPDATE leads
      SET
        stage = COALESCE(${input.stage ?? null}, stage),
        notes = COALESCE(${optionalText(input.notes ?? null)}, notes),
        next_follow_up = COALESCE(
          ${nextFollowUp}::timestamptz, next_follow_up
        ),
        estimated_value_cents = COALESCE(
          ${estimatedValueCents}, estimated_value_cents
        ),
        govcon = CASE
          WHEN ${govconPatchJson}::jsonb IS NULL THEN govcon
          ELSE COALESCE(govcon, '{}'::jsonb) || ${govconPatchJson}::jsonb
        END,
        updated_at = now()
      WHERE source = ${source} AND external_id = ${externalRef}
      RETURNING id AS lead_id, stage
    `,
  ])

  const row = (rows as { lead_id: number; stage: LeadStage }[])[0]
  return row ? { leadId: row.lead_id, stage: row.stage } : null
}

/**
 * Create or recover the complete intake graph in one transaction. externalRef is
 * mandatory because it prevents retries from creating duplicate clients or projects.
 */
export async function createOrLinkIntakeGraph(
  input: IntakeGraphInput,
): Promise<IntakeGraphResult> {
  const externalRef = requiredText(input.externalRef, 'externalRef')
  const companyName = requiredText(input.companyName, 'companyName')
  const contactName = requiredText(input.contactName, 'contactName')
  const contactEmail = normalizedEmail(input.contactEmail)
  const source = normalizedSource(input.source, 'website_intake')
  const coarseLocation = normalizedCoarseLocation(input.coarseLocation)
  const emailVerifiedAt = requiredTimestamp(input.emailVerifiedAt, 'emailVerifiedAt')
  const projectName = requiredText(input.projectName ?? `${companyName} engagement`, 'projectName')
  const message = requiredText(
    input.message ?? `Project intake submitted by ${contactName} for ${companyName}`,
    'message',
  )
  const rawData = JSON.stringify(input.rawData ?? {})
  if (rawData === undefined) throw new Error('rawData must be JSON-serializable')
  const objectives = (input.objectives ?? []).map((item) => item.trim()).filter(Boolean)

  const [rows] = await sql.transaction(
    (transactionSql) => [
      transactionSql`
        WITH existing_lead AS MATERIALIZED (
          SELECT id, email, client_id
          FROM leads
          WHERE source = ${source} AND external_id = ${externalRef}
          FOR UPDATE
        ),
        existing_client AS MATERIALIZED (
          SELECT id
          FROM clients
          WHERE lower(btrim(email)) = ${contactEmail}
          FOR UPDATE
        ),
        existing_project AS MATERIALIZED (
          SELECT id, client_id, lead_id
          FROM projects
          WHERE source = ${source} AND external_id = ${externalRef}
          FOR UPDATE
        ),
        existing_intake AS MATERIALIZED (
          SELECT id, client_id, project_id, lead_id, contact_email
          FROM intake_submissions
          WHERE source = ${source} AND external_id = ${externalRef}
          FOR UPDATE
        ),
        compatible_key AS MATERIALIZED (
          SELECT
            NOT EXISTS (
              SELECT 1 FROM existing_lead
              WHERE lower(btrim(email)) <> ${contactEmail}
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_intake
              WHERE lower(btrim(contact_email)) <> ${contactEmail}
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_lead
              WHERE client_id IS NOT NULL
                AND (
                  NOT EXISTS (SELECT 1 FROM existing_client)
                  OR client_id <> (SELECT id FROM existing_client)
                )
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_project
              WHERE lead_id IS NOT NULL
                AND (
                  NOT EXISTS (SELECT 1 FROM existing_lead)
                  OR lead_id <> (SELECT id FROM existing_lead)
                )
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_project
              WHERE client_id IS NOT NULL
                AND (
                  NOT EXISTS (SELECT 1 FROM existing_client)
                  OR client_id <> (SELECT id FROM existing_client)
                )
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_intake
              WHERE lead_id IS NOT NULL
                AND (
                  NOT EXISTS (SELECT 1 FROM existing_lead)
                  OR lead_id <> (SELECT id FROM existing_lead)
                )
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_intake
              WHERE project_id IS NOT NULL
                AND (
                  NOT EXISTS (SELECT 1 FROM existing_project)
                  OR project_id <> (SELECT id FROM existing_project)
                )
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_intake
              WHERE client_id IS NOT NULL
                AND (
                  NOT EXISTS (SELECT 1 FROM existing_client)
                  OR client_id <> (SELECT id FROM existing_client)
                )
            ) AS is_compatible
        ),
        client_record AS (
          INSERT INTO clients (
            name, contact_name, email, phone, relationship_status, updated_at
          )
          SELECT ${companyName}, ${contactName}, ${contactEmail},
                 ${optionalText(input.contactPhone)}, 'prospect', now()
          FROM compatible_key
          WHERE is_compatible
          ON CONFLICT ((lower(btrim(email))))
          DO UPDATE SET
            contact_name = CASE
              WHEN btrim(clients.contact_name) = '' THEN EXCLUDED.contact_name
              ELSE clients.contact_name
            END,
            phone = COALESCE(clients.phone, EXCLUDED.phone),
            updated_at = now()
          RETURNING id
        ),
        lead_record AS (
          INSERT INTO leads (
            name, email, organization, phone, service, message, source, external_id, client_id,
            location, email_verified_at
          )
          SELECT
            ${contactName}, ${contactEmail}, ${companyName}, ${optionalText(input.contactPhone)},
            ${optionalText(input.service)}, ${message}, ${source}, ${externalRef}, client_record.id,
            ${coarseLocation}, ${emailVerifiedAt}::timestamptz
          FROM client_record
          ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL
          DO UPDATE SET
            client_id = COALESCE(leads.client_id, EXCLUDED.client_id),
            location = COALESCE(leads.location, EXCLUDED.location),
            email_verified_at = COALESCE(leads.email_verified_at, EXCLUDED.email_verified_at),
            updated_at = now()
          WHERE lower(btrim(leads.email)) = lower(btrim(EXCLUDED.email))
            AND (leads.client_id IS NULL OR leads.client_id = EXCLUDED.client_id)
          RETURNING id, stage
        ),
        project_record AS (
          INSERT INTO projects (
            client_id, lead_id, name, status, source, external_id, updated_at
          )
          SELECT client_record.id, lead_record.id, ${projectName}, 'proposal',
                 ${source}, ${externalRef}, now()
          FROM client_record CROSS JOIN lead_record
          ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL
          DO UPDATE SET
            client_id = EXCLUDED.client_id,
            lead_id = COALESCE(projects.lead_id, EXCLUDED.lead_id),
            updated_at = now()
          WHERE projects.lead_id IS NULL OR projects.lead_id = EXCLUDED.lead_id
          RETURNING id, status
        ),
        intake_record AS (
          INSERT INTO intake_submissions (
            client_id, project_id, lead_id, status, source, external_id,
            company_name, industry, location, revenue, contact_name, contact_title,
            contact_email, contact_phone, budget_range, timeline, objectives,
            special_requirements, questions_for_us, raw_data, pro_bono,
            platform_preference, updated_at
          )
          SELECT
            client_record.id, project_record.id, lead_record.id, 'new', ${source}, ${externalRef},
            ${companyName}, ${optionalText(input.industry)}, ${optionalText(input.location)},
            ${optionalText(input.revenue)}, ${contactName}, ${optionalText(input.contactTitle)},
            ${contactEmail}, ${optionalText(input.contactPhone)}, ${optionalText(input.budgetRange)},
            ${optionalText(input.timeline)}, ${objectives}::text[],
            ${optionalText(input.specialRequirements)}, ${optionalText(input.questionsForUs)},
            ${rawData}::jsonb, ${input.proBono ?? false}, ${optionalText(input.platformPreference)}, now()
          FROM client_record CROSS JOIN project_record CROSS JOIN lead_record
          ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL
          DO UPDATE SET
            client_id = COALESCE(intake_submissions.client_id, EXCLUDED.client_id),
            project_id = COALESCE(intake_submissions.project_id, EXCLUDED.project_id),
            lead_id = COALESCE(intake_submissions.lead_id, EXCLUDED.lead_id),
            updated_at = now()
          WHERE lower(btrim(intake_submissions.contact_email)) =
                lower(btrim(EXCLUDED.contact_email))
          RETURNING id, (xmax = 0) AS created
        )
        SELECT
          lead_record.id AS lead_id,
          client_record.id AS client_id,
          project_record.id AS project_id,
          intake_record.id AS intake_id,
          lead_record.stage AS lead_stage,
          project_record.status AS project_status,
          intake_record.created
        FROM lead_record
        CROSS JOIN client_record
        CROSS JOIN project_record
        CROSS JOIN intake_record
      `,
    ],
    { isolationLevel: 'Serializable' },
  )

  const row = firstRow<IntakeGraphRow>(
    rows,
    'The intake external reference conflicts with a different submission',
  )
  return {
    leadId: row.lead_id,
    clientId: row.client_id,
    projectId: row.project_id,
    intakeId: row.intake_id,
    leadStage: row.lead_stage,
    projectStatus: row.project_status,
    created: row.created,
  }
}

export async function linkIntakeToLead(input: {
  intakeId: number
  leadId: number
}): Promise<IntakeLinkResult> {
  const intakeId = positiveId(input.intakeId, 'intakeId')
  const leadId = positiveId(input.leadId, 'leadId')

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      WITH selected_intake AS (
        SELECT id, project_id, client_id, lead_id
        FROM intake_submissions
        WHERE id = ${intakeId}
          AND (lead_id IS NULL OR lead_id = ${leadId})
        FOR UPDATE
      ),
      selected_lead AS (
        SELECT id, client_id
        FROM leads
        WHERE id = ${leadId}
        FOR UPDATE
      ),
      compatible_intake AS (
        SELECT selected_intake.*
        FROM selected_intake CROSS JOIN selected_lead
        WHERE (
            selected_lead.client_id IS NULL
            OR selected_intake.client_id IS NULL
            OR selected_lead.client_id = selected_intake.client_id
          )
          AND (
            selected_intake.project_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM projects
              WHERE projects.id = selected_intake.project_id
                AND (projects.lead_id IS NULL OR projects.lead_id = selected_lead.id)
                AND (
                  projects.client_id IS NULL
                  OR selected_lead.client_id IS NULL
                  OR projects.client_id = selected_lead.client_id
                )
                AND (
                  projects.client_id IS NULL
                  OR selected_intake.client_id IS NULL
                  OR projects.client_id = selected_intake.client_id
                )
            )
          )
      ),
      linked_project AS (
        UPDATE projects
        SET lead_id = ${leadId}, updated_at = now()
        WHERE id = (SELECT project_id FROM compatible_intake)
          AND (lead_id IS NULL OR lead_id = ${leadId})
        RETURNING id
      ),
      linked_intake AS (
        UPDATE intake_submissions
        SET lead_id = ${leadId}, updated_at = now()
        FROM compatible_intake
        WHERE intake_submissions.id = compatible_intake.id
          AND (
            compatible_intake.project_id IS NULL
            OR EXISTS (
              SELECT 1 FROM linked_project
              WHERE linked_project.id = compatible_intake.project_id
            )
          )
        RETURNING
          intake_submissions.id,
          intake_submissions.project_id,
          intake_submissions.client_id,
          intake_submissions.lead_id
      ),
      linked_lead AS (
        UPDATE leads
        SET client_id = COALESCE(leads.client_id, (SELECT client_id FROM linked_intake)),
            updated_at = now()
        WHERE id = (SELECT id FROM selected_lead)
          AND EXISTS (SELECT 1 FROM linked_intake)
        RETURNING id
      )
      SELECT
        linked_intake.id AS intake_id,
        linked_intake.project_id,
        linked_intake.client_id,
        linked_lead.id AS lead_id
      FROM linked_intake CROSS JOIN linked_lead
    `,
  ])

  const row = firstRow<IntakeLinkRow>(
    rows,
    'Intake or lead not found, or the intake is linked to a different lead',
  )
  return {
    intakeId: row.intake_id,
    projectId: row.project_id,
    clientId: row.client_id,
    leadId: row.lead_id,
  }
}

/** Prepare the client and proposal project without marking the lead as won. */
export async function prepareLeadProposal(
  input: PrepareLeadProposalInput,
): Promise<ProposalPreparationResult> {
  const leadId = positiveId(input.leadId, 'leadId')
  const projectName = requiredText(input.projectName, 'projectName')
  const source = normalizedSource(input.source, 'lead_promotion')
  const externalRef = requiredText(input.externalRef ?? `lead:${leadId}`, 'externalRef')

  const [rows] = await sql.transaction(
    (transactionSql) => [
      transactionSql`
        WITH selected_lead AS MATERIALIZED (
          SELECT id, name, email, organization, phone, client_id
          FROM leads
          WHERE id = ${leadId} AND stage NOT IN ('won', 'lost')
          FOR UPDATE
        ),
        existing_client AS MATERIALIZED (
          SELECT clients.id
          FROM clients CROSS JOIN selected_lead
          WHERE lower(btrim(clients.email)) = lower(btrim(selected_lead.email))
          FOR UPDATE OF clients
        ),
        existing_project AS MATERIALIZED (
          SELECT id, client_id, lead_id
          FROM projects
          WHERE source = ${source} AND external_id = ${externalRef}
          FOR UPDATE
        ),
        compatible_lead AS MATERIALIZED (
          SELECT selected_lead.*
          FROM selected_lead
          WHERE (
              selected_lead.client_id IS NULL
              OR EXISTS (
                SELECT 1 FROM existing_client
                WHERE existing_client.id = selected_lead.client_id
              )
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_project
              WHERE lead_id IS NOT NULL AND lead_id <> selected_lead.id
            )
            AND NOT EXISTS (
              SELECT 1 FROM existing_project
              WHERE client_id IS NOT NULL
                AND (
                  NOT EXISTS (SELECT 1 FROM existing_client)
                  OR client_id <> (SELECT id FROM existing_client)
                )
            )
        ),
        client_record AS (
          INSERT INTO clients (
            name, contact_name, email, phone, relationship_status, updated_at
          )
          SELECT COALESCE(NULLIF(btrim(organization), ''), name), name, email, phone,
                 'prospect', now()
          FROM compatible_lead
          ON CONFLICT ((lower(btrim(email))))
          DO UPDATE SET
            phone = COALESCE(clients.phone, EXCLUDED.phone),
            updated_at = now()
          RETURNING id
        ),
        updated_lead AS (
          UPDATE leads
          SET client_id = (SELECT id FROM client_record),
              stage = 'proposal',
              updated_at = now()
          WHERE id = (SELECT id FROM compatible_lead)
          RETURNING id, stage
        ),
        project_record AS (
          INSERT INTO projects (
            client_id, lead_id, name, status, source, external_id, updated_at
          )
          SELECT client_record.id, updated_lead.id, ${projectName}, 'proposal',
                 ${source}, ${externalRef}, now()
          FROM client_record CROSS JOIN updated_lead
          ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL
          DO UPDATE SET
            client_id = EXCLUDED.client_id,
            lead_id = COALESCE(projects.lead_id, EXCLUDED.lead_id),
            updated_at = now()
          WHERE projects.lead_id IS NULL OR projects.lead_id = EXCLUDED.lead_id
          RETURNING id, status
        )
        SELECT
          updated_lead.id AS lead_id,
          client_record.id AS client_id,
          project_record.id AS project_id,
          updated_lead.stage AS lead_stage,
          project_record.status AS project_status
        FROM updated_lead CROSS JOIN client_record CROSS JOIN project_record
      `,
    ],
    { isolationLevel: 'Serializable' },
  )

  const row = firstRow<ProposalPreparationRow>(
    rows,
    'Lead not found, already closed, or proposal key belongs to another lead',
  )
  return {
    leadId: row.lead_id,
    clientId: row.client_id,
    projectId: row.project_id,
    leadStage: row.lead_stage,
    projectStatus: row.project_status,
  }
}

export async function markProposalSent(input: {
  projectId: number
  docusealSubmissionId?: string | null
  sentAt?: Date | string
}): Promise<ProjectLifecycleResult> {
  const projectId = positiveId(input.projectId, 'projectId')
  const docusealSubmissionId = optionalText(input.docusealSubmissionId)
  const sentAt = timestamp(input.sentAt)

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      WITH updated_project AS (
        UPDATE projects
        SET proposal_sent_at = COALESCE(proposal_sent_at, ${sentAt}::timestamptz),
            docuseal_submission_id = COALESCE(docuseal_submission_id, ${docusealSubmissionId}),
            updated_at = now()
        WHERE id = ${projectId}
          AND status IN ('proposal', 'signed', 'active')
          AND (
            ${docusealSubmissionId}::text IS NULL
            OR docuseal_submission_id IS NULL
            OR docuseal_submission_id = ${docusealSubmissionId}
          )
        RETURNING id, status, client_id, lead_id
      )
      SELECT
        updated_project.id AS project_id,
        updated_project.status AS project_status,
        updated_project.client_id,
        clients.relationship_status AS client_status,
        updated_project.lead_id,
        leads.stage AS lead_stage
      FROM updated_project
      LEFT JOIN clients ON clients.id = updated_project.client_id
      LEFT JOIN leads ON leads.id = updated_project.lead_id
    `,
  ])

  return toProjectLifecycleResult(
    firstRow<ProjectLifecycleRow>(
      rows,
      'Proposal project not found, canceled, or linked to a different DocuSeal submission',
    ),
  )
}

const projectTransitionSources: Record<ProjectLifecycleStatus, readonly ProjectLifecycleStatus[]> = {
  proposal: ['proposal'],
  signed: ['proposal', 'signed', 'active'],
  active: ['signed', 'active'],
  canceled: ['proposal', 'signed', 'active', 'canceled'],
}

async function updateProjectLifecycle(input: {
  projectId: number
  to: ProjectLifecycleStatus
  signedAt?: Date | string
  docusealSubmissionId?: string | null
}): Promise<ProjectLifecycleResult> {
  const projectId = positiveId(input.projectId, 'projectId')
  const allowedFrom = projectTransitionSources[input.to]
  const signedAt = timestamp(input.signedAt)
  const docusealSubmissionId = optionalText(input.docusealSubmissionId)

  const [rows] = await sql.transaction(
    (transactionSql) => [
      transactionSql`
        WITH current_project AS (
          SELECT id, status, client_id, lead_id
          FROM projects
          WHERE id = ${projectId}
          FOR UPDATE
        ),
        updated_project AS (
          UPDATE projects
          SET status = CASE
                WHEN ${input.to}::text = 'signed' AND current_project.status = 'active'
                  THEN 'active'
                ELSE ${input.to}
              END,
              signed_at = CASE
                WHEN ${input.to} = 'signed' THEN COALESCE(projects.signed_at, ${signedAt}::timestamptz)
                ELSE projects.signed_at
              END,
              docuseal_submission_id = COALESCE(
                projects.docuseal_submission_id,
                ${docusealSubmissionId}
              ),
              updated_at = now()
          FROM current_project
          WHERE projects.id = current_project.id
            AND projects.status = ANY(${allowedFrom}::text[])
            AND (
              ${docusealSubmissionId}::text IS NULL
              OR projects.docuseal_submission_id IS NULL
              OR projects.docuseal_submission_id = ${docusealSubmissionId}
            )
            AND (
              ${input.to}::text <> 'signed'
              OR current_project.status <> 'active'
              OR (
                ${docusealSubmissionId}::text IS NOT NULL
                AND projects.docuseal_submission_id = ${docusealSubmissionId}
              )
            )
          RETURNING
            projects.id,
            projects.status,
            projects.client_id,
            projects.lead_id,
            current_project.status AS previous_status
        ),
        updated_client AS (
          UPDATE clients
          SET relationship_status = CASE
                WHEN ${input.to} IN ('signed', 'active') THEN 'active'
                ELSE clients.relationship_status
              END,
              updated_at = now()
          WHERE id = (SELECT client_id FROM updated_project)
          RETURNING id, relationship_status
        ),
        updated_lead AS (
          UPDATE leads
          SET stage = CASE
                WHEN ${input.to} IN ('signed', 'active') THEN 'won'
                WHEN ${input.to} = 'canceled'
                  AND (SELECT previous_status FROM updated_project) = 'proposal'
                  AND NOT EXISTS (
                    SELECT 1
                    FROM projects AS other_project
                    WHERE other_project.lead_id = (SELECT lead_id FROM updated_project)
                      AND other_project.id <> (SELECT id FROM updated_project)
                      AND other_project.status IN ('proposal', 'signed', 'active')
                  ) THEN 'lost'
                ELSE leads.stage
              END,
              updated_at = now()
          WHERE id = (SELECT lead_id FROM updated_project)
          RETURNING id, stage
        ),
        updated_intake AS (
          UPDATE intake_submissions
          SET status = CASE
                WHEN ${input.to} IN ('signed', 'active') THEN 'won'
                WHEN ${input.to} = 'canceled'
                  AND (SELECT previous_status FROM updated_project) = 'proposal' THEN 'lost'
                ELSE intake_submissions.status
              END,
              updated_at = now()
          WHERE project_id = (SELECT id FROM updated_project)
          RETURNING id
        )
        SELECT
          updated_project.id AS project_id,
          updated_project.status AS project_status,
          updated_project.client_id,
          (SELECT relationship_status FROM updated_client) AS client_status,
          updated_project.lead_id,
          (SELECT stage FROM updated_lead) AS lead_stage
        FROM updated_project
      `,
    ],
    { isolationLevel: 'Serializable' },
  )

  return toProjectLifecycleResult(
    firstRow<ProjectLifecycleRow>(
      rows,
      `Project not found or transition to ${input.to} is not allowed`,
    ),
  )
}

export async function transitionProjectLifecycle(input: {
  projectId: number
  to: ProjectLifecycleStatus
  signedAt?: Date | string
}): Promise<ProjectLifecycleResult> {
  return updateProjectLifecycle(input)
}

export async function markEngagementSigned(input: {
  projectId: number
  docusealSubmissionId?: string | null
  signedAt?: Date | string
}): Promise<ProjectLifecycleResult> {
  return updateProjectLifecycle({ ...input, to: 'signed' })
}

const leadTransitionSources: Record<ManualLeadStage, readonly LeadStage[]> = {
  new: ['new'],
  contacted: ['new', 'contacted'],
  qualified: ['new', 'contacted', 'qualified'],
  proposal: ['new', 'contacted', 'qualified', 'proposal'],
  lost: ['new', 'contacted', 'qualified', 'proposal', 'lost'],
}

function manualLeadStage(value: string): ManualLeadStage {
  if (value === 'won' || !(LEAD_STAGES as readonly string[]).includes(value)) {
    throw new Error('stage must be one of new, contacted, qualified, proposal, or lost')
  }
  return value as ManualLeadStage
}

/**
 * Apply the editable admin fields in one transaction. A lead can become won only
 * through the signed-engagement lifecycle; moving it to lost also closes its open
 * proposal and intake records atomically.
 */
export async function updateLead(input: UpdateLeadInput): Promise<LeadUpdateResult> {
  const leadId = positiveId(input.leadId, 'leadId')
  const stage = manualLeadStage(input.stage)
  const allowedFrom = leadTransitionSources[stage]
  const estimatedValueCents = nullableCurrencyCents(input.estimatedValueCents)
  const nextFollowUp = nullableTimestamp(input.nextFollowUp, 'nextFollowUp')
  const notes = optionalText(input.notes)

  const [rows] = await sql.transaction(
    (transactionSql) => [
      transactionSql`
        WITH updated_lead AS (
          UPDATE leads
          SET stage = ${stage},
              estimated_value_cents = ${estimatedValueCents},
              next_follow_up = ${nextFollowUp}::timestamptz,
              notes = ${notes},
              updated_at = now()
          WHERE id = ${leadId}
            AND stage <> 'won'
            AND stage = ANY(${allowedFrom}::text[])
            AND (
              ${stage}::text <> 'lost'
              OR NOT EXISTS (
                SELECT 1 FROM projects
                WHERE lead_id = ${leadId} AND status IN ('signed', 'active')
              )
            )
          RETURNING id, stage, estimated_value_cents, next_follow_up, notes
        ),
        canceled_projects AS (
          UPDATE projects
          SET status = 'canceled', updated_at = now()
          WHERE ${stage}::text = 'lost'
            AND lead_id = (SELECT id FROM updated_lead)
            AND status = 'proposal'
          RETURNING id
        ),
        closed_intakes AS (
          UPDATE intake_submissions
          SET status = 'lost', updated_at = now()
          WHERE ${stage}::text = 'lost'
            AND lead_id = (SELECT id FROM updated_lead)
            AND status <> 'won'
          RETURNING id
        )
        SELECT id AS lead_id, stage, estimated_value_cents, next_follow_up, notes
        FROM updated_lead
      `,
    ],
    { isolationLevel: 'Serializable' },
  )

  const row = firstRow<LeadUpdateRow>(
    rows,
    `Lead not found, won, or transition to ${stage} is not allowed`,
  )
  return {
    leadId: row.lead_id,
    stage: row.stage,
    estimatedValueCents: row.estimated_value_cents,
    nextFollowUp:
      row.next_follow_up instanceof Date
        ? row.next_follow_up.toISOString()
        : row.next_follow_up,
    notes: row.notes,
  }
}

export async function transitionLeadStage(input: {
  leadId: number
  to: ManualLeadStage
}): Promise<LeadStageResult> {
  const leadId = positiveId(input.leadId, 'leadId')
  const stage = manualLeadStage(input.to)
  const allowedFrom = leadTransitionSources[stage]

  const [rows] = await sql.transaction(
    (transactionSql) => [
      transactionSql`
        WITH updated_lead AS (
          UPDATE leads
          SET stage = ${stage}, updated_at = now()
          WHERE id = ${leadId}
            AND stage <> 'won'
            AND stage = ANY(${allowedFrom}::text[])
            AND (
              ${stage}::text <> 'lost'
              OR NOT EXISTS (
                SELECT 1 FROM projects
                WHERE lead_id = ${leadId} AND status IN ('signed', 'active')
              )
            )
          RETURNING id, stage
        ),
        canceled_projects AS (
          UPDATE projects
          SET status = 'canceled', updated_at = now()
          WHERE ${stage}::text = 'lost'
            AND lead_id = (SELECT id FROM updated_lead)
            AND status = 'proposal'
          RETURNING id
        ),
        closed_intakes AS (
          UPDATE intake_submissions
          SET status = 'lost', updated_at = now()
          WHERE ${stage}::text = 'lost'
            AND lead_id = (SELECT id FROM updated_lead)
            AND status <> 'won'
          RETURNING id
        )
        SELECT id AS lead_id, stage FROM updated_lead
      `,
    ],
    { isolationLevel: 'Serializable' },
  )

  const row = firstRow<LeadStageRow>(
    rows,
    `Lead not found, won, or transition to ${stage} is not allowed`,
  )
  return { leadId: row.lead_id, stage: row.stage }
}

/** Mark a lead lost and cancel only its still-open proposal records. */
export async function markLeadLost(input: {
  leadId: number
  note?: string | null
}): Promise<LeadStageResult> {
  const leadId = positiveId(input.leadId, 'leadId')
  const note = optionalText(input.note)

  const [rows] = await sql.transaction(
    (transactionSql) => [
      transactionSql`
        WITH updated_lead AS (
          UPDATE leads
          SET stage = 'lost',
              notes = CASE
                WHEN ${note}::text IS NULL THEN leads.notes
                WHEN NULLIF(btrim(leads.notes), '') IS NULL THEN ${note}
                ELSE leads.notes || E'\n' || ${note}
              END,
              updated_at = now()
          WHERE id = ${leadId}
            AND stage <> 'won'
            AND NOT EXISTS (
              SELECT 1 FROM projects
              WHERE lead_id = ${leadId} AND status IN ('signed', 'active')
            )
          RETURNING id, stage
        ),
        canceled_projects AS (
          UPDATE projects
          SET status = 'canceled', updated_at = now()
          WHERE lead_id = (SELECT id FROM updated_lead) AND status = 'proposal'
          RETURNING id
        ),
        closed_intakes AS (
          UPDATE intake_submissions
          SET status = 'lost', updated_at = now()
          WHERE lead_id = (SELECT id FROM updated_lead) AND status <> 'won'
          RETURNING id
        )
        SELECT id AS lead_id, stage FROM updated_lead
      `,
    ],
    { isolationLevel: 'Serializable' },
  )

  const row = firstRow<LeadStageRow>(rows, 'Lead not found or already won')
  return { leadId: row.lead_id, stage: row.stage }
}

const clientTransitionSources: Record<
  ClientRelationshipStatus,
  readonly ClientRelationshipStatus[]
> = {
  prospect: ['prospect'],
  active: ['prospect', 'active', 'on_hold', 'complete'],
  on_hold: ['active', 'on_hold'],
  complete: ['active', 'on_hold', 'complete'],
  archived: ['prospect', 'active', 'on_hold', 'complete', 'archived'],
}

export async function transitionClientRelationshipStatus(input: {
  clientId: number
  to: ClientRelationshipStatus
}): Promise<{ clientId: number; status: ClientRelationshipStatus }> {
  const clientId = positiveId(input.clientId, 'clientId')
  const allowedFrom = clientTransitionSources[input.to]

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      UPDATE clients
      SET relationship_status = ${input.to}, updated_at = now()
      WHERE id = ${clientId} AND relationship_status = ANY(${allowedFrom}::text[])
      RETURNING id AS client_id, relationship_status AS status
    `,
  ])

  const row = firstRow<{ client_id: number; status: ClientRelationshipStatus }>(
    rows,
    `Client not found or transition to ${input.to} is not allowed`,
  )
  return { clientId: row.client_id, status: row.status }
}

/**
 * Reserve the single deposit invoice for a project. Matching retries recover the
 * existing invoice; a conflicting amount or client leaves both records unchanged.
 */
export async function reserveDepositInvoice(
  input: ReserveDepositInvoiceInput,
): Promise<DepositInvoiceReservation> {
  const projectId = positiveId(input.projectId, 'projectId')
  const invoiceNumber = requiredText(input.invoiceNumber, 'invoiceNumber')
  const amountCents = positiveCurrencyCents(input.amountCents, 'amountCents')
  const description = requiredText(input.description ?? 'Project deposit', 'description')
  const dueDate = nullableDate(input.dueDate, 'dueDate')

  const [rows] = await sql.transaction(
    (transactionSql) => [
      transactionSql`
        WITH selected_project AS MATERIALIZED (
          SELECT projects.id, projects.client_id
          FROM projects
          WHERE projects.id = ${projectId}
            AND projects.client_id IS NOT NULL
            AND projects.status IN ('proposal', 'signed', 'active')
            AND (
              projects.deposit_amount_cents IS NULL
              OR projects.deposit_amount_cents = ${amountCents}
            )
            AND NOT EXISTS (
              SELECT 1
              FROM invoices
              WHERE invoices.project_id = projects.id
                AND invoices.purpose = 'deposit'
                AND (
                  invoices.client_id IS DISTINCT FROM projects.client_id
                  OR invoices.amount_cents <> ${amountCents}
                )
            )
          FOR UPDATE
        ),
        updated_project AS (
          UPDATE projects
          SET deposit_amount_cents = COALESCE(projects.deposit_amount_cents, ${amountCents}),
              updated_at = now()
          FROM selected_project
          WHERE projects.id = selected_project.id
          RETURNING projects.id, projects.client_id
        ),
        deposit_invoice AS (
          INSERT INTO invoices (
            client_id, project_id, purpose, number, description, amount_cents, status, due_date
          )
          SELECT
            updated_project.client_id, updated_project.id, 'deposit', ${invoiceNumber},
            ${description}, ${amountCents}, 'draft', ${dueDate}::date
          FROM updated_project
          ON CONFLICT (project_id, purpose)
            WHERE project_id IS NOT NULL AND purpose IS NOT NULL
          DO UPDATE SET number = invoices.number
          WHERE invoices.client_id = EXCLUDED.client_id
            AND invoices.amount_cents = EXCLUDED.amount_cents
          RETURNING
            id AS invoice_id,
            project_id,
            client_id,
            purpose,
            amount_cents,
            status,
            stripe_invoice_id,
            (xmax = 0) AS created
        )
        SELECT
          invoice_id,
          project_id,
          client_id,
          purpose,
          amount_cents,
          status,
          stripe_invoice_id,
          created
        FROM deposit_invoice
      `,
    ],
    { isolationLevel: 'Serializable' },
  )

  const row = firstRow<DepositInvoiceReservationRow>(
    rows,
    'Project not found, canceled, missing a client, or deposit details conflict with an existing reservation',
  )
  return {
    invoiceId: row.invoice_id,
    projectId: row.project_id,
    clientId: row.client_id,
    purpose: row.purpose,
    amountCents: row.amount_cents,
    status: row.status,
    stripeInvoiceId: row.stripe_invoice_id,
    created: row.created,
  }
}

/** Link the reserved project deposit to its Stripe invoice without replacing another link. */
export async function linkDepositInvoice(
  input: LinkDepositInvoiceInput,
): Promise<DepositInvoiceLinkResult> {
  const projectId = positiveId(input.projectId, 'projectId')
  const stripeInvoiceId = requiredText(input.stripeInvoiceId, 'stripeInvoiceId')
  const stripeInvoiceUrl = optionalText(input.stripeInvoiceUrl)

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      UPDATE invoices
      SET stripe_invoice_id = COALESCE(stripe_invoice_id, ${stripeInvoiceId}),
          stripe_invoice_url = COALESCE(stripe_invoice_url, ${stripeInvoiceUrl})
      WHERE project_id = ${projectId}
        AND purpose = 'deposit'
        AND (stripe_invoice_id IS NULL OR stripe_invoice_id = ${stripeInvoiceId})
      RETURNING
        id AS invoice_id,
        project_id,
        stripe_invoice_id,
        stripe_invoice_url
    `,
  ])

  const row = firstRow<DepositInvoiceLinkRow>(
    rows,
    'Deposit invoice not found or already linked to a different Stripe invoice',
  )
  return {
    invoiceId: row.invoice_id,
    projectId: row.project_id,
    stripeInvoiceId: row.stripe_invoice_id,
    stripeInvoiceUrl: row.stripe_invoice_url,
  }
}

/** Attach a Stripe invoice exactly once; the database also rejects cross-invoice reuse. */
export async function linkStripeInvoice(input: {
  invoiceId: number
  stripeInvoiceId: string
  stripeInvoiceUrl?: string | null
}): Promise<{ invoiceId: number; projectId: number | null; stripeInvoiceId: string }> {
  const invoiceId = positiveId(input.invoiceId, 'invoiceId')
  const stripeInvoiceId = requiredText(input.stripeInvoiceId, 'stripeInvoiceId')

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      UPDATE invoices
      SET stripe_invoice_id = COALESCE(stripe_invoice_id, ${stripeInvoiceId}),
          stripe_invoice_url = COALESCE(stripe_invoice_url, ${optionalText(input.stripeInvoiceUrl)})
      WHERE id = ${invoiceId}
        AND (stripe_invoice_id IS NULL OR stripe_invoice_id = ${stripeInvoiceId})
      RETURNING id AS invoice_id, project_id, stripe_invoice_id
    `,
  ])

  const row = firstRow<{
    invoice_id: number
    project_id: number | null
    stripe_invoice_id: string
  }>(rows, 'Invoice not found or already linked to a different Stripe invoice')

  return {
    invoiceId: row.invoice_id,
    projectId: row.project_id,
    stripeInvoiceId: row.stripe_invoice_id,
  }
}

/**
 * Allocate a globally unique, display-ready invoice number. Sequence gaps are
 * intentional: a rolled-back or abandoned request must never reuse a number.
 */
export async function allocateInvoiceNumber(): Promise<string> {
  const rows = await sql`
    WITH allocated AS MATERIALIZED (
      SELECT nextval('invoice_number_seq') AS sequence_value
    )
    SELECT
      'INV-' ||
      to_char(current_timestamp AT TIME ZONE 'America/Chicago', 'YYYYMM') ||
      '-' ||
      CASE
        WHEN sequence_value < 10000 THEN lpad(sequence_value::text, 4, '0')
        ELSE sequence_value::text
      END AS invoice_number
    FROM allocated
  `

  return firstRow<{ invoice_number: string }>(rows, 'Invoice number allocation failed')
    .invoice_number
}

/**
 * Claim one provider idempotency key for an invoice. An unsent retry with the
 * same key may attempt delivery again; an already-sent retry is a no-op.
 */
export async function reserveInvoiceNotification(
  input: ReserveInvoiceNotificationInput,
): Promise<InvoiceNotificationReservation> {
  const invoiceId = positiveId(input.invoiceId, 'invoiceId')
  const idempotencyKey = requiredText(input.idempotencyKey, 'idempotencyKey')

  const [rows] = await sql.transaction(
    (transactionSql) => [
      transactionSql`
        WITH selected_invoice AS MATERIALIZED (
          SELECT id, notification_idempotency_key, notification_sent_at
          FROM invoices
          WHERE id = ${invoiceId}
          FOR UPDATE
        ),
        claimed_invoice AS (
          UPDATE invoices
          SET notification_idempotency_key = COALESCE(
                invoices.notification_idempotency_key,
                ${idempotencyKey}
              )
          FROM selected_invoice
          WHERE invoices.id = selected_invoice.id
            AND (
              selected_invoice.notification_idempotency_key IS NULL
              OR selected_invoice.notification_idempotency_key = ${idempotencyKey}
            )
          RETURNING
            invoices.id AS invoice_id,
            invoices.notification_idempotency_key,
            invoices.notification_sent_at,
            (selected_invoice.notification_idempotency_key IS NULL) AS reserved
        )
        SELECT
          invoice_id,
          notification_idempotency_key,
          notification_sent_at,
          reserved,
          (notification_sent_at IS NULL) AS should_send
        FROM claimed_invoice
      `,
    ],
    { isolationLevel: 'Serializable' },
  )

  const row = firstRow<InvoiceNotificationReservationRow>(
    rows,
    'Invoice not found or reserved with a different notification key',
  )
  return {
    invoiceId: row.invoice_id,
    idempotencyKey: row.notification_idempotency_key,
    notificationSentAt: nullableIsoTimestamp(row.notification_sent_at),
    reserved: row.reserved,
    shouldSend: row.should_send,
  }
}

/** Mark delivery complete once and preserve the timestamp across matching retries. */
export async function markInvoiceNotificationSent(
  input: MarkInvoiceNotificationSentInput,
): Promise<InvoiceNotificationResult> {
  const invoiceId = positiveId(input.invoiceId, 'invoiceId')
  const idempotencyKey = requiredText(input.idempotencyKey, 'idempotencyKey')
  const sentAt = timestamp(input.sentAt)

  const [rows] = await sql.transaction((transactionSql) => [
    transactionSql`
      UPDATE invoices
      SET notification_sent_at = COALESCE(notification_sent_at, ${sentAt}::timestamptz)
      WHERE id = ${invoiceId}
        AND notification_idempotency_key = ${idempotencyKey}
      RETURNING
        id AS invoice_id,
        notification_idempotency_key,
        notification_sent_at
    `,
  ])

  const row = firstRow<InvoiceNotificationRow>(
    rows,
    'Invoice not found or notification key does not match its reservation',
  )
  return {
    invoiceId: row.invoice_id,
    idempotencyKey: row.notification_idempotency_key,
    notificationSentAt: isoTimestamp(row.notification_sent_at),
  }
}
