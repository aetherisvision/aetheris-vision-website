import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import type Stripe from 'stripe'
import { isAdmin } from '@/lib/admin-auth'
import {
  linkStripeInvoice,
  markInvoiceNotificationSent,
  reserveInvoiceNotification,
} from '@/lib/crm'
import { sql } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { escapeHtml } from '@/lib/escape-html'

export const dynamic = 'force-dynamic'

const MAX_POSTGRES_INTEGER = 2_147_483_647

interface InvoiceDeliveryRow {
  id: number
  client_id: number
  project_id: number | null
  purpose: string | null
  number: string
  description: string
  amount_cents: number
  status: string
  stripe_invoice_id: string | null
  stripe_customer_id: string | null
  client_name: string
  client_email: string
  project_name: string | null
  due_date: string | Date | null
}

class DeliveryError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function routeId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id <= MAX_POSTGRES_INTEGER ? id : null
}

function stripeObjectId(value: string | { id: string } | null | undefined): string | null {
  if (typeof value === 'string') return value
  return value && typeof value.id === 'string' ? value.id : null
}

function verifyRemoteInvoice(
  remote: Stripe.Invoice,
  localInvoiceId: number,
  stripeCustomerId: string,
) {
  if (remote.metadata?.invoice_id !== String(localInvoiceId)) {
    throw new DeliveryError(409, 'The linked Stripe invoice does not match this invoice')
  }
  if (stripeObjectId(remote.customer) !== stripeCustomerId) {
    throw new DeliveryError(409, 'The linked Stripe invoice belongs to a different customer')
  }
}

function normalizeDueDate(value: string | Date): string {
  const candidate = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    throw new DeliveryError(500, 'The invoice has an invalid due date')
  }
  const parsed = new Date(`${candidate}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate) {
    throw new DeliveryError(500, 'The invoice has an invalid due date')
  }
  return candidate
}

function stripeDueDate(value: string | Date): number {
  const dueDate = normalizeDueDate(value)
  return Math.floor(new Date(`${dueDate}T23:59:59.000Z`).getTime() / 1000)
}

function validatedInvoiceUrl(value: string | null | undefined): string {
  if (!value) throw new DeliveryError(502, 'Stripe did not return a hosted invoice URL')

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new DeliveryError(502, 'Stripe returned an invalid hosted invoice URL')
  }
  if (
    parsed.protocol !== 'https:'
    || parsed.hostname !== 'invoice.stripe.com'
    || parsed.username
    || parsed.password
  ) {
    throw new DeliveryError(502, 'Stripe returned an invalid hosted invoice URL')
  }
  return parsed.toString()
}

function emailHtml(inv: InvoiceDeliveryRow, amount: string, invoiceUrl: string): string {
  const project = inv.project_name
    ? ` for <strong>${escapeHtml(inv.project_name)}</strong>`
    : ''
  const dueDate = inv.due_date
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${normalizeDueDate(inv.due_date)}T12:00:00.000Z`))
    : null

  return `
    <!DOCTYPE html>
    <html lang="en">
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#0A1628;padding:20px 32px;">
                <img src="https://aetherisvision.com/logo/av-logo-horizontal-reversed.png" alt="Aetheris Vision" width="220" height="68" style="display:block;border:0;max-width:220px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="background:#1e3a5f;padding:8px 32px;">
                <span style="color:#7EABCA;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Invoice ${escapeHtml(inv.number)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="color:#334155;font-size:16px;margin:0 0 8px;">Hi ${escapeHtml(inv.client_name)},</p>
                <p style="color:#334155;font-size:15px;margin:0 0 28px;line-height:1.6;">A new invoice is ready for your review${project}.</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
                  <tr><td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;color:#64748b;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Amount Due</p>
                    <p style="margin:0;color:#0f172a;font-size:30px;font-weight:700;line-height:1;">${escapeHtml(amount)}</p>
                    ${dueDate ? `<p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Due ${escapeHtml(dueDate)}</p>` : ''}
                  </td></tr>
                </table>
                <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                  <tr><td style="background:#29426C;border-radius:6px;">
                    <a href="${escapeHtml(invoiceUrl)}" style="display:inline-block;color:#ffffff;text-decoration:none;padding:14px 36px;font-size:16px;font-weight:600;letter-spacing:0.3px;">View &amp; Pay Invoice →</a>
                  </td></tr>
                </table>
                <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">Questions? Reply to this email or reach us at <a href="mailto:contact@aetherisvision.com" style="color:#5BA8D9;text-decoration:none;">contact@aetherisvision.com</a></p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">Aetheris Vision LLC · 210 N Mustang Mall Terrace PMB 29, Mustang, OK 73064<br><a href="https://aetherisvision.com" style="color:#5BA8D9;text-decoration:none;">aetherisvision.com</a></p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
}

async function claimDeliveryState(invoiceId: number): Promise<string> {
  const claimed = await sql`
    UPDATE invoices
    SET status = 'sent'
    WHERE id = ${invoiceId}
      AND status = 'draft'
    RETURNING status
  `
  if (claimed.length) return 'sent'

  const current = await sql`SELECT status FROM invoices WHERE id = ${invoiceId}`
  if (!current.length) throw new DeliveryError(404, 'Invoice not found')
  return String(current[0].status)
}

async function stripeCustomer(inv: InvoiceDeliveryRow): Promise<string> {
  if (typeof inv.stripe_customer_id === 'string' && inv.stripe_customer_id) {
    return inv.stripe_customer_id
  }

  const customer = await stripe.customers.create(
    {
      name: inv.client_name,
      email: inv.client_email,
      metadata: {
        client_id: String(inv.client_id),
        invoice_id: String(inv.id),
      },
    },
    { idempotencyKey: `av:invoice:${inv.id}:customer` },
  )

  const linked = await sql`
    UPDATE clients
    SET stripe_customer_id = COALESCE(stripe_customer_id, ${customer.id})
    WHERE id = ${inv.client_id}
      AND (stripe_customer_id IS NULL OR stripe_customer_id = ${customer.id})
    RETURNING stripe_customer_id
  `
  if (!linked.length || linked[0].stripe_customer_id !== customer.id) {
    throw new DeliveryError(409, 'The client is already linked to a different Stripe customer')
  }
  return customer.id
}

async function stripeInvoice(
  inv: InvoiceDeliveryRow,
  stripeCustomerId: string,
): Promise<Stripe.Invoice> {
  let remote: Stripe.Invoice

  if (inv.stripe_invoice_id) {
    remote = await stripe.invoices.retrieve(inv.stripe_invoice_id)
    verifyRemoteInvoice(remote, inv.id, stripeCustomerId)
  } else {
    const metadata: Record<string, string> = {
      invoice_id: String(inv.id),
      client_id: String(inv.client_id),
    }
    if (inv.project_id !== null) metadata.project_id = String(inv.project_id)
    if (inv.purpose) metadata.purpose = inv.purpose

    remote = await stripe.invoices.create(
      {
        customer: stripeCustomerId,
        collection_method: 'send_invoice',
        ...(inv.due_date
          ? { due_date: stripeDueDate(inv.due_date) }
          : { days_until_due: 30 }),
        metadata,
        description: inv.description,
      },
      { idempotencyKey: `av:invoice:${inv.id}:invoice` },
    )
    verifyRemoteInvoice(remote, inv.id, stripeCustomerId)

    try {
      await linkStripeInvoice({
        invoiceId: inv.id,
        stripeInvoiceId: remote.id,
        stripeInvoiceUrl: remote.hosted_invoice_url,
      })
    } catch {
      throw new DeliveryError(409, 'The invoice is already linked to a different Stripe invoice')
    }
  }

  if (remote.status === 'draft') {
    await stripe.invoiceItems.create(
      {
        customer: stripeCustomerId,
        invoice: remote.id,
        amount: inv.amount_cents,
        currency: 'usd',
        description: inv.description,
        metadata: { invoice_id: String(inv.id) },
      },
      { idempotencyKey: `av:invoice:${inv.id}:item` },
    )
    remote = await stripe.invoices.finalizeInvoice(
      remote.id,
      {},
      { idempotencyKey: `av:invoice:${inv.id}:finalize` },
    )
    verifyRemoteInvoice(remote, inv.id, stripeCustomerId)
  }

  if (remote.status !== 'open') {
    throw new DeliveryError(409, `Stripe invoice delivery is not available while it is ${remote.status ?? 'unavailable'}`)
  }
  return remote
}

async function sendNotification(
  inv: InvoiceDeliveryRow,
  amount: string,
  invoiceUrl: string,
): Promise<boolean> {
  const idempotencyKey = `av:invoice:${inv.id}:notification:v1`
  let reservation: Awaited<ReturnType<typeof reserveInvoiceNotification>>
  try {
    reservation = await reserveInvoiceNotification({ invoiceId: inv.id, idempotencyKey })
  } catch {
    return false
  }

  if (!reservation.shouldSend) return Boolean(reservation.notificationSentAt)
  if (!process.env.RESEND_API_KEY) return false

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send(
      {
        from: 'Aetheris Vision <noreply@aetherisvision.com>',
        to: inv.client_email,
        replyTo: 'contact@aetherisvision.com',
        subject: `Invoice ${inv.number} from Aetheris Vision — ${amount}`,
        html: emailHtml(inv, amount, invoiceUrl),
      },
      { idempotencyKey },
    )
    if (result.error || !result.data?.id) return false

    await markInvoiceNotificationSent({ invoiceId: inv.id, idempotencyKey })
    return true
  } catch {
    return false
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(req)) return json({ error: 'Unauthorized' }, 401)

  const { id: idValue } = await params
  const id = routeId(idValue)
  if (id === null) return json({ error: 'Invoice id must be a positive integer' }, 400)

  let inv: InvoiceDeliveryRow
  try {
    const currentStatus = await claimDeliveryState(id)
    if (currentStatus !== 'sent') {
      return json({ error: 'Only draft or sent invoices can be delivered' }, 409)
    }

    const rows = await sql`
      SELECT i.*, c.name AS client_name, c.email AS client_email,
             c.stripe_customer_id, p.name AS project_name
      FROM invoices i
      JOIN clients c ON c.id = i.client_id
      LEFT JOIN projects p ON p.id = i.project_id
      WHERE i.id = ${id}
    `
    if (!rows.length) return json({ error: 'Invoice not found' }, 404)
    inv = rows[0] as InvoiceDeliveryRow
  } catch (error) {
    if (error instanceof DeliveryError) return json({ error: error.message }, error.status)
    return json({ error: 'Unable to prepare invoice delivery' }, 500)
  }

  try {
    const stripeCustomerId = await stripeCustomer(inv)
    const remote = await stripeInvoice(inv, stripeCustomerId)
    const invoiceUrl = validatedInvoiceUrl(remote.hosted_invoice_url)

    try {
      await linkStripeInvoice({
        invoiceId: inv.id,
        stripeInvoiceId: remote.id,
        stripeInvoiceUrl: invoiceUrl,
      })
    } catch {
      throw new DeliveryError(409, 'The invoice is already linked to a different Stripe invoice')
    }

    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(inv.amount_cents / 100)
    const notificationSent = await sendNotification(inv, amount, invoiceUrl)

    return json({
      ok: true,
      invoice_url: invoiceUrl,
      notification_sent: notificationSent,
      ...(!notificationSent
        ? { warning: 'The Stripe invoice is ready, but email delivery needs to be retried' }
        : {}),
    })
  } catch (error) {
    if (error instanceof DeliveryError) return json({ error: error.message }, error.status)
    return json({ error: 'Stripe could not complete this invoice; retry delivery' }, 502)
  }
}
