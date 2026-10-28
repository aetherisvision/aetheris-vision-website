import { createHash } from 'node:crypto'
import { GoogleAuth } from 'google-auth-library'
import {
  normalizeExpenseCategory,
  validateStrictExpenseCategory,
  type ExpenseCategory,
} from './expense-categories'

const FIRESTORE_API_BASE = 'https://firestore.googleapis.com/v1'
const DEFAULT_DATABASE_ID = '(default)'
const DEFAULT_EXPENSES_COLLECTION = 'expenses'
const DEFAULT_RECEIPTS_COLLECTION = 'receipts'
const FIRESTORE_REQUEST_TIMEOUT_MS = 10_000
const STRICT_DECIMAL_AMOUNT_RE = /^\d+(?:\.\d{1,2})?$/

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
  date: string | Date
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
  /** When true, maps legacy category aliases and defaults unknown categories to 'Other'. */
  allowLegacyCategory?: boolean
}

export interface UpdateExpenseInput {
  date?: string | null
  vendor?: string | null
  description?: string | null
  category?: string | null
  amount?: number | string | null
  tax_year?: number | string | null
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

export type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }

export interface FirestoreDocument {
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

export function documentsBaseUrl(config: FirestoreExpenseConfig): string {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim()
  const origin = emulatorHost ? `http://${emulatorHost}/v1` : FIRESTORE_API_BASE
  const project = encodeURIComponent(config.projectId)
  const db = encodeURIComponent(config.databaseId)
  return `${origin}/projects/${project}/databases/${db}/documents`
}

export async function firestoreFetch(
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

/**
 * Strictly parse a dollar value (finite non-negative number or decimal string
 * with at most two fractional digits) into integer cents and a 2-decimal string.
 * Rejects blank strings, hex/scientific notation (`"0x1A"`, `"1e3"`), and negative numbers.
 */
export function parseDollarAmount(raw: unknown): { amount: string; amountCents: number } {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) {
      throw new FirestoreExpenseStoreError('Expense amount must be a non-negative number', 400)
    }
    const scaled = raw * 100
    const amountCents = Math.round(scaled)
    if (Math.abs(scaled - amountCents) > 1e-6) {
      throw new FirestoreExpenseStoreError(
        'Expense amount must have at most two decimal places',
        400,
      )
    }
    return {
      amount: (amountCents / 100).toFixed(2),
      amountCents,
    }
  }

  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/^\$\s*/, '').replace(/,/g, '')
    if (!cleaned || !STRICT_DECIMAL_AMOUNT_RE.test(cleaned)) {
      throw new FirestoreExpenseStoreError(
        'Expense amount must be a non-negative decimal dollar amount',
        400,
      )
    }
    const [wholePart, fracPart = ''] = cleaned.split('.')
    const whole = Number.parseInt(wholePart, 10)
    const frac = Number.parseInt(fracPart.padEnd(2, '0'), 10)
    const amountCents = whole * 100 + frac
    if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
      throw new FirestoreExpenseStoreError('Expense amount is out of range', 400)
    }
    return {
      amount: (amountCents / 100).toFixed(2),
      amountCents,
    }
  }

  throw new FirestoreExpenseStoreError('Expense amount must be a non-negative number', 400)
}

function isValidCalendarYmd(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || year < 1970 || year > 2100) return false
  if (!Number.isInteger(month) || month < 1 || month > 12) return false
  if (!Number.isInteger(day) || day < 1 || day > 31) return false
  const utc = new Date(Date.UTC(year, month - 1, day))
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  )
}

/**
 * Normalize a `Date` or date string into a verified `YYYY-MM-DD` calendar date.
 * Rejects impossible calendar dates such as `2026-13-45` or `2026-02-30`.
 */
export function normalizeExpenseDate(raw: unknown): string {
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) {
      throw new FirestoreExpenseStoreError('Expense date is invalid', 400)
    }
    return raw.toISOString().slice(0, 10)
  }

  if (typeof raw !== 'string' || !raw.trim()) {
    throw new FirestoreExpenseStoreError('Expense date is required', 400)
  }

  const trimmed = raw.trim()
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/)
  if (ymdMatch) {
    const year = Number.parseInt(ymdMatch[1], 10)
    const month = Number.parseInt(ymdMatch[2], 10)
    const day = Number.parseInt(ymdMatch[3], 10)
    if (!isValidCalendarYmd(year, month, day)) {
      throw new FirestoreExpenseStoreError('Expense date is invalid', 400)
    }
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    throw new FirestoreExpenseStoreError('Expense date is invalid', 400)
  }
  return parsed.toISOString().slice(0, 10)
}

export function resolveExpenseCategory(
  raw: unknown,
  allowLegacyCategory = false,
): ExpenseCategory {
  if (allowLegacyCategory) {
    return normalizeExpenseCategory(raw)
  }
  const strict = validateStrictExpenseCategory(raw)
  if (!strict) {
    throw new FirestoreExpenseStoreError('Expense category is invalid', 400)
  }
  return strict
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

export function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) }
    return { doubleValue: value }
  }
  return { stringValue: String(value) }
}

export function decodeString(value: FirestoreValue | undefined): string | null {
  if (!value) return null
  if ('stringValue' in value) return value.stringValue
  if ('timestampValue' in value) return value.timestampValue
  if ('integerValue' in value) return value.integerValue
  if ('doubleValue' in value) return String(value.doubleValue)
  return null
}

export function decodeInteger(value: FirestoreValue | undefined): number | null {
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

/**
 * Decode a Firestore document into a typed ExpenseRecord.
 * Fails closed (`FirestoreExpenseStoreError` with status 502) if required
 * fields (`date`, `vendor`, or `amount`/`amount_cents`) are missing or corrupt.
 */
export function documentToExpenseRecord(
  doc: FirestoreDocument,
  fallbackId = '',
): ExpenseRecord {
  const fields = doc.fields ?? {}
  const docId = decodeString(fields.id) ?? extractDocId(doc.name, fallbackId)
  const rawDate = decodeString(fields.date)
  const rawVendor = decodeString(fields.vendor)?.trim() ?? ''
  const rawCents = decodeInteger(fields.amount_cents)
  const rawAmountStr = decodeString(fields.amount)

  if (!docId || !rawDate || !rawVendor || (rawCents === null && !rawAmountStr)) {
    throw new FirestoreExpenseStoreError(
      'Stored Firestore expense document is missing required fields',
      502,
    )
  }

  let date: string
  let parsedAmount: { amount: string; amountCents: number }
  try {
    date = normalizeExpenseDate(rawDate)
    parsedAmount =
      rawCents !== null && rawCents >= 0
        ? { amount: (rawCents / 100).toFixed(2), amountCents: rawCents }
        : parseDollarAmount(rawAmountStr)
  } catch {
    throw new FirestoreExpenseStoreError(
      'Stored Firestore expense document has invalid date or amount',
      502,
    )
  }

  const taxYear =
    decodeInteger(fields.tax_year) ?? Number.parseInt(date.slice(0, 4), 10)
  const timestampFallback = doc.createTime ?? doc.updateTime ?? `${date}T00:00:00.000Z`

  return {
    id: /^\d+$/.test(docId) ? Number.parseInt(docId, 10) : docId,
    date,
    vendor: rawVendor,
    description: decodeString(fields.description)?.trim() || rawVendor,
    category: normalizeExpenseCategory(decodeString(fields.category)),
    amount: parsedAmount.amount,
    amount_cents: parsedAmount.amountCents,
    tax_year: taxYear,
    receipt_url: decodeString(fields.receipt_url),
    receipt_gcs_uri: decodeString(fields.receipt_gcs_uri),
    receipt_sha256: decodeString(fields.receipt_sha256),
    receipt_content_type: decodeString(fields.receipt_content_type),
    receipt_size_bytes: decodeInteger(fields.receipt_size_bytes),
    gmail_message_id: decodeString(fields.gmail_message_id),
    source: decodeString(fields.source) ?? 'manual',
    created_at: decodeString(fields.created_at) ?? timestampFallback,
    updated_at: decodeString(fields.updated_at) ?? doc.updateTime ?? timestampFallback,
  }
}

export function documentToReceiptMetadata(
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
