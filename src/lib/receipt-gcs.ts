import { Storage } from '@google-cloud/storage'
import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

/** Only receipt object keys written under the `receipts/` prefix are valid. */
export const RECEIPT_PATHNAME_REGEX = /^receipts\/[A-Za-z0-9._/-]{1,200}$/

export interface GcsReceiptObjectMetadata {
  bucket: string
  objectPath: string
  gcsUri: string
  contentType: string
  sizeBytes: number
  sha256: string
}

export function isValidReceiptPathname(pathname: unknown): pathname is string {
  return (
    typeof pathname === 'string' &&
    !pathname.includes('..') &&
    !pathname.startsWith('receipts//') &&
    RECEIPT_PATHNAME_REGEX.test(pathname)
  )
}

export function getReceiptBucketName(env: NodeJS.ProcessEnv = process.env): string {
  const name = env.GCS_RECEIPT_BUCKET?.trim() || env.RECEIPT_GCS_BUCKET?.trim()
  if (!name) throw new Error('GCS_RECEIPT_BUCKET is not configured')
  return name
}

let storage: Storage | undefined
function receiptBucket() {
  const name = getReceiptBucketName()
  storage ??= new Storage()
  return { bucket: storage.bucket(name), name }
}

export async function toReceiptBuffer(
  body: Buffer | Uint8Array | Blob | string,
): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body
  if (typeof body === 'string') return Buffer.from(body, 'utf8')
  if (body instanceof Uint8Array || ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength)
  }
  return Buffer.from(await body.arrayBuffer())
}

export async function putGcsReceipt(
  pathname: string,
  body: Buffer | Uint8Array | Blob | string,
  contentType?: string,
): Promise<GcsReceiptObjectMetadata> {
  if (!isValidReceiptPathname(pathname)) {
    throw new Error('Invalid receipt path')
  }
  const bytes = await toReceiptBuffer(body)
  const resolvedContentType = contentType || 'application/octet-stream'
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const { bucket, name } = receiptBucket()

  await bucket.file(pathname).save(bytes, {
    resumable: false,
    validation: 'crc32c',
    preconditionOpts: { ifGenerationMatch: 0 },
    metadata: {
      contentType: resolvedContentType,
      cacheControl: 'private, no-store',
    },
  })

  return {
    bucket: name,
    objectPath: pathname,
    gcsUri: `gs://${name}/${pathname}`,
    contentType: resolvedContentType,
    sizeBytes: bytes.byteLength,
    sha256,
  }
}

export async function getGcsReceipt(pathname: string) {
  if (!isValidReceiptPathname(pathname)) {
    throw new Error('Invalid receipt path')
  }
  const { bucket } = receiptBucket()
  const file = bucket.file(pathname)
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
