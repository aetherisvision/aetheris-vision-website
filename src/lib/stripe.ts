import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export function formatAmountForStripe(dollars: number): number {
  return Math.round(dollars * 100)
}

export function formatCentsAsDollars(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
