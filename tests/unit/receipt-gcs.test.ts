import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ save: vi.fn(), metadata: vi.fn(), file: vi.fn(), bucket: vi.fn() }))
vi.mock('@google-cloud/storage', () => ({
  Storage: class { bucket = mocks.bucket },
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('GCS_RECEIPT_BUCKET', 'private-crm-test')
  mocks.file.mockReturnValue({ save: mocks.save, getMetadata: mocks.metadata })
  mocks.bucket.mockReturnValue({ file: mocks.file })
  mocks.save.mockResolvedValue(undefined)
})

describe('private GCP receipts', () => {
  it('creates immutable receipt objects with private cache policy and integrity checking', async () => {
    const { putGcsReceipt } = await import('@/lib/receipt-gcs')
    await putGcsReceipt('receipts/test.pdf', Buffer.from('test'), 'application/pdf')
    expect(mocks.bucket).toHaveBeenCalledWith('private-crm-test')
    expect(mocks.save).toHaveBeenCalledWith(Buffer.from('test'), expect.objectContaining({
      validation: 'crc32c',
      preconditionOpts: { ifGenerationMatch: 0 },
      metadata: { contentType: 'application/pdf', cacheControl: 'private, no-store' },
    }))
  })

  it('propagates storage authorization failures without publishing a public fallback', async () => {
    const { putGcsReceipt } = await import('@/lib/receipt-gcs')
    const error = Object.assign(new Error('Forbidden'), { code: 403 })
    mocks.save.mockRejectedValueOnce(error)
    await expect(putGcsReceipt('receipts/test.pdf', 'test')).rejects.toBe(error)
  })

  it('distinguishes missing files from storage outages', async () => {
    const { getGcsReceipt } = await import('@/lib/receipt-gcs')
    mocks.metadata.mockRejectedValueOnce({ code: 404 })
    expect(await getGcsReceipt('receipts/missing.pdf')).toBeNull()
    mocks.metadata.mockRejectedValueOnce({ code: 503 })
    await expect(getGcsReceipt('receipts/test.pdf')).rejects.toMatchObject({ code: 503 })
  })
})
