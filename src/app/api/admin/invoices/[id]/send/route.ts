import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { sql } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorizedResponse()

  const { id: idStr } = await params
  const id = Number(idStr)

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

  // Validate Stripe URL before embedding in email
  if (!invoiceUrl?.startsWith('https://invoice.stripe.com/')) {
    throw new Error(`Unexpected Stripe invoice URL: ${invoiceUrl}`)
  }

  await resend.emails.send({
    from: 'Aetheris Vision <noreply@aetherisvision.com>',
    to: inv.client_email,
    replyTo: 'contact@aetherisvision.com',
    subject: `Invoice ${inv.number} from Aetheris Vision — ${amount}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

              <!-- Header bar with logo -->
              <tr>
                <td style="background:#0A1628;padding:20px 32px;">
                  <img src="https://aetherisvision.com/logo/av-logo-horizontal-dark.png"
                       alt="Aetheris Vision" width="220" height="55"
                       style="display:block;border:0;max-width:220px;" />
                </td>
              </tr>

              <!-- Invoice number strip -->
              <tr>
                <td style="background:#1e3a5f;padding:8px 32px;">
                  <span style="color:#7EABCA;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Invoice ${escHtml(String(inv.number))}</span>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  <p style="color:#334155;font-size:16px;margin:0 0 8px;">Hi ${escHtml(String(inv.client_name))},</p>
                  <p style="color:#334155;font-size:15px;margin:0 0 28px;line-height:1.6;">
                    A new invoice is ready for your review${inv.project_name ? ` for <strong>${escHtml(String(inv.project_name))}</strong>` : ''}.
                  </p>

                  <!-- Amount card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 6px;color:#64748b;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Amount Due</p>
                        <p style="margin:0;color:#0f172a;font-size:30px;font-weight:700;line-height:1;">${amount}</p>
                        ${inv.due_date ? `<p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Due ${new Date(inv.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''}
                      </td>
                    </tr>
                  </table>

                  <!-- CTA button -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr>
                      <td style="background:#29426C;border-radius:6px;">
                        <a href="${escHtml(invoiceUrl)}"
                           style="display:inline-block;color:#ffffff;text-decoration:none;padding:14px 36px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                          View &amp; Pay Invoice →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
                    Questions? Reply to this email or reach us at
                    <a href="mailto:contact@aetherisvision.com" style="color:#5BA8D9;text-decoration:none;">contact@aetherisvision.com</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;">
                  <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                    Aetheris Vision LLC · 210 N Mustang Mall Terrace PMB 29, Mustang, OK 73064<br>
                    <a href="https://aetherisvision.com" style="color:#5BA8D9;text-decoration:none;">aetherisvision.com</a>
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  })

  return NextResponse.json({ ok: true, invoice_url: invoiceUrl })
}

/** Escape HTML special characters to prevent injection in template strings */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
