import { readFile } from 'node:fs/promises'
import path from 'node:path'

const SIGNATURE_PATH = path.join(process.cwd(), 'private', 'email-signature.html')

// private/email-signature.html (copied from aetherisvision/marketing/
// email_signature.html) is a preview page meant for copy-pasting into
// Gmail's own signature settings -- it wraps the real signature table in a
// DOCTYPE/body/instructions shell. Gmail's API does not apply a mailbox's
// configured signature to drafts it creates (only the compose UI does
// that), so a draft built here has to embed the signature itself; this
// extracts just the <table>...</table> fragment between the file's own
// markers, not the whole preview document.
const SIGNATURE_BOUNDS = /Do not copy this comment block\.[\s\S]*?-->([\s\S]*?)<!-- END SIGNATURE -->/

let cachedSignature: Promise<string> | null = null
export function loadEmailSignatureHtml(): Promise<string> {
  cachedSignature ??= readFile(SIGNATURE_PATH, 'utf8')
    .then((raw) => {
      const match = raw.match(SIGNATURE_BOUNDS)
      if (!match) throw new Error('email-signature.html is missing its expected markers')
      return match[1].trim()
    })
    .catch((error) => {
      cachedSignature = null
      throw error
    })
  return cachedSignature
}
