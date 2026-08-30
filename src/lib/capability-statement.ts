import { readFile } from 'node:fs/promises'
import path from 'node:path'

const PDF_PATH = path.join(process.cwd(), 'private', 'capability-statement.pdf')
export const CAPABILITY_STATEMENT_FILENAME = 'Aetheris-Vision-Capability-Statement.pdf'

// The document is immutable for the life of a deployment, so read and encode it
// once per warm instance instead of moving ~7 MB through memory per request.
let encodedPdf: Promise<string> | null = null
export function loadEncodedCapabilityStatement(): Promise<string> {
  encodedPdf ??= readFile(PDF_PATH)
    .then((buffer) => buffer.toString('base64'))
    .catch((error) => {
      // Do not cache a failure: a redeploy or a transient read error should be
      // retried on the next request rather than poisoning the instance.
      encodedPdf = null
      throw error
    })
  return encodedPdf
}
