/**
 * Read-only health check against Neon (same DATABASE_URL as the app).
 * Run from website/ with direnv loaded: node scripts/neon-ping.mjs
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('[Neon] FAIL — DATABASE_URL unset (unlock Bitwarden + cd website with direnv)')
  process.exit(2)
}

const sql = neon(url)

try {
  const rows = await sql`SELECT current_database() AS database, current_user AS role`
  const row = rows[0]
  console.log(`[Neon] OK — database=${row.database} role=${row.role}`)
  const n = await sql`SELECT count(*)::int AS n FROM expenses`
  console.log(`[Neon] expenses table readable — row count = ${n[0].n}`)
  process.exit(0)
} catch (err) {
  console.error('[Neon] FAIL —', err instanceof Error ? err.message : err)
  process.exit(1)
}
