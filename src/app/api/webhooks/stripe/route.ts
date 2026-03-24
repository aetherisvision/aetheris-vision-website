import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { sql } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'invoice.paid') {
    const stripeInvoice = event.data.object as Stripe.Invoice
    const invoiceId = stripeInvoice.metadata?.invoice_id
    if (invoiceId) {
      await sql`
        UPDATE invoices SET
          status  = 'paid',
          paid_at = NOW()
        WHERE id = ${Number(invoiceId)}
      `
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const stripeInvoice = event.data.object as Stripe.Invoice
    const invoiceId = stripeInvoice.metadata?.invoice_id
    if (invoiceId) {
      await sql`
        UPDATE invoices SET status = 'overdue'
        WHERE id = ${Number(invoiceId)} AND status != 'paid'
      `
    }
  }

  return NextResponse.json({ received: true })
}
