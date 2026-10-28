import { createHash, randomUUID } from 'node:crypto'
import { GoogleAuth } from 'google-auth-library'
import { normalizeExpenseCategory, type ExpenseCategory } from './expense-categories'

const FIRESTORE_API_BASE = 'https://firestore.googleapis.com/v1'
const DEFAULT_DATABASE_ID = '(default)'
const DEFAULT_EXPENSES_COLLECTION = 'expenses'
const DEFAULT_RECEIPTS_COLLECTION = 'receipts'
const FIRESTORE_REQUEST_TIMEOUT_MS = 10_000

export interface FirestoreExpenseConfig {
  projectId: string
  databaseId: string
  expensesCollection: string
  receiptsCollection: string
}

export interface ExpenseRecord {
  id: string | number
  date: string
  vendor: string
  description: string
  category: ExpenseCategory
  /** Formatted two-decimal dollar amount ("12.34") matching PostgreSQL NUMERIC(10, 2). */
  amount: string
  /** Integer cents (1234) for exact category and tax-year summation. */
  amount_cents: number
  tax_year: number
  receipt_url: string | null
  receipt_gcs_uri?: string | null
  receipt_sha256?: string | null
  receipt_content_type?: string | null
  receipt_size_bytes?: number | null
  gmail_message_id?: string | null
  source: string
  created_at: string
  updated_at: string
}

export interface CategoryTotal {
  category: string
  total: string
}

export interface CreateExpenseInput {
  id?: string | number
  date: string
  vendor: string
  description: string
  category: string
  amount: number | string
  tax_year?: number | string
  receipt_url?: string | null
  receipt_gcs_uri?: string | null
  receipt_sha256?: string | null
  receipt_content_type?: string | null
  receipt_size_bytes?: number | null
  gmail_message_id?: string | null
  source?: string | null
  created_at?: string
}

export interface UpdateExpenseInput {
  date?: string | null
  vendor?: string | null
  description?: string | null
  category?: string | null
  amount?: number | string | null
  receipt_url?: string | null
}

export interface ReceiptMetadataRecord {
  id: string
  object_path: string
  bucket: string
  gcs_uri: string
  view_url: string
  content_type: string
  size_bytes: number
  sha256: string
  source: string
  gmail_message_id: string | null
  uploaded_at: string
}

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }

interface FirestoreDocument {
  name?: string
  fields?: Record<string, FirestoreValue>
  createTime?: string
  updateTime?: string
}

export class FirestoreExpenseStoreError extends Error {
  readonly status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = 'FirestoreExpenseStoreError'
    this.status = status
  }
}

/**
 * True when Firestore is configured as the metadata store for bills, expenses,
 * and receipts (`FIRESTORE_PROJECT_ID` set, or `EXPENSE_STORE_BACKEND=firestore`
 * alongside a GCP project identifier).
 */
export function isFirestoreExpenseStoreConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const explicitProject = env.FIRESTORE_PROJECT_ID?.trim()
  if (explicitProject) return true
  if (env.EXPENSE_STORE_BACKEND?.trim()?.toLowerCase() === 'firestore') {
    return Boolean(env.GCP_PROJECT_ID?.trim() || env.GOOGLE_CLOUD_PROJECT?.trim())
  }
  return false
}

export function getFirestoreExpenseConfig(
  env: NodeJS.ProcessEnv = process.env,
): FirestoreExpenseConfig {
  const projectId =
    env.FIRESTORE_PROJECT_ID?.trim() ||
    env.GCP_PROJECT_ID?.trim() ||
    env.GOOGLE_CLOUD_PROJECT?.trim()
  if (!projectId) {
    throw new FirestoreExpenseStoreError('FIRESTORE_PROJECT_ID is not configured', 500)
  }

  return {
    projectId,
    databaseId: env.FIRESTORE_DATABASE_ID?.trim() || DEFAULT_DATABASE_ID,
    expensesCollection:
      env.FIRESTORE_EXPENSES_COLLECTION?.trim() || DEFAULT_EXPENSES_COLLECTION,
    receiptsCollection:
      env.FIRESTORE_RECEIPTS_COLLECTION?.trim() || DEFAULT_RECEIPTS_COLLECTION,
  }
}

let googleAuth: GoogleAuth | null = null
let tokenSupplierOverride: (() => Promise<string>) | null = null

/** Test hook to supply a deterministic bearer token without hitting ADC metadata. */
export function __setFirestoreTokenSupplierForTests(
  supplier: (() => Promise<string>) | null,
): void {
  tokenSupplierOverride = supplier
}

async function getAccessToken(): Promise<string> {
  if (tokenSupplierOverride) return tokenSupplierOverride()
  if (process.env.FIRESTORE_EMULATOR_HOST?.trim()) return 'emulator-token'
  googleAuth ??= new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/datastore'],
  })
  const token = await googleAuth.getAccessToken()
  if (!token) {
    throw new FirestoreExpenseStoreError(
      'Unable to obtain Google Cloud access token for Firestore',
      503,
    )
  }
  return token
}

function documentsBaseUrl(config: FirestoreExpenseConfig): string {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim()
  const origin = emulatorHost ? `http://${emulatorHost}/v1` : FIRESTORE_API_BASE
  const project = encodeURIComponent(config.projectId)
  const db = encodeURIComponent(config.databaseId)
  return `${origin}/projects/${project}/databases/${db}/documents`
}

async function firestoreFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(FIRESTORE_REQUEST_TIMEOUT_MS),
  })
}

/** Parse a dollar value (number or string) into integer cents and a 2-decimal string. */
export function parseDollarAmount(raw: unknown): { amount: string; amountCents: number } {
  const normalized =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number(raw.replace(/[$,\s]/g, ''))
        : Number.NaN
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new FirestoreExpenseStoreError('Expense amount must be a non-negative number', 400)
  }
  const amountCents = Math.round(normalized * 100)
  return {
    amount: (amountCents / 100).toFixed(2),
    amountCents,
  }
}

export function normalizeExpenseDate(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new FirestoreExpenseStoreError('Expense date is required', 400)
  }
  const match = raw.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    throw new FirestoreExpenseStoreError('Expense date is invalid', 400)
  }
  return parsed.toISOString().slice(0, 10)
}

/** Deterministic, URL-safe Firestore document ID for a receipt object path. */
export function receiptDocIdForPath(objectPath: string): string {
  return `rcpt_${createHash('sha256').update(objectPath.trim()).digest('hex').slice(0, 40)}`
}

/** Deterministic Firestore document ID for a Gmail message ID. */
export function expenseDocIdForGmailMessage(gmailMessageId: string): string {
  const cleaned = gmailMessageId.trim()
  if (/^[A-Za-z0-9_-]{1,96}$/.test(cleaned)) {
    return `gmail_${cleaned}`
  }
  return `gmail_${createHash('sha256').update(cleaned).digest('hex').slice(0, 40)}`
}

/** Deterministic Firestore document ID for a migrated PostgreSQL expense row. */
export function expenseDocIdForSqlId(sqlId: number | string): string {
  return `sql_${String(sqlId).trim()}`
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) }
    return { doubleValue: value }
  }
  return { stringValue: String(value) }
}

function decodeString(value: FirestoreValue | undefined): string | null {
  if (!value) return null
  if ('stringValue' in value) return value.stringValue
  if ('timestampValue' in value) return value.timestampValue
  if ('integerValue' in value) return value.integerValue
  if ('doubleValue' in value) return String(value.doubleValue)
  return null
}

function decodeInteger(value: FirestoreValue | undefined): number | null {
  if (!value) return null
  if ('integerValue' in value) {
    const parsed = Number.parseInt(value.integerValue, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  if ('doubleValue' in value && Number.isFinite(value.doubleValue)) {
    return Math.round(value.doubleValue)
  }
  if ('stringValue' in value) {
    const parsed = Number.parseInt(value.stringValue, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function extractDocId(name: string | undefined, fallback: string): string {
  if (!name) return fallback
  const slash = name.lastIndexOf('/')
  return slash >= 0 ? decodeURIComponent(name.slice(slash + 1)) : name
}

function documentToExpenseRecord(doc: FirestoreDocument, fallbackId = ''): ExpenseRecord {
  const fields = doc.fields ?? {}
  const docId = decodeString(fields.id) ?? extractDocId(doc.name, fallbackId)
  const date = decodeString(fields.date) ?? new Date().toISOString().slice(0, 10)
  const rawCents = decodeInteger(fields.amount_cents)
  const rawAmountStr = decodeString(fields.amount)
  const parsed = parseDollarAmount(
    rawCents !== null ? rawCents / 100 : rawAmountStr ?? 0,
  )
  const taxYear =
    decodeInteger(fields.tax_year) ?? Number.parseInt(date.slice(0, 4), 10)

  return {
    id: /^\d+$/.test(docId) ? Number.parseInt(docId, 10) : docId,
    date,
    vendor: decodeString(fields.vendor) ?? '',
    description: decodeString(fields.description) ?? '',
    category: normalizeExpenseCategory(decodeString(fields.category)),
    amount: parsed.amount,
    amount_cents: parsed.amountCents,
    tax_year: taxYear,
    receipt_url: decodeString(fields.receipt_url),
    receipt_gcs_uri: decodeString(fields.receipt_gcs_uri),
    receipt_sha256: decodeString(fields.receipt_sha256),
    receipt_content_type: decodeString(fields.receipt_content_type),
    receipt_size_bytes: decodeInteger(fields.receipt_size_bytes),
    gmail_message_id: decodeString(fields.gmail_message_id),
    source: decodeString(fields.source) ?? 'manual',
    created_at:
      decodeString(fields.created_at) ?? doc.createTime ?? new Date().toISOString(),
    updated_at:
      decodeString(fields.updated_at) ?? doc.updateTime ?? new Date().toISOString(),
  }
}

function documentToReceiptMetadata(
  doc: FirestoreDocument,
  fallbackId = '',
): ReceiptMetadataRecord {
  const fields = doc.fields ?? {}
  const id = decodeString(fields.id) ?? extractDocId(doc.name, fallbackId)
  return {
    id,
    object_path: decodeString(fields.object_path) ?? '',
    bucket: decodeString(fields.bucket) ?? '',
    gcs_uri: decodeString(fields.gcs_uri) ?? '',
    view_url: decodeString(fields.view_url) ?? '',
    content_type: decodeString(fields.content_type) ?? 'application/octet-stream',
    size_bytes: decodeInteger(fields.size_bytes) ?? 0,
    sha256: decodeString(fields.sha256) ?? '',
    source: decodeString(fields.source) ?? 'admin-upload',
    gmail_message_id: decodeString(fields.gmail_message_id),
    uploaded_at:
      decodeString(fields.uploaded_at) ?? doc.createTime ?? new Date().toISOString(),
  }
}

/** Compute per-category totals sorted descending by total amount. */
export function computeCategoryTotals(expenses: readonly ExpenseRecord[]): CategoryTotal[] {
  const byCategoryCents = new Map<string, number>()
  for (const expense of expenses) {
    const cents =
      typeof expense.amount_cents === 'number' && Number.isFinite(expense.amount_cents)
        ? expense.amount_cents
        : parseDollarAmount(expense.amount).amountCents
    byCategoryCents.set(
      expense.category,
      (byCategoryCents.get(expense.category) ?? 0) + cents,
    )
  }

  return [...byCategoryCents.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([category, cents]) => ({
      category,
      total: (cents / 100).toFixed(2),
    }))
}

/**
 * Persist structured receipt metadata in Firestore alongside the GCS object.
 */
export async function recordFirestoreReceiptMetadata(
  input: Omit<ReceiptMetadataRecord, 'id' | 'uploaded_at'> & {
    id?: string
    uploaded_at?: string
  },
): Promise<ReceiptMetadataRecord> {
  const config = getFirestoreExpenseConfig()
  const id = input.id ?? receiptDocIdForPath(input.object_path)
  const uploadedAt = input.uploaded_at ?? new Date().toISOString()
  const url = `${documentsBaseUrl(config)}/${encodeURIComponent(config.receiptsCollection)}/${encodeURIComponent(id)}`

  const body: FirestoreDocument = {
    fields: {
      id: encodeValue(id),
      object_path: encodeValue(input.object_path),
      bucket: encodeValue(input.bucket),
      gcs_uri: encodeValue(input.gcs_uri),
      view_url: encodeValue(input.view_url),
      content_type: encodeValue(input.content_type),
      size_bytes: encodeValue(input.size_bytes),
      sha256: encodeValue(input.sha256),
      source: encodeValue(input.source),
      gmail_message_id: encodeValue(input.gmail_message_id ?? null),
      uploaded_at: encodeValue(uploadedAt),
    },
  }

  const response = await firestoreFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new FirestoreExpenseStoreError(
      `Failed to write receipt metadata to Firestore (status ${response.status})`,
      response.status === 404 ? 404 : 502,
    )
  }

  const doc = (await response.json()) as FirestoreDocument
  return documentToReceiptMetadata(doc, id)
}

/** Read structured receipt metadata by GCS object path, or null if absent. */
export async function getFirestoreReceiptMetadata(
  objectPath: string,
): Promise<ReceiptMetadataRecord | null> {
  const config = getFirestoreExpenseConfig()
  const id = receiptDocIdForPath(objectPath)
  const url = `${documentsBaseUrl(config)}/${encodeURIComponent(config.receiptsCollection)}/${encodeURIComponent(id)}`
  const response = await firestoreFetch(url, { method: 'GET' })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new FirestoreExpenseStoreError(
      `Failed to read receipt metadata from Firestore (status ${response.status})`,
      502,
    )
  }
  const doc = (await response.json()) as FirestoreDocument
  return documentToReceiptMetadata(doc, id)
}

/** List all expenses for a tax year from Firestore and compute category totals. */
export async function listFirestoreExpensesByTaxYear(
  taxYear: number,
): Promise<{ expenses: ExpenseRecord[]; totals: CategoryTotal[] }> {
  const config = getFirestoreExpenseConfig()
  const url = `${documentsBaseUrl(config)}:runQuery`

  const response = await firestoreFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: config.expensesCollection }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'tax_year' },
            op: 'EQUAL',
            value: { integerValue: String(Math.trunc(taxYear)) },
          },
        },
      },
    }),
  })

  if (!response.ok) {
    throw new FirestoreExpenseStoreError(
      `Failed to query expenses from Firestore (status ${response.status})`,
      502,
    )
  }

  const rows = (await response.json()) as Array<{ document?: FirestoreDocument }>
  const expenses = rows
    .filter((row): row is { document: FirestoreDocument } => Boolean(row.document))
    .map((row) => documentToExpenseRecord(row.document))
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))

  return {
    expenses,
    totals: computeCategoryTotals(expenses),
  }
}

/** Check whether an expense already exists for a Gmail message ID. */
export async function findFirestoreExpenseByGmailMessageId(
  gmailMessageId: string,
): Promise<ExpenseRecord | null> {
  const config = getFirestoreExpenseConfig()
  const docId = expenseDocIdForGmailMessage(gmailMessageId)
  const directUrl = `${documentsBaseUrl(config)}/${encodeURIComponent(config.expensesCollection)}/${encodeURIComponent(docId)}`

  const direct = await firestoreFetch(directUrl, { method: 'GET' })
  if (direct.ok) {
    return documentToExpenseRecord((await direct.json()) as FirestoreDocument, docId)
  }
  if (direct.status !== 404) {
    throw new FirestoreExpenseStoreError(
      `Failed to check Gmail message deduplication in Firestore (status ${direct.status})`,
      502,
    )
  }

  // Fallback query for any legacy document that stored gmail_message_id under a non-gmail_* ID.
  const queryUrl = `${documentsBaseUrl(config)}:runQuery`
  const queryRes = await firestoreFetch(queryUrl, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: config.expensesCollection }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'gmail_message_id' },
            op: 'EQUAL',
            value: { stringValue: gmailMessageId.trim() },
          },
        },
        limit: 1,
      },
    }),
  })
  if (!queryRes.ok) {
    throw new FirestoreExpenseStoreError(
      `Failed to query Gmail message ID in Firestore (status ${queryRes.status})`,
      502,
    )
  }
  const matches = (await queryRes.json()) as Array<{ document?: FirestoreDocument }>
  const first = matches.find((row) => Boolean(row.document))?.document
  return first ? documentToExpenseRecord(first) : null
}

/**
 * Create (or idempotently upsert) an expense document in Firestore.
 * Returns `{ record, created }` where `created` is false when a duplicate
 * `gmail_message_id` precondition rejected an overlapping cron insert.
 */
export async function createFirestoreExpense(
  input: CreateExpenseInput,
  options: { upsert?: boolean } = {},
): Promise<{ record: ExpenseRecord; created: boolean }> {
  const config = getFirestoreExpenseConfig()
  const date = normalizeExpenseDate(input.date)
  const vendor = typeof input.vendor === 'string' ? input.vendor.trim() : ''
  if (!vendor) {
    throw new FirestoreExpenseStoreError('Expense vendor is required', 400)
  }
  const description =
    typeof input.description === 'string' && input.description.trim()
      ? input.description.trim()
      : vendor
  const category = normalizeExpenseCategory(input.category)
  const { amount, amountCents } = parseDollarAmount(input.amount)
  const rawTaxYear =
    input.tax_year !== undefined && input.tax_year !== null
      ? Number.parseInt(String(input.tax_year), 10)
      : Number.parseInt(date.slice(0, 4), 10)
  const taxYear = Number.isFinite(rawTaxYear)
    ? rawTaxYear
    : Number.parseInt(date.slice(0, 4), 10)

  const gmailMessageId =
    typeof input.gmail_message_id === 'string' && input.gmail_message_id.trim()
      ? input.gmail_message_id.trim()
      : null
  const docId =
    input.id !== undefined && input.id !== null && String(input.id).trim()
      ? String(input.id).trim()
      : gmailMessageId
        ? expenseDocIdForGmailMessage(gmailMessageId)
        : `exp_${Date.now()}_${randomUUID().slice(0, 8)}`

  const now = new Date().toISOString()
  const createdAt = input.created_at ?? now
  const body: FirestoreDocument = {
    fields: {
      id: encodeValue(docId),
      date: encodeValue(date),
      vendor: encodeValue(vendor),
      description: encodeValue(description),
      category: encodeValue(category),
      amount: encodeValue(amount),
      amount_cents: encodeValue(amountCents),
      tax_year: encodeValue(taxYear),
      receipt_url: encodeValue(input.receipt_url || null),
      receipt_gcs_uri: encodeValue(input.receipt_gcs_uri || null),
      receipt_sha256: encodeValue(input.receipt_sha256 || null),
      receipt_content_type: encodeValue(input.receipt_content_type || null),
      receipt_size_bytes: encodeValue(input.receipt_size_bytes ?? null),
      gmail_message_id: encodeValue(gmailMessageId),
      source: encodeValue(input.source?.trim() || 'manual'),
      created_at: encodeValue(createdAt),
      updated_at: encodeValue(now),
    },
  }

  const base = `${documentsBaseUrl(config)}/${encodeURIComponent(config.expensesCollection)}`
  const url = options.upsert
    ? `${base}/${encodeURIComponent(docId)}`
    : `${base}?documentId=${encodeURIComponent(docId)}`

  const response = await firestoreFetch(url, {
    method: options.upsert ? 'PATCH' : 'POST',
    body: JSON.stringify(body),
  })

  if (response.status === 409 && gmailMessageId) {
    const existing = await findFirestoreExpenseByGmailMessageId(gmailMessageId)
    if (existing) return { record: existing, created: false }
  }

  if (!response.ok) {
    throw new FirestoreExpenseStoreError(
      `Failed to create expense in Firestore (status ${response.status})`,
      response.status === 409 ? 409 : 502,
    )
  }

  const doc = (await response.json()) as FirestoreDocument
  return { record: documentToExpenseRecord(doc, docId), created: true }
}

/** Update an existing expense in Firestore, returning the updated record or null on 404. */
export async function updateFirestoreExpense(
  id: string | number,
  patch: UpdateExpenseInput,
): Promise<ExpenseRecord | null> {
  const config = getFirestoreExpenseConfig()
  const docId = String(id).trim()
  if (!docId) return null

  const fields: Record<string, FirestoreValue> = {
    updated_at: encodeValue(new Date().toISOString()),
  }
  const maskParams = ['updateMask.fieldPaths=updated_at']

  if (patch.date !== undefined && patch.date !== null) {
    const date = normalizeExpenseDate(patch.date)
    fields.date = encodeValue(date)
    maskParams.push('updateMask.fieldPaths=date')
  }
  if (patch.vendor !== undefined && patch.vendor !== null) {
    fields.vendor = encodeValue(String(patch.vendor).trim())
    maskParams.push('updateMask.fieldPaths=vendor')
  }
  if (patch.description !== undefined && patch.description !== null) {
    fields.description = encodeValue(String(patch.description).trim())
    maskParams.push('updateMask.fieldPaths=description')
  }
  if (patch.category !== undefined && patch.category !== null) {
    fields.category = encodeValue(normalizeExpenseCategory(patch.category))
    maskParams.push('updateMask.fieldPaths=category')
  }
  if (patch.amount !== undefined && patch.amount !== null) {
    const { amount, amountCents } = parseDollarAmount(patch.amount)
    fields.amount = encodeValue(amount)
    fields.amount_cents = encodeValue(amountCents)
    maskParams.push('updateMask.fieldPaths=amount', 'updateMask.fieldPaths=amount_cents')
  }
  if (patch.receipt_url !== undefined) {
    fields.receipt_url = encodeValue(patch.receipt_url || null)
    maskParams.push('updateMask.fieldPaths=receipt_url')
  }

  maskParams.push('currentDocument.exists=true')
  const url = `${documentsBaseUrl(config)}/${encodeURIComponent(config.expensesCollection)}/${encodeURIComponent(docId)}?${maskParams.join('&')}`

  const response = await firestoreFetch(url, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new FirestoreExpenseStoreError(
      `Failed to update expense in Firestore (status ${response.status})`,
      502,
    )
  }

  const doc = (await response.json()) as FirestoreDocument
  return documentToExpenseRecord(doc, docId)
}

/** Delete an expense document from Firestore. */
export async function deleteFirestoreExpense(id: string | number): Promise<void> {
  const config = getFirestoreExpenseConfig()
  const docId = String(id).trim()
  if (!docId) return
  const url = `${documentsBaseUrl(config)}/${encodeURIComponent(config.expensesCollection)}/${encodeURIComponent(docId)}`
  const response = await firestoreFetch(url, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) {
    throw new FirestoreExpenseStoreError(
      `Failed to delete expense from Firestore (status ${response.status})`,
      502,
    )
  }
}
