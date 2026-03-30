import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { downloadSignedPdf } from '@/lib/docuseal'
import { stripe } from '@/lib/stripe'
import { sql } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Verify the request is genuinely from Docuseal
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-docuseal-signature') ?? ''
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET ?? ''

  // Reject requests that don't have a valid signature
  if (!secret || !verifySignature(rawBody, signature, secret)) {
    console.warn('Docuseal webhook: invalid signature — request rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)

  // Only handle fully completed submissions
  if (payload.event_type !== 'submission.completed') {
    return NextResponse.json({ received: true })
  }

  const { submission } = payload
  const submissionId = String(submission.id)

  try {
    // Download the signed PDF from Docuseal
    const pdfBuffer = await downloadSignedPdf(submissionId)
    const pdfBase64 = pdfBuffer.toString('base64')

    // Look up the project + client linked to this submission
    const rows = await sql`
      SELECT
        p.id AS project_id,
        p.name AS project_name,
        c.id AS client_id,
        c.name AS client_name,
        c.email AS client_email,
        c.contact_name,
        c.stripe_customer_id,
        i.id AS intake_id,
        i.budget_range,
        i.pro_bono
      FROM projects p
      JOIN clients c ON c.id = p.client_id
      LEFT JOIN intake_submissions i ON i.project_id = p.id
      WHERE p.docuseal_submission_id = ${submissionId}
      LIMIT 1
    `

    if (rows.length === 0) {
      console.warn(`Docuseal webhook: no project found for submission ${submissionId}`)
      return NextResponse.json({ received: true })
    }

    const {
      project_id, project_name,
      client_id, client_name, client_email, contact_name,
      stripe_customer_id,
      intake_id, budget_range, pro_bono,
    } = rows[0]

    // Store signed PDF and mark project as signed
    await sql`
      UPDATE projects
      SET signed_pdf_base64 = ${pdfBase64},
          status = 'signed',
          signed_at = NOW()
      WHERE id = ${project_id}
    `
    console.log(`✅ Signed PDF stored for project ${project_id} (${client_name})`)

    // Update intake status if linked
    if (intake_id) {
      await sql`UPDATE intake_submissions SET status = 'won' WHERE id = ${intake_id}`
    }

    // --- Skip invoicing for pro bono engagements ---
    if (pro_bono) {
      console.log(`✅ Pro bono engagement — skipping Stripe invoice for project ${project_id}`)
      try {
        await resend.emails.send({
          from: 'system@aetherisvision.com',
          to: ['marston@aetherisvision.com'],
          subject: `✅ SOW Signed (Pro Bono) — ${client_name}`,
          text: `${contact_name} at ${client_name} has signed the pro bono SOW for "${project_name}".\n\nNo invoice has been generated — this is a complimentary engagement.\n\nProject ID: ${project_id} | Client ID: ${client_id}`,
        })
      } catch (e) {
        console.error('Notification failed (non-fatal):', e)
      }
      return NextResponse.json({ received: true })
    }

    // --- Auto-create Stripe customer if needed ---
    let stripeCustomerId = stripe_customer_id as string | null
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: client_name,
        email: client_email,
        metadata: { client_id: String(client_id), project_id: String(project_id) },
      })
      stripeCustomerId = customer.id
      await sql`UPDATE clients SET stripe_customer_id = ${stripeCustomerId} WHERE id = ${client_id}`
      console.log(`✅ Stripe customer created: ${stripeCustomerId}`)
    }

    // --- Parse deposit amount from budget_range ---
    // Extract first dollar figure from budget string, default to $2,500 deposit if unparseable
    let depositCents = 250000 // $2,500 default
    if (budget_range) {
      const match = (budget_range as string).replace(/,/g, '').match(/\$?(\d+)/)
      if (match) {
        const totalDollars = parseInt(match[1], 10)
        // 50% deposit
        depositCents = Math.round(totalDollars * 0.5) * 100
      }
    }

    // --- Create Stripe invoice (50% deposit) ---
    const invoiceNumber = `AV-${Date.now().toString().slice(-6)}`
    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
      metadata: { project_id: String(project_id), client_id: String(client_id) },
      description: `${project_name} — 50% Deposit`,
    })

    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: stripeInvoice.id,
      amount: depositCents,
      currency: 'usd',
      description: `${project_name} — Project Deposit (50%)`,
    })

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id)
    await stripe.invoices.sendInvoice(finalizedInvoice.id)

    // Save invoice to DB
    await sql`
      INSERT INTO invoices (client_id, project_id, number, description, amount_cents, status, stripe_invoice_id, stripe_invoice_url, due_date)
      VALUES (
        ${client_id}, ${project_id}, ${invoiceNumber},
        ${`${project_name} — 50% Deposit`},
        ${depositCents}, 'sent',
        ${finalizedInvoice.id},
        ${finalizedInvoice.hosted_invoice_url ?? null},
        ${finalizedInvoice.due_date ? new Date(finalizedInvoice.due_date * 1000).toISOString().split('T')[0] : null}
      )
    `
    console.log(`✅ Stripe invoice created and sent: ${invoiceNumber} ($${depositCents / 100})`)

    // --- Notify Marston ---
    try {
      await resend.emails.send({
        from: 'system@aetherisvision.com',
        to: ['marston@aetherisvision.com'],
        subject: `✅ SOW Signed — ${client_name} | Invoice Sent`,
        text: `${contact_name} at ${client_name} has signed the SOW for "${project_name}".\n\nA 50% deposit invoice ($${(depositCents / 100).toLocaleString()}) has been sent to ${client_email} via Stripe.\n\nInvoice: ${finalizedInvoice.hosted_invoice_url ?? 'N/A'}\n\nProject ID: ${project_id} | Client ID: ${client_id}`,
      })
    } catch (emailErr) {
      console.error('Marston notification failed (non-fatal):', emailErr)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Docuseal webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
