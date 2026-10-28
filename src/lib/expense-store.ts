import { randomUUID } from 'node:crypto'
import { sql } from './db'
import { normalizeExpenseCategory } from './expense-categories'
import {
  computeCategoryTotals,
  createFirestoreExpense,
  deleteFirestoreExpense,
  expenseDocIdForGmailMessage,
  expenseDocIdForSqlId,
  findFirestoreExpenseByGmailMessageId,
  isFirestoreExpenseStoreConfigured,
  listFirestoreExpensesByTaxYear,
  parseDollarAmount,
  updateFirestoreExpense,
  type CategoryTotal,
  type CreateExpenseInput,
  type ExpenseRecord,
  type UpdateExpenseInput,
} from './expense-firestore'
import { putReceipt, RECEIPT_VIEW_PATH } from './receipt-blob'

export interface SqlExpenseRow {
  id: number | string
  date: string | Date
  vendor: string
  description: string
  category: string
  amount: string | number
  tax_year: number | string
  receipt_url?: string | null
  gmail_message_id?: string | null
  source?: string | null
  created_at?: string | Date | null
}

export interface BackfillExpensesResult {
  scanned: number
  upserted: number
  migratedBlobs: number
}

const LEGACY_VERCEL_BLOB_HOST = /\.blob\.vercel-storage\.com$/i

function toIsoDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const str = String(value).trim()
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]
  const parsed = new Date(str)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10)
}

function toIsoTimestamp(value: string | Date | null | undefined): string {
  if (!value) return new Date().toISOString()
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

export function isLegacyVercelBlobUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'https:' && LEGACY_VERCEL_BLOB_HOST.test(parsed.hostname)
  } catch {
    return false
  }
}

function inferReceiptExtension(url: string, contentType: string | null): string {
  const cleanType = contentType?.split(';', 1)[0]?.trim()?.toLowerCase()
  if (cleanType === 'application/pdf') return 'pdf'
  if (cleanType === 'image/jpeg') return 'jpg'
  if (cleanType === 'image/png') return 'png'
  if (cleanType === 'image/webp') return 'webp'
  if (cleanType === 'image/heic') return 'heic'

  const match = new URL(url).pathname.match(/\.(pdf|jpg|jpeg|png|webp|heic)$/i)
  if (!match) return 'pdf'
  const ext = match[1].toLowerCase()
  return ext === 'jpeg' ? 'jpg' : ext
}

/**
 * List expenses and category totals for a tax year.
 * Uses Firestore when configured (`FIRESTORE_PROJECT_ID`), with optional
 * fallback to PostgreSQL when `EXPENSE_FALLBACK_READ_POSTGRES=true` and
 * Firestore has not yet been backfilled for that tax year.
 */
export async function listExpensesByTaxYear(
  taxYear: number | string,
): Promise<{ expenses: unknown[]; totals: CategoryTotal[] }> {
  const year =
    typeof taxYear === 'number' && Number.isFinite(taxYear)
      ? Math.trunc(taxYear)
      : Number.parseInt(String(taxYear), 10) || new Date().getFullYear()

  if (isFirestoreExpenseStoreConfigured()) {
    const result = await listFirestoreExpensesByTaxYear(year)
    if (
      result.expenses.length > 0 ||
      process.env.EXPENSE_FALLBACK_READ_POSTGRES?.trim()?.toLowerCase() !== 'true'
    ) {
      return result
    }
  }

  const expenses = await sql`
    SELECT * FROM expenses
    WHERE tax_year = ${year}
    ORDER BY date DESC
  `

  const totals = (await sql`
    SELECT category, SUM(amount) as total
    FROM expenses
    WHERE tax_year = ${year}
    GROUP BY category
    ORDER BY total DESC
  `) as unknown as CategoryTotal[]

  return { expenses, totals }
}

/**
 * Create a new expense record in Firestore (primary when configured) or PostgreSQL.
 */
export async function createExpenseRecord(
  input: CreateExpenseInput,
): Promise<{ record: ExpenseRecord | Record<string, unknown>; created: boolean }> {
  if (isFirestoreExpenseStoreConfigured()) {
    const created = await createFirestoreExpense(input)
    if (
      created.created &&
      process.env.EXPENSE_DUAL_WRITE_POSTGRES?.trim()?.toLowerCase() === 'true' &&
      process.env.DATABASE_URL
    ) {
      try {
        await sql`
          INSERT INTO expenses (date, vendor, description, category, amount, tax_year, receipt_url, gmail_message_id, source)
          VALUES (
            ${created.record.date},
            ${created.record.vendor},
            ${created.record.description},
            ${created.record.category},
            ${created.record.amount},
            ${created.record.tax_year},
            ${created.record.receipt_url},
            ${created.record.gmail_message_id ?? null},
            ${created.record.source}
          )
          ON CONFLICT (gmail_message_id) DO NOTHING
        `
      } catch (error) {
        console.warn('Dual-write to PostgreSQL expenses failed after Firestore write', {
          error: error instanceof Error ? error.name : 'UnknownError',
        })
      }
    }
    return created
  }

  const normalizedCategory = normalizeExpenseCategory(input.category)
  const taxYear =
    input.tax_year !== undefined && input.tax_year !== null
      ? Number.parseInt(String(input.tax_year), 10)
      : Number.parseInt(String(input.date).slice(0, 4), 10)

  if (input.gmail_message_id) {
    const inserted = await sql`
      INSERT INTO expenses (date, vendor, description, category, amount, tax_year, receipt_url, gmail_message_id, source)
      VALUES (
        ${input.date},
        ${input.vendor},
        ${input.description},
        ${normalizedCategory},
        ${input.amount},
        ${taxYear},
        ${input.receipt_url || null},
        ${input.gmail_message_id},
        ${input.source || 'manual'}
      )
      ON CONFLICT (gmail_message_id) DO NOTHING
      RETURNING *
    `
    return {
      record: (inserted[0] ?? {}) as Record<string, unknown>,
      created: inserted.length > 0,
    }
  }

  const result = await sql`
    INSERT INTO expenses (date, vendor, description, category, amount, tax_year, receipt_url)
    VALUES (
      ${input.date},
      ${input.vendor},
      ${input.description},
      ${normalizedCategory},
      ${input.amount},
      ${taxYear},
      ${input.receipt_url || null}
    )
    RETURNING *
  `
  return {
    record: (result[0] ?? {}) as Record<string, unknown>,
    created: result.length > 0,
  }
}

/** Check if a Gmail message ID has already been logged as an expense. */
export async function hasExpenseForGmailMessageId(gmailMessageId: string): Promise<boolean> {
  if (isFirestoreExpenseStoreConfigured()) {
    const existing = await findFirestoreExpenseByGmailMessageId(gmailMessageId)
    return existing !== null
  }
  const existing = await sql`SELECT id FROM expenses WHERE gmail_message_id = ${gmailMessageId} LIMIT 1`
  return existing.length > 0
}

/** Update an expense by ID in Firestore (when configured) or PostgreSQL. */
export async function updateExpenseRecord(
  id: string | number,
  patch: UpdateExpenseInput,
): Promise<ExpenseRecord | Record<string, unknown> | null> {
  if (isFirestoreExpenseStoreConfigured()) {
    return updateFirestoreExpense(id, patch)
  }

  const rows = await sql`
    UPDATE expenses
    SET date        = COALESCE(${patch.date ?? null}, date),
        vendor      = COALESCE(${patch.vendor ?? null}, vendor),
        description = COALESCE(${patch.description ?? null}, description),
        category    = COALESCE(${patch.category ? normalizeExpenseCategory(patch.category) : null}, category),
        amount      = COALESCE(${patch.amount ?? null}, amount),
        receipt_url = ${patch.receipt_url ?? null}
    WHERE id = ${Number(id)}
    RETURNING *
  `
  return rows.length > 0 ? (rows[0] as Record<string, unknown>) : null
}

/** Delete an expense by ID in Firestore (when configured) or PostgreSQL. */
export async function deleteExpenseRecord(id: string | number): Promise<void> {
  if (isFirestoreExpenseStoreConfigured()) {
    await deleteFirestoreExpense(id)
    return
  }
  await sql`DELETE FROM expenses WHERE id = ${Number(id)}`
}

/**
 * Migrate a legacy `@vercel/blob` receipt URL to private GCS + Firestore
 * metadata, returning the new `/api/receipts/file?path=...` reference and GCS
 * object metadata. Leaves existing `/api/receipts/file` paths untouched.
 */
export async function migrateLegacyReceiptUrlToGcs(
  receiptUrl: string | null | undefined,
  options: {
    gmailMessageId?: string | null
    fetcher?: typeof fetch
  } = {},
): Promise<{
  receiptUrl: string | null
  migrated: boolean
  gcsUri?: string
  sha256?: string
  contentType?: string
  sizeBytes?: number
}> {
  if (!receiptUrl || !receiptUrl.trim()) {
    return { receiptUrl: null, migrated: false }
  }
  const trimmed = receiptUrl.trim()
  if (trimmed.startsWith(RECEIPT_VIEW_PATH)) {
    return { receiptUrl: trimmed, migrated: false }
  }
  if (!isLegacyVercelBlobUrl(trimmed)) {
    return { receiptUrl: trimmed, migrated: false }
  }

  const fetchFn = options.fetcher ?? fetch
  const headers: Record<string, string> = {}
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    headers.Authorization = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN.trim()}`
  }

  const response = await fetchFn(trimmed, {
    headers,
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch legacy blob receipt (${response.status})`)
  }

  const contentType = response.headers.get('content-type') || 'application/pdf'
  const ext = inferReceiptExtension(trimmed, contentType)
  const bytes = Buffer.from(await response.arrayBuffer())
  const pathname = `receipts/migrated/${Date.now()}-${randomUUID()}.${ext}`
  const uploaded = await putReceipt(pathname, bytes, contentType, {
    source: 'migration',
    gmailMessageId: options.gmailMessageId ?? null,
  })

  return {
    receiptUrl: uploaded.reference,
    migrated: true,
    gcsUri: uploaded.object?.gcsUri,
    sha256: uploaded.object?.sha256,
    contentType: uploaded.object?.contentType,
    sizeBytes: uploaded.object?.sizeBytes,
  }
}

/**
 * Idempotently backfill PostgreSQL `expenses` rows (and any legacy Vercel Blob
 * receipt URLs) into Firestore metadata and the private GCS receipt bucket.
 */
export async function backfillExpensesToFirestoreAndGcs(options: {
  rows?: readonly SqlExpenseRow[]
  fetcher?: typeof fetch
} = {}): Promise<BackfillExpensesResult> {
  const rows =
    options.rows ??
    ((await sql`SELECT * FROM expenses ORDER BY id ASC`) as unknown as SqlExpenseRow[])

  let upserted = 0
  let migratedBlobs = 0

  for (const row of rows) {
    const date = toIsoDate(row.date)
    const { amount } = parseDollarAmount(row.amount)
    const taxYear =
      typeof row.tax_year === 'number'
        ? row.tax_year
        : Number.parseInt(String(row.tax_year), 10) || Number.parseInt(date.slice(0, 4), 10)
    const gmailMessageId = row.gmail_message_id?.trim() || null
    const docId = gmailMessageId
      ? expenseDocIdForGmailMessage(gmailMessageId)
      : expenseDocIdForSqlId(row.id)

    const receiptResult = await migrateLegacyReceiptUrlToGcs(row.receipt_url, {
      gmailMessageId,
      fetcher: options.fetcher,
    })
    if (receiptResult.migrated) {
      migratedBlobs++
    }

    await createFirestoreExpense(
      {
        id: docId,
        date,
        vendor: row.vendor,
        description: row.description,
        category: normalizeExpenseCategory(row.category),
        amount,
        tax_year: taxYear,
        receipt_url: receiptResult.receiptUrl,
        receipt_gcs_uri: receiptResult.gcsUri ?? null,
        receipt_sha256: receiptResult.sha256 ?? null,
        receipt_content_type: receiptResult.contentType ?? null,
        receipt_size_bytes: receiptResult.sizeBytes ?? null,
        gmail_message_id: gmailMessageId,
        source: row.source?.trim() || 'postgres-migration',
        created_at: toIsoTimestamp(row.created_at),
      },
      { upsert: true },
    )
    upserted++
  }

  return {
    scanned: rows.length,
    upserted,
    migratedBlobs,
  }
}

export { computeCategoryTotals }
