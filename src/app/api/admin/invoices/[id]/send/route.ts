import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function isAdmin(req: NextRequest) {
  return req.cookies.get('av-admin-session')?.value === 'authenticated'
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(params.id)

  // Load invoice + client
  const rows = await sql`
    SELECT i.*, c.name AS client_name, c.email AS client_email,
           c.stripe_customer_id, p.name AS project_name
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    LEFT JOIN projects p ON p.id = i.project_id
    WHERE i.id = ${id}
  `
  if (!rows.length) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const inv = rows[0]
  if (inv.status === 'paid') return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })

  // Create or retrieve Stripe customer
  let stripeCustomerId: string = inv.stripe_customer_id
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: inv.client_name,
      email: inv.client_email,
      metadata: { client_id: String(inv.client_id) },
    })
    stripeCustomerId = customer.id
    await sql`UPDATE clients SET stripe_customer_id = ${stripeCustomerId} WHERE id = ${inv.client_id}`
  }

  // If we already have a Stripe invoice, just re-send the link
  let invoiceUrl: string = inv.stripe_invoice_url
  if (!invoiceUrl) {
    // Create Stripe invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: inv.due_date
        ? Math.max(1, Math.ceil((new Date(inv.due_date).getTime() - Date.now()) / 86400000))
        : 30,
      metadata: { invoice_id: String(id) },
      description: inv.description,
    })

    // Add line item
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: stripeInvoice.id,
      amount: inv.amount_cents,
      currency: 'usd',
      description: inv.description,
    })

    // Finalize to get hosted URL
    const finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id)
    invoiceUrl = finalized.hosted_invoice_url!

    await sql`
      UPDATE invoices SET
        stripe_invoice_id  = ${finalized.id},
        stripe_invoice_url = ${invoiceUrl},
        status             = 'sent'
      WHERE id = ${id}
    `
  } else if (inv.status === 'draft') {
    await sql`UPDATE invoices SET status = 'sent' WHERE id = ${id}`
  }

  // Send email to client
  const amount = (inv.amount_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  await resend.emails.send({
    from: 'Aetheris Vision <noreply@aetherisvision.com>',
    to: inv.client_email,
    subject: `Invoice ${inv.number} from Aetheris Vision — ${amount}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:32px;">
        <h2 style="color:#0f172a;margin-bottom:4px;">Aetheris Vision LLC</h2>
        <p style="color:#64748b;font-size:13px;margin-bottom:28px;">Invoice ${inv.number}</p>

        <p style="color:#334155;font-size:16px;margin-bottom:8px;">Hi ${inv.client_name},</p>
        <p style="color:#334155;font-size:15px;margin-bottom:24px;">
          A new invoice is ready for your review${inv.project_name ? ` for <strong>${inv.project_name}</strong>` : ''}.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;">AMOUNT DUE</p>
          <p style="margin:0;color:#0f172a;font-size:28px;font-weight:700;">${amount}</p>
          ${inv.due_date ? `<p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Due ${new Date(inv.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''}
        </div>

        <a href="${invoiceUrl}"
           style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;
                  padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;margin-bottom:28px;">
          View &amp; Pay Invoice →
        </a>

        <p style="color:#94a3b8;font-size:13px;margin-top:24px;">
          Questions? Reply to this email or contact us at
          <a href="mailto:marston@aetherisvision.com" style="color:#3b82f6;">marston@aetherisvision.com</a><br>
          Aetheris Vision LLC · 210 N Mustang Mall Terrace PMB 29, Mustang, OK 73064
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true, invoice_url: invoiceUrl })
}
