import { Storage } from '@google-cloud/storage'
import { Readable } from 'node:stream'

let storage: Storage | undefined
function receiptBucket() {
  const name = process.env.GCS_RECEIPT_BUCKET
  if (!name) throw new Error('GCS_RECEIPT_BUCKET is not configured')
  storage ??= new Storage()
  return storage.bucket(name)
}

export async function putGcsReceipt(pathname: string, body: Buffer | Uint8Array | Blob | string, contentType?: string) {
  const bytes = typeof body === 'string' || Buffer.isBuffer(body)
    ? body : body instanceof Uint8Array ? Buffer.from(body) : Buffer.from(await body.arrayBuffer())
  await receiptBucket().file(pathname).save(bytes, {
    resumable: false,
    validation: 'crc32c',
    preconditionOpts: { ifGenerationMatch: 0 },
    metadata: { contentType: contentType ?? 'application/octet-stream', cacheControl: 'private, no-store' },
  })
}

export async function getGcsReceipt(pathname: string) {
  const file = receiptBucket().file(pathname)
  try {
    const [metadata] = await file.getMetadata()
    return {
      stream: Readable.toWeb(file.createReadStream()) as ReadableStream<Uint8Array>,
      blob: { contentType: metadata.contentType },
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) return null
    throw error
  }
}
