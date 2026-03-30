const DOCUSEAL_API_URL = 'https://api.docuseal.com'
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY!
const MARSTON_EMAIL = 'marston@aetherisvision.com'

// Send a PDF for signing via Docuseal
export async function sendForSigning({
  pdfBase64,
  fileName,
  signerName,
  signerEmail,
  ccEmail,
}: {
  pdfBase64: string
  fileName: string
  signerName: string
  signerEmail: string
  ccEmail?: string
}) {
  // If the client IS Marston, DocuSeal rejects having the same email in both
  // Signer and Countersigner roles. Use a single-signer flow in that case —
  // Marston signs once directly (as himself) with no countersign step.
  const isSelfSign = signerEmail.toLowerCase() === MARSTON_EMAIL.toLowerCase()

  const templateSubmitters = isSelfSign
    ? [{ name: 'Aetheris Vision', role: 'Signer' }]
    : [
        { name: 'Client', role: 'Signer' },
        { name: 'Aetheris Vision', role: 'Countersigner' },
      ]

  const templateFields = isSelfSign
    ? [
        { name: 'signature', type: 'signature', role: 'Signer' },
        { name: 'date', type: 'date', role: 'Signer' },
      ]
    : [
        { name: 'signature', type: 'signature', role: 'Signer' },
        { name: 'date', type: 'date', role: 'Signer' },
        { name: 'countersignature', type: 'signature', role: 'Countersigner' },
        { name: 'counterdate', type: 'date', role: 'Countersigner' },
      ]

  const submitters = isSelfSign
    ? [{ name: signerName, email: signerEmail, role: 'Signer', send_email: true }]
    : [
        { name: signerName, email: signerEmail, role: 'Signer', send_email: true },
        { name: 'Marston Ward', email: MARSTON_EMAIL, role: 'Countersigner', send_email: true },
      ]

  const response = await fetch(`${DOCUSEAL_API_URL}/submissions`, {
    method: 'POST',
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template: {
        name: fileName,
        documents: [{ name: fileName, file: pdfBase64 }],
        schema: [{ attachment_uuid: null, name: fileName }],
        submitters: templateSubmitters,
        fields: templateFields,
      },
      submitters,
      ...(ccEmail && { message: { cc: ccEmail } }),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Docuseal API error: ${error}`)
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
    `${DOCUSEAL_API_URL}/submissions/${submissionId}/download`,
    { headers: { 'X-Auth-Token': DOCUSEAL_API_KEY } }
  )

  if (!response.ok) throw new Error(`Failed to download signed PDF for ${submissionId}`)
  return Buffer.from(await response.arrayBuffer())
}
