import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  allocateInvoiceNumber,
  linkDepositInvoice,
  markEngagementSigned,
  markInvoiceNotificationSent,
  reserveDepositInvoice,
  reserveInvoiceNotification,
} from '@/lib/crm'
import { sql } from '@/lib/db'
import { downloadSignedPdf } from '@/lib/docuseal'
import { stripe } from '@/lib/stripe'

const MAX_WEBHOOK_BYTES = 512_000
const MAX_SIGNED_PDF_BYTES = 25 * 1024 * 1024
const WEBHOOK_SIGNATURE_TOLERANCE_SECONDS = 5 * 60

interface ProjectRow {
  project_id: number
  project_name: string
  project_status: string
  has_signed_pdf: boolean
  deposit_amount_cents: number | null
  client_id: number
  client_name: string
  client_email: string
  contact_name: string | null
  stripe_customer_id: string | null
  pro_bono: boolean | null
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function verifySignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const header = signatureHeader.trim()
  if (!header) return false

  // DocuSeal's hosted "Secret" setting sends the configured value verbatim;
  // self-signed deliveries use `<unix-ts>.<hex HMAC(ts "." body)>`. Match on
  // that exact shape — a static secret may itself contain dots — and compare
  // each in constant time; anything else fails closed.
  if (!/^\d+\.[a-f0-9]{64}$/i.test(header)) {
    const given = Buffer.from(header)
    const want = Buffer.from(secret)
    return want.length >= 32 && given.length === want.length && timingSafeEqual(given, want)
  }

  const parts = header.split('.')
  if (parts.length !== 2) return false

  const [timestamp, signature] = parts
  if (!/^\d+$/.test(timestamp) || !/^[a-f\d]{64}$/i.test(signature)) return false

  const timestampSeconds = Number(timestamp)
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (
    !Number.isSafeInteger(timestampSeconds) ||
    Math.abs(nowSeconds - timestampSeconds) > WEBHOOK_SIGNATURE_TOLERANCE_SECONDS
  ) {
    return false
  }

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

function submissionIdFrom(payload: Record<string, unknown>): string | null {
  const submission = payload.data
  if (!isRecord(submission)) return null

  const rawId = submission.id
  if (typeof rawId !== 'string' && typeof rawId !== 'number') return null
  if (typeof rawId === 'number' && !Number.isSafeInteger(rawId)) return null
  const id = String(rawId).trim()
  return id && id.length <= 128 ? id : null
}

function explicitDepositAmount(project: ProjectRow): number | null {
  if (project.pro_bono || project.deposit_amount_cents === null) return null
  if (
    !Number.isSafeInteger(project.deposit_amount_cents) ||
    project.deposit_amount_cents < 1 ||
    project.deposit_amount_cents > 2_147_483_647
  ) {
    throw new Error('Configured deposit amount is invalid')
  }
  return project.deposit_amount_cents
}

async function ensureStripeCustomer(project: ProjectRow): Promise<string> {
  if (project.stripe_customer_id) return project.stripe_customer_id

  const customer = await stripe.customers.create(
    {
      name: project.client_name,
      email: project.client_email,
      metadata: { client_id: String(project.client_id) },
    },
    { idempotencyKey: `av-client-${project.client_id}-customer-v1` },
  )

  // COALESCE preserves a customer ID won by another concurrent invocation.
  const rows = await sql`
    UPDATE clients
    SET stripe_customer_id = COALESCE(stripe_customer_id, ${customer.id}),
        updated_at = NOW()
    WHERE id = ${project.client_id}
    RETURNING stripe_customer_id
  `
  const stripeCustomerId = (rows[0] as { stripe_customer_id: string } | undefined)
    ?.stripe_customer_id
  if (!stripeCustomerId) throw new Error('Stripe customer could not be linked')
  return stripeCustomerId
}

async function billConfiguredDeposit(project: ProjectRow): Promise<void> {
  const amountCents = explicitDepositAmount(project)
  if (amountCents === null) return

  const invoiceNumber = await allocateInvoiceNumber()
  const description = `${project.project_name} — Project deposit`
  const reservation = await reserveDepositInvoice({
    projectId: project.project_id,
    invoiceNumber,
    amountCents,
    description,
  })
  const stripeCustomerId = await ensureStripeCustomer(project)
  const invoiceIdempotencyKey = `av-deposit-invoice-${reservation.invoiceId}-v1`

  let stripeInvoice = reservation.stripeInvoiceId
    ? await stripe.invoices.retrieve(reservation.stripeInvoiceId)
    : await stripe.invoices.create(
        {
          customer: stripeCustomerId,
          collection_method: 'send_invoice',
          days_until_due: 7,
          auto_advance: false,
          pending_invoice_items_behavior: 'exclude',
          description,
          metadata: {
            invoice_id: String(reservation.invoiceId),
            project_id: String(project.project_id),
            purpose: 'deposit',
          },
        },
        { idempotencyKey: invoiceIdempotencyKey },
      )

  await linkDepositInvoice({
    projectId: project.project_id,
    stripeInvoiceId: stripeInvoice.id,
    stripeInvoiceUrl: stripeInvoice.hosted_invoice_url,
  })

  if (stripeInvoice.status === 'draft') {
    const hasDepositItem = stripeInvoice.lines.data.some(
      (line) => line.metadata.local_invoice_id === String(reservation.invoiceId),
    )
    if (!hasDepositItem) {
      await stripe.invoiceItems.create(
        {
          customer: stripeCustomerId,
          invoice: stripeInvoice.id,
          amount: reservation.amountCents,
          currency: 'usd',
          description,
          metadata: {
            local_invoice_id: String(reservation.invoiceId),
            project_id: String(project.project_id),
            purpose: 'deposit',
          },
        },
        { idempotencyKey: `av-deposit-item-${reservation.invoiceId}-v1` },
      )
    }

    stripeInvoice = await stripe.invoices.finalizeInvoice(
      stripeInvoice.id,
      {},
      { idempotencyKey: `av-deposit-finalize-${reservation.invoiceId}-v1` },
    )
  }

  if (stripeInvoice.status === 'open') {
    const deliveryKey = `av-deposit-send-${reservation.invoiceId}-v1`
    const notification = await reserveInvoiceNotification({
      invoiceId: reservation.invoiceId,
      idempotencyKey: deliveryKey,
    })
    if (notification.shouldSend) {
      stripeInvoice = await stripe.invoices.sendInvoice(
        stripeInvoice.id,
        {},
        { idempotencyKey: deliveryKey },
      )
      await markInvoiceNotificationSent({
        invoiceId: reservation.invoiceId,
        idempotencyKey: deliveryKey,
      })
    }
  }

  if (!['open', 'paid'].includes(stripeInvoice.status ?? '')) {
    throw new Error('Deposit invoice requires manual review')
  }

  await linkDepositInvoice({
    projectId: project.project_id,
    stripeInvoiceId: stripeInvoice.id,
    stripeInvoiceUrl: stripeInvoice.hosted_invoice_url,
  })
  await sql`
    UPDATE invoices
    SET status = ${stripeInvoice.status === 'paid' ? 'paid' : 'sent'},
        stripe_invoice_url = COALESCE(stripe_invoice_url, ${stripeInvoice.hosted_invoice_url}),
        due_date = COALESCE(
          due_date,
          ${stripeInvoice.due_date
            ? new Date(stripeInvoice.due_date * 1000).toISOString().slice(0, 10)
            : null}::date
        ),
        paid_at = CASE
          WHEN ${stripeInvoice.status} = 'paid' THEN COALESCE(paid_at, NOW())
          ELSE paid_at
        END
    WHERE id = ${reservation.invoiceId}
      AND project_id = ${project.project_id}
      AND purpose = 'deposit'
      AND stripe_invoice_id = ${stripeInvoice.id}
  `
}

async function notifySignedProject(project: ProjectRow, submissionId: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const proBonoNote = project.pro_bono
    ? '\n\nThis engagement is marked pro bono; no billing action is required.'
    : ''

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send(
      {
        from: 'system@aetherisvision.com',
        to: ['contact@aetherisvision.com'],
        subject: `SOW Signed — ${project.client_name}`,
        text: `${project.contact_name ?? project.client_name} has signed the SOW for "${project.project_name}". The signed agreement is stored and the CRM lifecycle is updated.${proBonoNote}`,
      },
      { idempotencyKey: `docuseal-completed-${submissionId}` },
    )
  } catch (error) {
    // Notification delivery is non-critical and must not cause DocuSeal to
    // repeat an otherwise completed lifecycle transition.
    console.error('Signed-engagement notification failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    })
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return json({ error: 'Request is too large' }, 413)
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BYTES) {
    return json({ error: 'Request is too large' }, 413)
  }

  const signature = request.headers.get('x-docuseal-signature') ?? ''
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET ?? ''
  if (!secret || !verifySignature(rawBody, signature, secret)) {
    console.warn('DocuSeal webhook rejected an invalid signature')
    return json({ error: 'Unauthorized' }, 401)
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  if (!isRecord(payload) || typeof payload.event_type !== 'string') {
    return json({ error: 'Invalid webhook payload' }, 400)
  }

  if (payload.event_type !== 'submission.completed') {
    return json({ received: true })
  }

  const submissionId = submissionIdFrom(payload)
  if (!submissionId) {
    return json({ error: 'Invalid submission' }, 400)
  }

  try {
    const rows = await sql`
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        p.status AS project_status,
        (p.signed_pdf_base64 IS NOT NULL) AS has_signed_pdf,
        p.deposit_amount_cents,
        c.id AS client_id,
        c.name AS client_name,
        c.email AS client_email,
        c.contact_name,
        c.stripe_customer_id,
        i.pro_bono
      FROM projects p
      JOIN clients c ON c.id = p.client_id
      LEFT JOIN LATERAL (
        SELECT pro_bono
        FROM intake_submissions
        WHERE project_id = p.id
        ORDER BY submitted_at DESC
        LIMIT 1
      ) i ON TRUE
      WHERE p.docuseal_submission_id = ${submissionId}
      LIMIT 1
    `

    const project = rows[0] as ProjectRow | undefined
    if (!project) {
      console.warn('DocuSeal webhook did not match a local project')
      return json({ received: true })
    }

    // A canceled proposal must not be revived by a late completion event.
    if (project.project_status === 'canceled') {
      console.warn('DocuSeal completion ignored for a canceled project')
      return json({ received: true })
    }

    if (!project.has_signed_pdf) {
      const pdfBuffer = await downloadSignedPdf(submissionId)
      if (pdfBuffer.byteLength > MAX_SIGNED_PDF_BYTES) {
        throw new Error('Signed PDF exceeds storage limit')
      }

      const pdfBase64 = pdfBuffer.toString('base64')
      await sql`
        UPDATE projects
        SET signed_pdf_base64 = COALESCE(signed_pdf_base64, ${pdfBase64}),
            updated_at = NOW()
        WHERE id = ${project.project_id}
          AND docuseal_submission_id = ${submissionId}
      `
    }

    // Always invoke the idempotent service. It repairs a prior partial attempt
    // (intake, lead, or client) even when the project is already active.
    await markEngagementSigned({
      projectId: project.project_id,
      docusealSubmissionId: submissionId,
    })

    // Billing is opt-in: only the project's explicit cent amount is actionable.
    // Intake budget text is deliberately absent from this query and code path.
    await billConfiguredDeposit(project)
    await notifySignedProject(project, submissionId)

    return json({ received: true })
  } catch (error) {
    console.error('DocuSeal webhook processing failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    })
    return json({ error: 'Webhook processing failed' }, 500)
  }
}
