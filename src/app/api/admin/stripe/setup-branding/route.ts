import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'


/**
 * POST /api/admin/stripe/setup-branding
 *
 * One-time call: applies Aetheris Vision brand colors to the Stripe account.
 * The logo must still be set manually: Stripe Dashboard → Settings → Branding.
 * Upload: brand/logo/horizontal/av-logo-horizontal-color-rgb.png (1620×504 transparent PNG)
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorizedResponse()

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return NextResponse.json({ error: 'STRIPE_SECRET_KEY not set' }, { status: 500 })

  const body = new URLSearchParams({
    'settings[branding][primary_color]':   '#29426C',
    'settings[branding][secondary_color]': '#5BA8D9',
  })

  const res = await fetch('https://api.stripe.com/v1/account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const data = await res.json() as { id?: string; error?: { message: string } }

  if (!res.ok) {
    return NextResponse.json({ error: data.error?.message ?? 'Stripe error' }, { status: res.status })
  }

  return NextResponse.json({
    ok: true,
    account_id: data.id,
    colors_applied: { primary: '#29426C', secondary: '#5BA8D9' },
    next_step: 'Go to Stripe Dashboard → Settings → Branding → upload brand/logo/horizontal/av-logo-horizontal-color-rgb.png (1620×504 transparent PNG) as your logo.',
  })
}
