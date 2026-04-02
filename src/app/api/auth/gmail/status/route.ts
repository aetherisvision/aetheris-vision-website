import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const rows = await sql`SELECT account, email FROM oauth_tokens WHERE account IN ('biz', 'per')`

  const map = Object.fromEntries(rows.map((r: { account: string; email: string | null }) => [r.account, r.email]))

  return NextResponse.json({
    biz: { connected: 'biz' in map, email: map.biz ?? null },
    per: { connected: 'per' in map, email: map.per ?? null },
  })
}
