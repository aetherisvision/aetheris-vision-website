import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { sql } from '@/lib/db'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

const MAX_POSTGRES_INTEGER = 2_147_483_647

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function localInvoiceId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id <= MAX_POSTGRES_INTEGER ? id : null
}

function stripeInvoice(event: Stripe.Event): Stripe.Invoice | null {
  const value = event.data.object
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !value.id
  ) {
    return null
  }
  return value as Stripe.Invoice
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return json({ error: 'Missing signature or webhook secret' }, 400)
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret)
  } catch {
    return json({ error: 'Invalid signature' }, 400)
  }

  if (event.type !== 'invoice.paid' && event.type !== 'invoice.payment_failed') {
    return json({ received: true })
  }

  const remote = stripeInvoice(event)
  const invoiceId = localInvoiceId(remote?.metadata?.invoice_id)
  if (!remote || invoiceId === null) {
    return json({ received: true })
  }

  try {
    if (event.type === 'invoice.paid') {
      await sql`
        UPDATE invoices
        SET
          status = 'paid',
          paid_at = COALESCE(paid_at, NOW())
        WHERE id = ${invoiceId}
          AND stripe_invoice_id = ${remote.id}
          AND (status != 'paid' OR paid_at IS NULL)
      `
    } else {
      await sql`
        UPDATE invoices
        SET status = 'overdue'
        WHERE id = ${invoiceId}
          AND stripe_invoice_id = ${remote.id}
          AND status NOT IN ('paid', 'overdue')
      `
    }
  } catch {
    return json({ error: 'Unable to process Stripe event' }, 500)
  }

  return json({ received: true })
}
