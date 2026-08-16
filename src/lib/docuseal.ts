const DOCUSEAL_API_URL = 'https://api.docuseal.com'
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY!
const MARSTON_EMAIL = 'marston@aetherisvision.com'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function signedDocumentUrlFrom(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.documents)) return null

  // merge=true should return one combined document. Fail closed if the
  // provider returns an ambiguous response rather than storing the wrong PDF.
  if (payload.documents.length !== 1 || !isRecord(payload.documents[0])) return null

  const rawUrl = payload.documents[0].url
  if (typeof rawUrl !== 'string' || rawUrl.length > 8_192) return null

  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:' || url.username || url.password) return null
  } catch {
    return null
  }

  return rawUrl
}

export class DocuSealApiError extends Error {
  readonly status: number
  readonly retrySafe: boolean

  constructor(status: number) {
    super(`DocuSeal request failed with status ${status}`)
    this.name = 'DocuSealApiError'
    this.status = status
    // A normal 4xx response means DocuSeal rejected the request before creating
    // a submission. Timeouts, early-data responses, and rate limits are kept
    // ambiguous because the provider may still have accepted the request.
    this.retrySafe = status >= 400 && status < 500 && ![408, 425, 429].includes(status)
  }
}

export function isRetrySafeDocuSealError(error: unknown): boolean {
  return error instanceof DocuSealApiError && error.retrySafe
}

// Build the HTML signature block with embedded DocuSeal field tags
export function buildSignatureBlock(isSelfSign: boolean, signerName: string): string {
  if (isSelfSign) {
    return `
      <div class="signature-block" style="margin-top:48px;padding-top:20px;border-top:2px solid #29426C;">
        <div style="max-width:320px;">
          <p style="font-weight:700;margin-bottom:8px;">Aetheris Vision LLC</p>
          <signature-field name="signature" role="Signer" required="true" style="display:block;margin:8px 0;"></signature-field>
          <date-field name="date" role="Signer" style="display:block;margin:8px 0;"></date-field>
          <p style="font-size:9pt;color:#555;">Marston Ward, Principal</p>
        </div>
      </div>`
  }
  return `
    <div class="signature-block" style="margin-top:48px;padding-top:20px;border-top:2px solid #29426C;display:grid;grid-template-columns:1fr 1fr;gap:40px;">
      <div>
        <p style="font-weight:700;margin-bottom:8px;">Client — ${signerName}</p>
        <signature-field name="signature" role="Signer" required="true" style="display:block;margin:8px 0;"></signature-field>
        <date-field name="date" role="Signer" style="display:block;margin:8px 0;"></date-field>
      </div>
      <div>
        <p style="font-weight:700;margin-bottom:8px;">Aetheris Vision LLC</p>
        <signature-field name="countersignature" role="Countersigner" required="true" style="display:block;margin:8px 0;"></signature-field>
        <date-field name="counterdate" role="Countersigner" style="display:block;margin:8px 0;"></date-field>
        <p style="font-size:9pt;color:#555;">Marston Ward, Principal</p>
      </div>
    </div>`
}

// Send an HTML document for signing via POST /submissions/html
// DocuSeal creates the template + submission in one shot from the raw HTML.
// Field tags (<signature-field>, <date-field>) are embedded directly in the HTML.
export async function sendForSigning({
  html,
  fileName,
  signerName,
  signerEmail,
  ccEmail,
}: {
  html: string        // full HTML document with embedded DocuSeal field tags
  fileName: string
  signerName: string
  signerEmail: string
  ccEmail?: string
}) {
  // If the client IS Marston, single-signer flow to avoid duplicate-email error
  const isSelfSign = signerEmail.toLowerCase() === MARSTON_EMAIL.toLowerCase()

  const submitters = isSelfSign
    ? [{ name: signerName, email: signerEmail, role: 'Signer', send_email: true }]
    : [
        { name: signerName, email: signerEmail, role: 'Signer', send_email: true },
        { name: 'Marston Ward', email: MARSTON_EMAIL, role: 'Countersigner', send_email: true },
      ]

  const response = await fetch(`${DOCUSEAL_API_URL}/submissions/html`, {
    method: 'POST',
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: fileName,
      send_email: true,
      documents: [{ name: fileName, html }],
      submitters,
      ...(ccEmail && { message: { subject: 'Please review and sign your Statement of Work', body: ccEmail } }),
    }),
  })

  if (!response.ok) {
    throw new DocuSealApiError(response.status)
  }

  return response.json()
}

// Get a completed submission (called from webhook)
export async function getSubmission(submissionId: string) {
  const response = await fetch(`${DOCUSEAL_API_URL}/submissions/${submissionId}`, {
    headers: { 'X-Auth-Token': DOCUSEAL_API_KEY },
  })

  if (!response.ok) throw new Error(`Failed to fetch submission ${submissionId}`)
  return response.json()
}

// Download the signed PDF as a buffer
export async function downloadSignedPdf(submissionId: string): Promise<Buffer> {
  const response = await fetch(
    `${DOCUSEAL_API_URL}/submissions/${encodeURIComponent(submissionId)}/documents?merge=true`,
    {
      headers: { 'X-Auth-Token': DOCUSEAL_API_KEY },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch signed PDF metadata for ${submissionId}`)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(`Invalid signed PDF metadata for ${submissionId}`)
  }

  const documentUrl = signedDocumentUrlFrom(payload)
  if (!documentUrl) {
    throw new Error(`Signed PDF is unavailable for ${submissionId}`)
  }

  // The temporary URL is already authorized by DocuSeal. Do not forward the
  // API key to the document host, and do not allow Next.js to cache the file.
  const documentResponse = await fetch(documentUrl, { cache: 'no-store' })
  if (!documentResponse.ok) {
    throw new Error(`Failed to download signed PDF for ${submissionId}`)
  }

  return Buffer.from(await documentResponse.arrayBuffer())
}
