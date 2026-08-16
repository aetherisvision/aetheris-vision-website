import { sql } from '@/lib/db'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const rows = await sql`SELECT account, email FROM oauth_tokens WHERE account IN ('biz', 'per')`

  const map = Object.fromEntries(
    (rows as { account: string; email: string | null }[]).map(r => [r.account, r.email])
  )

  return NextResponse.json({
    biz: { connected: 'biz' in map, email: map.biz ?? null },
    per: { connected: 'per' in map, email: map.per ?? null },
  })
}
