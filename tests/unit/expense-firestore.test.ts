import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EXPENSE_CATEGORIES,
  normalizeExpenseCategory,
} from '@/lib/expense-categories'
import {
  __setFirestoreTokenSupplierForTests,
  computeCategoryTotals,
  createFirestoreExpense,
  deleteFirestoreExpense,
  expenseDocIdForGmailMessage,
  expenseDocIdForSqlId,
  findFirestoreExpenseByGmailMessageId,
  getFirestoreExpenseConfig,
  getFirestoreReceiptMetadata,
  isFirestoreExpenseStoreConfigured,
  listFirestoreExpensesByTaxYear,
  normalizeExpenseDate,
  parseDollarAmount,
  receiptDocIdForPath,
  recordFirestoreReceiptMetadata,
  updateFirestoreExpense,
} from '@/lib/expense-firestore'
import {
  backfillExpensesToFirestoreAndGcs,
  isLegacyVercelBlobUrl,
  listExpensesByTaxYear,
  migrateLegacyReceiptUrlToGcs,
} from '@/lib/expense-store'

const gcsMocks = vi.hoisted(() => ({
  putGcsReceipt: vi.fn(),
  isValidReceiptPathname: vi.fn(
    (p: unknown) =>
      typeof p === 'string' &&
      !p.includes('..') &&
      !p.startsWith('receipts//') &&
      /^receipts\/[A-Za-z0-9._/-]{1,200}$/.test(p),
  ),
}))

const dbMocks = vi.hoisted(() => ({
  sql: vi.fn(),
}))

vi.mock('@/lib/receipt-gcs', () => ({
  putGcsReceipt: gcsMocks.putGcsReceipt,
  isValidReceiptPathname: gcsMocks.isValidReceiptPathname,
}))

vi.mock('@/lib/db', () => ({
  sql: dbMocks.sql,
}))

describe('expense categories and normalization', () => {
  it('keeps canonical categories and maps legacy aliases', () => {
    expect(EXPENSE_CATEGORIES).toContain('Cloud Services')
    expect(EXPENSE_CATEGORIES).toContain('Equipment & Hardware')
    expect(normalizeExpenseCategory('Cloud Services')).toBe('Cloud Services')
    expect(normalizeExpenseCategory('Software/SaaS')).toBe('Software Subscriptions')
    expect(normalizeExpenseCategory('AI/API')).toBe('Cloud Services')
    expect(normalizeExpenseCategory('Office & Equipment')).toBe('Equipment & Hardware')
    expect(normalizeExpenseCategory('Unlisted Category')).toBe('Other')
    expect(normalizeExpenseCategory('')).toBe('Other')
    expect(normalizeExpenseCategory(null)).toBe('Other')
  })

  it('parses dollar strings and numbers into exact integer cents', () => {
    expect(parseDollarAmount('$1,234.56')).toEqual({
      amount: '1234.56',
      amountCents: 123456,
    })
    expect(parseDollarAmount(19.99)).toEqual({
      amount: '19.99',
      amountCents: 1999,
    })
    expect(() => parseDollarAmount(-1)).toThrow(/non-negative/)
    expect(() => parseDollarAmount('not-a-number')).toThrow(/non-negative/)
  })

  it('normalizes ISO dates and rejects invalid dates', () => {
    expect(normalizeExpenseDate('2026-10-28T12:30:00Z')).toBe('2026-10-28')
    expect(normalizeExpenseDate('2026-03-15')).toBe('2026-03-15')
    expect(() => normalizeExpenseDate('')).toThrow(/required/)
    expect(() => normalizeExpenseDate('not-a-date')).toThrow(/invalid/)
  })
})

describe('Firestore expense and receipt metadata store', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv('FIRESTORE_PROJECT_ID', 'lucid-loader-493512-g1')
    vi.stubEnv('FIRESTORE_DATABASE_ID', 'crm-expenses')
    __setFirestoreTokenSupplierForTests(async () => 'test-firestore-token')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    __setFirestoreTokenSupplierForTests(null)
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('detects configuration from FIRESTORE_PROJECT_ID or EXPENSE_STORE_BACKEND', () => {
    expect(isFirestoreExpenseStoreConfigured()).toBe(true)
    expect(getFirestoreExpenseConfig()).toEqual({
      projectId: 'lucid-loader-493512-g1',
      databaseId: 'crm-expenses',
      expensesCollection: 'expenses',
      receiptsCollection: 'receipts',
    })

    vi.stubEnv('FIRESTORE_PROJECT_ID', '')
    vi.stubEnv('EXPENSE_STORE_BACKEND', 'firestore')
    vi.stubEnv('GOOGLE_CLOUD_PROJECT', 'aetherisvision-og-fleet')
    expect(isFirestoreExpenseStoreConfigured()).toBe(true)
  })

  it('creates, queries, updates, and deletes expense records in Firestore', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: 'projects/lucid-loader-493512-g1/databases/crm-expenses/documents/expenses/gmail_msg-42',
          fields: {
            id: { stringValue: 'gmail_msg-42' },
            date: { stringValue: '2026-10-24' },
            vendor: { stringValue: 'Google' },
            description: { stringValue: 'Google Cloud invoice' },
            category: { stringValue: 'Cloud Services' },
            amount: { stringValue: '48.50' },
            amount_cents: { integerValue: '4850' },
            tax_year: { integerValue: '2026' },
            receipt_url: { stringValue: '/api/receipts/file?path=receipts%2Fgmail%2Fdoc.pdf' },
            receipt_gcs_uri: { stringValue: 'gs://lucid-loader-493512-g1-crm-private/receipts/gmail/doc.pdf' },
            receipt_sha256: { stringValue: 'c'.repeat(64) },
            gmail_message_id: { stringValue: 'msg-42' },
            source: { stringValue: 'gmail-biz' },
            created_at: { stringValue: '2026-10-24T11:00:00.000Z' },
            updated_at: { stringValue: '2026-10-24T11:00:00.000Z' },
          },
        }),
        { status: 200 },
      ),
    )

    const created = await createFirestoreExpense({
      date: '2026-10-24',
      vendor: 'Google',
      description: 'Google Cloud invoice',
      category: 'Cloud Services',
      amount: 48.5,
      tax_year: 2026,
      receipt_url: '/api/receipts/file?path=receipts%2Fgmail%2Fdoc.pdf',
      receipt_gcs_uri: 'gs://lucid-loader-493512-g1-crm-private/receipts/gmail/doc.pdf',
      receipt_sha256: 'c'.repeat(64),
      gmail_message_id: 'msg-42',
      source: 'gmail-biz',
    })

    expect(created.created).toBe(true)
    expect(created.record).toMatchObject({
      id: 'gmail_msg-42',
      vendor: 'Google',
      amount: '48.50',
      amount_cents: 4850,
      tax_year: 2026,
      gmail_message_id: 'msg-42',
    })

    // Query by tax year and compute exact category totals
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            document: {
              name: 'projects/lucid-loader-493512-g1/databases/crm-expenses/documents/expenses/gmail_msg-42',
              fields: {
                id: { stringValue: 'gmail_msg-42' },
                date: { stringValue: '2026-10-24' },
                vendor: { stringValue: 'Google' },
                description: { stringValue: 'Google Cloud invoice' },
                category: { stringValue: 'Cloud Services' },
                amount: { stringValue: '48.50' },
                amount_cents: { integerValue: '4850' },
                tax_year: { integerValue: '2026' },
                source: { stringValue: 'gmail-biz' },
              },
            },
          },
          {
            document: {
              name: 'projects/lucid-loader-493512-g1/databases/crm-expenses/documents/expenses/gmail_msg-43',
              fields: {
                id: { stringValue: 'gmail_msg-43' },
                date: { stringValue: '2026-10-25' },
                vendor: { stringValue: 'Anthropic' },
                description: { stringValue: 'API usage' },
                category: { stringValue: 'Cloud Services' },
                amount: { stringValue: '11.50' },
                amount_cents: { integerValue: '1150' },
                tax_year: { integerValue: '2026' },
                source: { stringValue: 'gmail-biz' },
              },
            },
          },
        ]),
        { status: 200 },
      ),
    )

    const listed = await listFirestoreExpensesByTaxYear(2026)
    expect(listed.expenses).toHaveLength(2)
    expect(listed.expenses[0].vendor).toBe('Anthropic')
    expect(listed.totals).toEqual([{ category: 'Cloud Services', total: '60.00' }])

    // Update with field mask
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: 'projects/lucid-loader-493512-g1/databases/crm-expenses/documents/expenses/gmail_msg-42',
          fields: {
            id: { stringValue: 'gmail_msg-42' },
            date: { stringValue: '2026-10-24' },
            vendor: { stringValue: 'Google Cloud' },
            description: { stringValue: 'Google Cloud invoice' },
            category: { stringValue: 'Cloud Services' },
            amount: { stringValue: '50.00' },
            amount_cents: { integerValue: '5000' },
            tax_year: { integerValue: '2026' },
          },
        }),
        { status: 200 },
      ),
    )

    const updated = await updateFirestoreExpense('gmail_msg-42', {
      vendor: 'Google Cloud',
      amount: '50.00',
    })
    expect(updated?.vendor).toBe('Google Cloud')
    expect(updated?.amount).toBe('50.00')
    expect(String(fetchMock.mock.calls[2][0])).toContain('updateMask.fieldPaths=vendor')
    expect(String(fetchMock.mock.calls[2][0])).toContain('currentDocument.exists=true')

    // 404 on missing document update
    fetchMock.mockResolvedValueOnce(new Response('Not found', { status: 404 }))
    expect(await updateFirestoreExpense('missing_id', { vendor: 'Nope' })).toBeNull()

    // Delete
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await deleteFirestoreExpense('gmail_msg-42')
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })

  it('deduplicates concurrent Gmail receipt inserts on 409 conflict', async () => {
    // Initial POST returns 409 ALREADY_EXISTS
    fetchMock.mockResolvedValueOnce(new Response('Conflict', { status: 409 }))
    // Direct GET returns the existing document
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: 'projects/lucid-loader-493512-g1/databases/crm-expenses/documents/expenses/gmail_msg-dup',
          fields: {
            id: { stringValue: 'gmail_msg-dup' },
            date: { stringValue: '2026-10-24' },
            vendor: { stringValue: 'GitHub' },
            description: { stringValue: 'Receipt' },
            category: { stringValue: 'Cloud Services' },
            amount: { stringValue: '20.00' },
            amount_cents: { integerValue: '2000' },
            tax_year: { integerValue: '2026' },
            gmail_message_id: { stringValue: 'msg-dup' },
          },
        }),
        { status: 200 },
      ),
    )

    const outcome = await createFirestoreExpense({
      date: '2026-10-24',
      vendor: 'GitHub',
      description: 'Receipt',
      category: 'Cloud Services',
      amount: 20,
      gmail_message_id: 'msg-dup',
    })

    expect(outcome.created).toBe(false)
    expect(outcome.record.id).toBe('gmail_msg-dup')
  })

  it('records and reads receipt object metadata by path', async () => {
    const objectPath = 'receipts/gmail/1792839681409-f7434b40.pdf'
    const expectedId = receiptDocIdForPath(objectPath)

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: `projects/lucid-loader-493512-g1/databases/crm-expenses/documents/receipts/${expectedId}`,
          fields: {
            id: { stringValue: expectedId },
            object_path: { stringValue: objectPath },
            bucket: { stringValue: 'lucid-loader-493512-g1-crm-private' },
            gcs_uri: { stringValue: `gs://lucid-loader-493512-g1-crm-private/${objectPath}` },
            view_url: { stringValue: `/api/receipts/file?path=${encodeURIComponent(objectPath)}` },
            content_type: { stringValue: 'application/pdf' },
            size_bytes: { integerValue: '31918' },
            sha256: { stringValue: 'd'.repeat(64) },
            source: { stringValue: 'gmail-cron' },
            gmail_message_id: { stringValue: 'msg-99' },
            uploaded_at: { stringValue: '2026-10-24T11:01:21.000Z' },
          },
        }),
        { status: 200 },
      ),
    )

    const written = await recordFirestoreReceiptMetadata({
      object_path: objectPath,
      bucket: 'lucid-loader-493512-g1-crm-private',
      gcs_uri: `gs://lucid-loader-493512-g1-crm-private/${objectPath}`,
      view_url: `/api/receipts/file?path=${encodeURIComponent(objectPath)}`,
      content_type: 'application/pdf',
      size_bytes: 31918,
      sha256: 'd'.repeat(64),
      source: 'gmail-cron',
      gmail_message_id: 'msg-99',
    })
    expect(written.id).toBe(expectedId)
    expect(written.size_bytes).toBe(31918)

    fetchMock.mockResolvedValueOnce(new Response('Not found', { status: 404 }))
    expect(await getFirestoreReceiptMetadata('receipts/missing.pdf')).toBeNull()
  })
})

describe('legacy Vercel Blob to GCS + Firestore migration helpers', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv('FIRESTORE_PROJECT_ID', 'lucid-loader-493512-g1')
    vi.stubEnv('GCS_RECEIPT_BUCKET', 'lucid-loader-493512-g1-crm-private')
    __setFirestoreTokenSupplierForTests(async () => 'test-firestore-token')
    fetchMock.mockReset()
    gcsMocks.putGcsReceipt.mockReset()
    dbMocks.sql.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    __setFirestoreTokenSupplierForTests(null)
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('identifies legacy Vercel Blob URLs and leaves private viewer paths alone', async () => {
    expect(
      isLegacyVercelBlobUrl('https://store123.public.blob.vercel-storage.com/receipts/abc-9f2.pdf'),
    ).toBe(true)
    expect(isLegacyVercelBlobUrl('/api/receipts/file?path=receipts%2Fabc.pdf')).toBe(false)
    expect(isLegacyVercelBlobUrl('https://aetherisvision.com/api/receipts/file?path=receipts%2Fabc.pdf')).toBe(false)

    const unchanged = await migrateLegacyReceiptUrlToGcs('/api/receipts/file?path=receipts%2Fabc.pdf')
    expect(unchanged).toEqual({
      receiptUrl: '/api/receipts/file?path=receipts%2Fabc.pdf',
      migrated: false,
    })
  })

  it('migrates legacy Vercel Blob URLs into private GCS and backfills SQL expenses into Firestore', async () => {
    gcsMocks.putGcsReceipt.mockImplementation(async (pathname: string) => ({
      bucket: 'lucid-loader-493512-g1-crm-private',
      objectPath: pathname,
      gcsUri: `gs://lucid-loader-493512-g1-crm-private/${pathname}`,
      contentType: 'application/pdf',
      sizeBytes: 128,
      sha256: 'e'.repeat(64),
    }))

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('blob.vercel-storage.com')) {
        return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        })
      }
      // Firestore PATCH upsert for receipt metadata or expense doc
      return new Response(
        JSON.stringify({
          name: 'projects/lucid-loader-493512-g1/databases/(default)/documents/expenses/sql_1',
          fields: {
            id: { stringValue: 'sql_1' },
            date: { stringValue: '2026-08-15' },
            vendor: { stringValue: 'Vercel' },
            description: { stringValue: 'Pro subscription' },
            category: { stringValue: 'Cloud Services' },
            amount: { stringValue: '20.00' },
            amount_cents: { integerValue: '2000' },
            tax_year: { integerValue: '2026' },
          },
        }),
        { status: 200 },
      )
    })

    const summary = await backfillExpensesToFirestoreAndGcs({
      rows: [
        {
          id: 1,
          date: '2026-08-15',
          vendor: 'Vercel',
          description: 'Pro subscription',
          category: 'Hosting',
          amount: '20.00',
          tax_year: 2026,
          receipt_url: 'https://xyz.public.blob.vercel-storage.com/receipts/inv-1.pdf',
          source: 'gmail-biz',
        },
        {
          id: 2,
          date: '2026-09-23',
          vendor: 'Anthropic',
          description: 'Claude receipt',
          category: 'AI/API',
          amount: '100.00',
          tax_year: 2026,
          receipt_url: '/api/receipts/file?path=receipts%2Fgmail%2Fexisting.pdf',
          gmail_message_id: 'msg-existing',
          source: 'gmail-biz',
        },
      ],
      fetcher: fetchMock as unknown as typeof fetch,
    })

    expect(summary).toEqual({
      scanned: 2,
      upserted: 2,
      migratedBlobs: 1,
    })
    expect(gcsMocks.putGcsReceipt).toHaveBeenCalledTimes(1)
    expect(expenseDocIdForSqlId(1)).toBe('sql_1')
    expect(expenseDocIdForGmailMessage('msg-existing')).toBe('gmail_msg-existing')
  })

  it('falls back to PostgreSQL when EXPENSE_FALLBACK_READ_POSTGRES=true and Firestore is empty', async () => {
    vi.stubEnv('EXPENSE_FALLBACK_READ_POSTGRES', 'true')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([{}]), { status: 200 }))
    dbMocks.sql
      .mockResolvedValueOnce([{ id: 1, vendor: 'GitHub', amount: '10.00', category: 'Cloud Services', tax_year: 2026 }])
      .mockResolvedValueOnce([{ category: 'Cloud Services', total: '10.00' }])

    const result = await listExpensesByTaxYear(2026)
    expect(result.expenses).toHaveLength(1)
    expect(result.totals).toEqual([{ category: 'Cloud Services', total: '10.00' }])
    expect(dbMocks.sql).toHaveBeenCalledTimes(2)
  })

  it('computes category totals sorted descending by cents', () => {
    const totals = computeCategoryTotals([
      {
        id: '1',
        date: '2026-01-01',
        vendor: 'A',
        description: 'A',
        category: 'Office Supplies',
        amount: '15.25',
        amount_cents: 1525,
        tax_year: 2026,
        receipt_url: null,
        source: 'manual',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        date: '2026-01-02',
        vendor: 'B',
        description: 'B',
        category: 'Cloud Services',
        amount: '100.10',
        amount_cents: 10010,
        tax_year: 2026,
        receipt_url: null,
        source: 'manual',
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
      {
        id: '3',
        date: '2026-01-03',
        vendor: 'C',
        description: 'C',
        category: 'Office Supplies',
        amount: '4.75',
        amount_cents: 475,
        tax_year: 2026,
        receipt_url: null,
        source: 'manual',
        created_at: '2026-01-03T00:00:00Z',
        updated_at: '2026-01-03T00:00:00Z',
      },
    ])

    expect(totals).toEqual([
      { category: 'Cloud Services', total: '100.10' },
      { category: 'Office Supplies', total: '20.00' },
    ])
  })

  it('finds an expense by Gmail message ID via fallback query when stored under a non-gmail doc ID', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('Not found', { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              document: {
                name: 'projects/lucid-loader-493512-g1/databases/(default)/documents/expenses/sql_7',
                fields: {
                  id: { stringValue: 'sql_7' },
                  date: { stringValue: '2026-10-01' },
                  vendor: { stringValue: 'Stripe' },
                  description: { stringValue: 'Fee' },
                  category: { stringValue: 'Banking & Financial Fees' },
                  amount: { stringValue: '3.20' },
                  amount_cents: { integerValue: '320' },
                  tax_year: { integerValue: '2026' },
                  gmail_message_id: { stringValue: 'legacy-msg-7' },
                },
              },
            },
          ]),
          { status: 200 },
        ),
      )

    const found = await findFirestoreExpenseByGmailMessageId('legacy-msg-7')
    expect(found?.id).toBe('sql_7')
    expect(found?.gmail_message_id).toBe('legacy-msg-7')
  })
})
