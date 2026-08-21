import {
  put,
  BlobAccessError,
  BlobClientTokenExpiredError,
  BlobPreconditionFailedError,
  BlobRequestAbortedError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  type PutBlobResult,
} from '@vercel/blob'

/**
 * Receipts are financial records. They are stored private so that possession of
 * a URL is not itself authorization to read one — the only way in is through
 * the admin-gated streaming route at /api/receipts/file.
 *
 * Private blob stores are not available on every plan. A store that genuinely
 * cannot accept a private write falls back to a public write with an
 * unguessable name rather than dropping the receipt on the floor. Every other
 * failure — a transient outage, rate limiting, an expired token, a pathname
 * collision — is rethrown: silently downgrading a financial record to
 * world-readable because the service blipped for thirty seconds would defeat
 * the entire point of this module.
 */
export const RECEIPT_VIEW_PATH = '/api/receipts/file'

export interface ReceiptUploadResult {
  /** What to persist in expenses.receipt_url and render as an href. */
  reference: string
  isPrivate: boolean
}

/** Internal viewer URL for a private blob pathname. */
export function receiptViewUrl(pathname: string): string {
  return `${RECEIPT_VIEW_PATH}?path=${encodeURIComponent(pathname)}`
}

/**
 * True only for the one condition the public fallback exists to handle: the
 * store does not offer private blobs at all. Anything transient or unrelated
 * must surface instead.
 */
function isPrivateAccessUnsupported(error: unknown): boolean {
  // These are outages, quota, auth, and collision failures — never a reason to
  // publish a receipt. Checked first so a stray word in a message cannot match.
  if (
    error instanceof BlobServiceNotAvailable ||
    error instanceof BlobServiceRateLimited ||
    error instanceof BlobStoreSuspendedError ||
    error instanceof BlobStoreNotFoundError ||
    error instanceof BlobClientTokenExpiredError ||
    error instanceof BlobPreconditionFailedError ||
    error instanceof BlobRequestAbortedError
  ) {
    return false
  }

  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (!message.includes('private')) return false
  return (
    error instanceof BlobAccessError ||
    /not\s+(?:supported|enabled|available)|unsupported|invalid\s+access|requires?\s+.*plan/.test(
      message,
    )
  )
}

export async function putReceipt(
  pathname: string,
  body: Parameters<typeof put>[1],
  contentType?: string,
): Promise<ReceiptUploadResult> {
  const contentTypeOption = contentType ? { contentType } : {}

  try {
    await put(pathname, body, { access: 'private', ...contentTypeOption })
    return { reference: receiptViewUrl(pathname), isPrivate: true }
  } catch (error) {
    if (!isPrivateAccessUnsupported(error)) throw error

    // The full message matters here: it is the evidence for the decision above,
    // and the only signal that this store never accepts private writes.
    console.warn('Blob store rejected a private receipt write; storing it public with an unguessable name', {
      error: error instanceof Error ? `${error.name}: ${error.message}` : 'UnknownError',
    })
    const blob: PutBlobResult = await put(pathname, body, {
      access: 'public',
      addRandomSuffix: true,
      ...contentTypeOption,
    })
    return { reference: blob.url, isPrivate: false }
  }
}
