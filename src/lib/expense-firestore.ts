import { randomUUID } from 'node:crypto'
import {
  __setFirestoreTokenSupplierForTests,
  documentToExpenseRecord,
  documentToReceiptMetadata,
  documentsBaseUrl,
  encodeValue,
  expenseDocIdForGmailMessage,
  expenseDocIdForSqlId,
  FirestoreExpenseStoreError,
  firestoreFetch,
  getFirestoreExpenseConfig,
  isFirestoreExpenseStoreConfigured,
  normalizeExpenseDate,
  parseDollarAmount,
  receiptDocIdForPath,
  resolveExpenseCategory,
  type CategoryTotal,
  type CreateExpenseInput,
  type ExpenseRecord,
  type FirestoreDocument,
  type FirestoreExpenseConfig,
  type FirestoreValue,
  type ReceiptMetadataRecord,
  type UpdateExpenseInput,
} from './expense-firestore-rest'

export {
  __setFirestoreTokenSupplierForTests,
  documentToExpenseRecord,
  documentToReceiptMetadata,
  expenseDocIdForGmailMessage,
  expenseDocIdForSqlId,
  FirestoreExpenseStoreError,
  getFirestoreExpenseConfig,
  isFirestoreExpenseStoreConfigured,
  normalizeExpenseDate,
  parseDollarAmount,
  receiptDocIdForPath,
  resolveExpenseCategory,
  type CategoryTotal,
  type CreateExpenseInput,
  type ExpenseRecord,
  type FirestoreExpenseConfig,
  type ReceiptMetadataRecord,
  type UpdateExpenseInput,
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

/** Read an expense document by ID from Firestore, or null if absent. */
export async function getFirestoreExpenseById(
  id: string | number,
): Promise<ExpenseRecord | null> {
  const config = getFirestoreExpenseConfig()
  const docId = String(id).trim()
  if (!docId) return null
  const url = `${documentsBaseUrl(config)}/${encodeURIComponent(config.expensesCollection)}/${encodeURIComponent(docId)}`
  const response = await firestoreFetch(url, { method: 'GET' })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new FirestoreExpenseStoreError(
      `Failed to read expense from Firestore (status ${response.status})`,
      502,
    )
  }
  const doc = (await response.json()) as FirestoreDocument
  return documentToExpenseRecord(doc, docId)
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
  const docId = expenseDocIdForGmailMessage(gmailMessageId)
  const direct = await getFirestoreExpenseById(docId)
  if (direct) return direct

  // Fallback query for any legacy document that stored gmail_message_id under a non-gmail_* ID.
  const config = getFirestoreExpenseConfig()
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
  const category = resolveExpenseCategory(input.category, Boolean(input.allowLegacyCategory))
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

  let updatedDate: string | null = null
  if (patch.date !== undefined && patch.date !== null) {
    updatedDate = normalizeExpenseDate(patch.date)
    fields.date = encodeValue(updatedDate)
    maskParams.push('updateMask.fieldPaths=date')
  }
  if (patch.tax_year !== undefined && patch.tax_year !== null) {
    const parsedYear = Number.parseInt(String(patch.tax_year), 10)
    if (!Number.isInteger(parsedYear) || parsedYear < 1970 || parsedYear > 2100) {
      throw new FirestoreExpenseStoreError('Expense tax_year is invalid', 400)
    }
    fields.tax_year = encodeValue(parsedYear)
    maskParams.push('updateMask.fieldPaths=tax_year')
  } else if (updatedDate) {
    fields.tax_year = encodeValue(Number.parseInt(updatedDate.slice(0, 4), 10))
    maskParams.push('updateMask.fieldPaths=tax_year')
  }
  if (patch.vendor !== undefined && patch.vendor !== null) {
    const vendor = String(patch.vendor).trim()
    if (!vendor) {
      throw new FirestoreExpenseStoreError('Expense vendor is required', 400)
    }
    fields.vendor = encodeValue(vendor)
    maskParams.push('updateMask.fieldPaths=vendor')
  }
  if (patch.description !== undefined && patch.description !== null) {
    fields.description = encodeValue(String(patch.description).trim())
    maskParams.push('updateMask.fieldPaths=description')
  }
  if (patch.category !== undefined && patch.category !== null) {
    fields.category = encodeValue(resolveExpenseCategory(patch.category, false))
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
