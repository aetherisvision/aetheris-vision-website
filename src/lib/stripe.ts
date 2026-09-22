import Stripe from 'stripe'

let client: Stripe | undefined
// Container builds run without production secrets. Initialize at request time.
export const stripe = new Proxy({} as Stripe, {
  get(_target, property) {
    if (!client) {
      const key = process.env.STRIPE_SECRET_KEY
      if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
      client = new Stripe(key)
    }
    const value = Reflect.get(client, property)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export function formatAmountForStripe(dollars: number): number {
  return Math.round(dollars * 100)
}

export function formatCentsAsDollars(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
