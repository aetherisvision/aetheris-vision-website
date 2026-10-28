import {
  isFirestoreExpenseStoreConfigured,
  recordFirestoreReceiptMetadata,
} from './expense-firestore'
import {
  isValidReceiptPathname,
  putGcsReceipt,
  type GcsReceiptObjectMetadata,
} from './receipt-gcs'

/**
 * Receipts are financial records. They are stored privately in Google Cloud
 * Storage (`GCS_RECEIPT_BUCKET`) so that possession of a URL is not itself
 * authorization to read one — the only way in is through the admin-gated
 * streaming route at /api/receipts/file.
 *
 * When Firestore metadata storage is configured (`FIRESTORE_PROJECT_ID`),
 * each uploaded receipt object is also indexed in the Firestore `receipts`
 * collection with its GCS URI, SHA-256 digest, byte size, and content type.
 */
export const RECEIPT_VIEW_PATH = '/api/receipts/file'

export interface ReceiptUploadOptions {
  source?: 'admin-upload' | 'gmail-cron' | 'migration'
  gmailMessageId?: string | null
}

export interface ReceiptUploadResult {
  /** What to persist in expenses.receipt_url and render as an href. */
  reference: string
  isPrivate: true
  object?: GcsReceiptObjectMetadata
}

/** Internal viewer URL for a private receipt pathname. */
export function receiptViewUrl(pathname: string): string {
  return `${RECEIPT_VIEW_PATH}?path=${encodeURIComponent(pathname)}`
}

export async function putReceipt(
  pathname: string,
  body: Buffer | Uint8Array | Blob | string,
  contentType?: string,
  options: ReceiptUploadOptions = {},
): Promise<ReceiptUploadResult> {
  if (!isValidReceiptPathname(pathname)) {
    throw new Error('Invalid receipt path')
  }
  if (
    !(
      typeof body === 'string' ||
      Buffer.isBuffer(body) ||
      body instanceof Uint8Array ||
      ArrayBuffer.isView(body) ||
      body instanceof Blob
    )
  ) {
    throw new Error('Unsupported receipt body')
  }

  const objectMeta = await putGcsReceipt(pathname, body, contentType)
  const reference = receiptViewUrl(pathname)

  if (isFirestoreExpenseStoreConfigured()) {
    try {
      await recordFirestoreReceiptMetadata({
        object_path: objectMeta.objectPath,
        bucket: objectMeta.bucket,
        gcs_uri: objectMeta.gcsUri,
        view_url: reference,
        content_type: objectMeta.contentType,
        size_bytes: objectMeta.sizeBytes,
        sha256: objectMeta.sha256,
        source: options.source ?? 'admin-upload',
        gmail_message_id: options.gmailMessageId ?? null,
      })
    } catch (error) {
      console.warn('Receipt uploaded to GCS, but Firestore metadata indexing failed', {
        error: error instanceof Error ? error.name : 'UnknownError',
      })
    }
  }

  return {
    reference,
    isPrivate: true,
    object: objectMeta,
  }
}
