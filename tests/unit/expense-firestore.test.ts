import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mintAdminSessionToken } from '../helpers/admin-session'
import {
  EXPENSE_CATEGORIES,
  normalizeExpenseCategory,
  validateStrictExpenseCategory,
} from '@/lib/expense-categories'
import {
  __setFirestoreTokenSupplierForTests,
  computeCategoryTotals,
  createFirestoreExpense,
  deleteFirestoreExpense,
  documentToExpenseRecord,
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
  getGcsReceipt: vi.fn(),
  getReceiptBucketName: vi.fn(() => 'lucid-loader-493512-g1-crm-private'),
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
  getGcsReceipt: gcsMocks.getGcsReceipt,
  getReceiptBucketName: gcsMocks.getReceiptBucketName,
  isValidReceiptPathname: gcsMocks.isValidReceiptPathname,
}))

vi.mock('@/lib/db', () => ({
  sql: dbMocks.sql,
}))

describe('expense categories, amount, and calendar date validation', () => {
  it('validates strict categories for manual routes and maps legacy aliases for migrations', () => {
    expect(EXPENSE_CATEGORIES).toContain('Cloud Services')
    expect(validateStrictExpenseCategory('Cloud Services')).toBe('Cloud Services')
    expect(validateStrictExpenseCategory('Software/SaaS')).toBeNull()
    expect(validateStrictExpenseCategory('Unlisted Category')).toBeNull()
    expect(validateStrictExpenseCategory('')).toBeNull()

    expect(normalizeExpenseCategory('Cloud Services')).toBe('Cloud Services')
    expect(normalizeExpenseCategory('Software/SaaS')).toBe('Software Subscriptions')
    expect(normalizeExpenseCategory('AI/API')).toBe('Cloud Services')
    expect(normalizeExpenseCategory('Office & Equipment')).toBe('Equipment & Hardware')
    expect(normalizeExpenseCategory('Unlisted Category')).toBe('Other')
  })

  it('strictly parses decimal dollar amounts and rejects blank, hex, scientific, or 3-decimal inputs', () => {
    expect(parseDollarAmount('$1,234.56')).toEqual({
      amount: '1234.56',
      amountCents: 123456,
    })
    expect(parseDollarAmount(19.99)).toEqual({
      amount: '19.99',
      amountCents: 1999,
    })
    expect(parseDollarAmount('0')).toEqual({
      amount: '0.00',
      amountCents: 0,
    })

    for (const invalid of ['', '   ', '$', '0x1A', '1e3', '12.345', -1, 'not-a-number', null]) {
      expect(() => parseDollarAmount(invalid)).toThrow()
    }
  })

  it('validates real calendar dates and rejects impossible YYYY-MM-DD dates', () => {
    expect(normalizeExpenseDate('2026-10-28T12:30:00Z')).toBe('2026-10-28')
    expect(normalizeExpenseDate('2026-03-15')).toBe('2026-03-15')
    expect(normalizeExpenseDate(new Date('2026-07-04T00:00:00Z'))).toBe('2026-07-04')

    for (const invalid of ['', '   ', 'not-a-date', '2026-13-45', '2026-02-30', '2026-00-10']) {
      expect(() => normalizeExpenseDate(invalid)).toThrow(/required|invalid/)
    }
  })

  it('fails closed when a stored Firestore document is missing required fields', () => {
    expect(() =>
      documentToExpenseRecord({
        name: 'projects/p/databases/(default)/documents/expenses/exp_1',
        fields: {
          vendor: { stringValue: 'GitHub' },
        },
      }),
    ).toThrow(/missing required fields/)

    expect(() =>
      documentToExpenseRecord({
        name: 'projects/p/databases/(default)/documents/expenses/exp_2',
        fields: {
          date: { stringValue: '2026-02-30' },
          vendor: { stringValue: 'GitHub' },
          amount: { stringValue: '10.00' },
        },
      }),
    ).toThrow(/invalid date or amount/)
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
  })

  it('creates, queries, updates (recomputing tax_year on date change), and deletes expense records', async () => {
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
    expect(created.record.tax_year).toBe(2026)

    // Query by tax year
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
        ]),
        { status: 200 },
      ),
    )

    const listed = await listFirestoreExpensesByTaxYear(2026)
    expect(listed.expenses).toHaveLength(1)
    expect(listed.totals).toEqual([{ category: 'Cloud Services', total: '48.50' }])

    // Update date to 2025-12-31 and verify tax_year is recomputed in the mask and body
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: 'projects/lucid-loader-493512-g1/databases/crm-expenses/documents/expenses/gmail_msg-42',
          fields: {
            id: { stringValue: 'gmail_msg-42' },
            date: { stringValue: '2025-12-31' },
            vendor: { stringValue: 'Google Cloud' },
            description: { stringValue: 'Google Cloud invoice' },
            category: { stringValue: 'Cloud Services' },
            amount: { stringValue: '50.00' },
            amount_cents: { integerValue: '5000' },
            tax_year: { integerValue: '2025' },
          },
        }),
        { status: 200 },
      ),
    )

    const updated = await updateFirestoreExpense('gmail_msg-42', {
      date: '2025-12-31',
      vendor: 'Google Cloud',
      amount: '50.00',
    })
    expect(updated?.tax_year).toBe(2025)
    const patchUrl = String(fetchMock.mock.calls[2][0])
    expect(patchUrl).toContain('updateMask.fieldPaths=date')
    expect(patchUrl).toContain('updateMask.fieldPaths=tax_year')

    // Reject unknown category on update
    await expect(
      updateFirestoreExpense('gmail_msg-42', { category: 'Not A Valid Category' }),
    ).rejects.toThrow(/category is invalid/)

    // Delete
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await deleteFirestoreExpense('gmail_msg-42')
  })

  it('deduplicates concurrent Gmail receipt inserts on 409 conflict', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Conflict', { status: 409 }))
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

    fetchMock.mockResolvedValueOnce(new Response('Not found', { status: 404 }))
    expect(await getFirestoreReceiptMetadata('receipts/missing.pdf')).toBeNull()
  })
})

describe('idempotent backfill and legacy Vercel Blob migration', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv('FIRESTORE_PROJECT_ID', 'lucid-loader-493512-g1')
    vi.stubEnv('GCS_RECEIPT_BUCKET', 'lucid-loader-493512-g1-crm-private')
    __setFirestoreTokenSupplierForTests(async () => 'test-firestore-token')
    fetchMock.mockReset()
    gcsMocks.putGcsReceipt.mockReset()
    gcsMocks.getGcsReceipt.mockReset()
    dbMocks.sql.mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    __setFirestoreTokenSupplierForTests(null)
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('uses deterministic content-addressed GCS paths, skips existing Firestore docs on rerun, and flags missing GCS viewer paths', async () => {
    expect(
      isLegacyVercelBlobUrl('https://store123.public.blob.vercel-storage.com/receipts/abc-9f2.pdf'),
    ).toBe(true)

    // Row 1 is not yet in Firestore; Row 2 already exists in Firestore (should be skipped on rerun);
    // Row 3 is not yet in Firestore and has a /api/receipts/file?path=... whose object is missing in GCS.
    gcsMocks.getGcsReceipt.mockImplementation(async (pathname: string) => {
      if (pathname === 'receipts/legacy-missing.pdf') return null
      return null
    })
    gcsMocks.putGcsReceipt.mockImplementation(async (pathname: string) => ({
      bucket: 'lucid-loader-493512-g1-crm-private',
      objectPath: pathname,
      gcsUri: `gs://lucid-loader-493512-g1-crm-private/${pathname}`,
      contentType: 'application/pdf',
      sizeBytes: 4,
      sha256: 'e'.repeat(64),
    }))

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('blob.vercel-storage.com')) {
        return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        })
      }
      if ((!init?.method || init.method === 'GET') && url.endsWith('/documents/expenses/gmail_msg-existing')) {
        return new Response(
          JSON.stringify({
            name: 'projects/lucid-loader-493512-g1/databases/(default)/documents/expenses/gmail_msg-existing',
            fields: {
              id: { stringValue: 'gmail_msg-existing' },
              date: { stringValue: '2026-09-23' },
              vendor: { stringValue: 'Anthropic' },
              description: { stringValue: 'Edited in Firestore' },
              category: { stringValue: 'Cloud Services' },
              amount: { stringValue: '100.00' },
              amount_cents: { integerValue: '10000' },
              tax_year: { integerValue: '2026' },
            },
          }),
          { status: 200 },
        )
      }
      if (!init?.method || init.method === 'GET') {
        return new Response('Not found', { status: 404 })
      }
      return new Response(
        JSON.stringify({
          name: 'projects/lucid-loader-493512-g1/databases/(default)/documents/expenses/sql_1',
          fields: {
            id: { stringValue: 'sql_1' },
            date: { stringValue: '2026-08-15' },
            vendor: { stringValue: 'Vercel' },
            description: { stringValue: 'Pro subscription' },
            category: { stringValue: 'Domain & Hosting' },
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
        {
          id: 3,
          date: '2026-09-25',
          vendor: 'GitHub',
          description: 'Copilot',
          category: 'Cloud Services',
          amount: '19.00',
          tax_year: 2026,
          receipt_url: '/api/receipts/file?path=receipts%2Flegacy-missing.pdf',
          source: 'manual',
        },
      ],
      fetcher: fetchMock as unknown as typeof fetch,
    })

    expect(summary).toEqual({
      scanned: 3,
      upserted: 2,
      skippedExisting: 1,
      migratedBlobs: 1,
      missingGcsReceipts: ['receipts/legacy-missing.pdf'],
    })
    expect(gcsMocks.putGcsReceipt).toHaveBeenCalledTimes(1)
    const uploadedPath = gcsMocks.putGcsReceipt.mock.calls[0][0] as string
    expect(uploadedPath).toMatch(/^receipts\/migrated\/sql-1-[a-f0-9]{12}\.pdf$/)
  })

  it('skips GCS re-upload when the deterministic migrated object already exists in GCS', async () => {
    gcsMocks.getGcsReceipt.mockResolvedValueOnce({
      stream: new ReadableStream(),
      blob: { contentType: 'application/pdf' },
    })
    fetchMock.mockResolvedValueOnce(
      new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      }),
    )

    const result = await migrateLegacyReceiptUrlToGcs(
      'https://xyz.public.blob.vercel-storage.com/receipts/inv-1.pdf',
      { rowId: 1, fetcher: fetchMock as unknown as typeof fetch },
    )
    expect(result.migrated).toBe(false)
    expect(result.receiptUrl).toMatch(/^\/api\/receipts\/file\?path=receipts%2Fmigrated%2Fsql-1-/)
    expect(gcsMocks.putGcsReceipt).not.toHaveBeenCalled()
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
  })

  it('computes category totals and finds Gmail expenses via fallback query', async () => {
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
    ])
    expect(totals).toEqual([{ category: 'Office Supplies', total: '15.25' }])
    expect(expenseDocIdForSqlId(1)).toBe('sql_1')
    expect(expenseDocIdForGmailMessage('msg-1')).toBe('gmail_msg-1')

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
  })
})

describe('/api/expenses and /api/expenses/[id] route handlers with Firestore backend', () => {
  const fetchMock = vi.fn()
  const adminPassphrase = 'route-test-admin-passphrase'

  function adminCookieHeader(): string {
    return `av-admin-session=${mintAdminSessionToken(adminPassphrase)}`
  }

  beforeEach(() => {
    vi.stubEnv('ADMIN_PASSPHRASE', adminPassphrase)
    vi.stubEnv('FIRESTORE_PROJECT_ID', 'lucid-loader-493512-g1')
    __setFirestoreTokenSupplierForTests(async () => 'test-firestore-token')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    __setFirestoreTokenSupplierForTests(null)
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('rejects invalid category or malformed amount with 400 on POST /api/expenses and PATCH /api/expenses/[id]', async () => {
    const { POST } = await import('@/app/api/expenses/route')
    const { PATCH } = await import('@/app/api/expenses/[id]/route')

    const badCatRes = await POST(
      new NextRequest('http://localhost/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookieHeader(),
        },
        body: JSON.stringify({
          date: '2026-10-28',
          vendor: 'GitHub',
          description: 'Sub',
          category: 'Bogus Category',
          amount: '10.00',
        }),
      }),
    )
    expect(badCatRes.status).toBe(400)

    const badAmountRes = await POST(
      new NextRequest('http://localhost/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookieHeader(),
        },
        body: JSON.stringify({
          date: '2026-10-28',
          vendor: 'GitHub',
          description: 'Sub',
          category: 'Cloud Services',
          amount: '0x1A',
        }),
      }),
    )
    expect(badAmountRes.status).toBe(400)

    const badPatchCat = await PATCH(
      new NextRequest('http://localhost/api/expenses/exp_1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookieHeader(),
        },
        body: JSON.stringify({ category: 'Invalid Category' }),
      }),
      { params: Promise.resolve({ id: 'exp_1' }) },
    )
    expect(badPatchCat.status).toBe(400)
  })
})
