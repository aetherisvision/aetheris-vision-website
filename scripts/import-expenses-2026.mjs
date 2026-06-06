/**
 * One-time backfill: imports receipts_2026.csv from the aetherisvision repo
 * into the Neon expenses table, skipping rows that are already present
 * (matched by date + vendor + amount).
 *
 * Usage:
 *   DATABASE_URL=<neon-url> node scripts/import-expenses-2026.mjs
 *   -- or --
 *   source ~/.secrets && node scripts/import-expenses-2026.mjs
 *
 * The script is idempotent — safe to run multiple times.
 */

import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const CSV_PATH =
  '/Users/marston.ward/Documents/GitHub/aetherisvision/receipts/receipts_2026.csv'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Source ~/.secrets first.')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// Normalise category names from the CSV to match the admin UI's CATEGORIES list
const CATEGORY_MAP = {
  'Software/SaaS':  'Software Subscriptions',
  'AI/API':         'Cloud Services',
  'Hosting':        'Domain & Hosting',
  'Shipping':       'Office Supplies',
  'Security':       'Software Subscriptions',
  'Equipment':      'Equipment & Hardware',
}

function normaliseCategory(raw) {
  return CATEGORY_MAP[raw?.trim()] ?? raw?.trim() ?? 'Other'
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    // Handle quoted fields
    const fields = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { fields.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    fields.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, fields[i] ?? '']))
  })
}

async function main() {
  const csv = readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCSV(csv)

  let inserted = 0
  let skipped = 0

  for (const row of rows) {
    const date = row['Date']?.trim()
    const vendor = row['Vendor']?.trim()
    const rawAmount = row['Amount']?.replace('$', '').trim()
    const amount = parseFloat(rawAmount)
    const description = row['Description']?.trim() || vendor
    const category = normaliseCategory(row['Category'])
    const taxYear = date ? new Date(date).getFullYear() : 2026

    if (!date || !vendor || isNaN(amount) || amount <= 0) {
      console.log(`  skip (incomplete): ${JSON.stringify(row)}`)
      skipped++
      continue
    }

    // Check for existing row by date + vendor + amount
    const existing = await sql`
      SELECT id FROM expenses
      WHERE date = ${date} AND vendor = ${vendor} AND amount = ${amount}
      LIMIT 1
    `
    if (existing.length > 0) {
      console.log(`  skip (exists):  ${date}  ${vendor}  $${amount.toFixed(2)}`)
      skipped++
      continue
    }

    await sql`
      INSERT INTO expenses (date, vendor, description, category, amount, tax_year, source)
      VALUES (${date}, ${vendor}, ${description}, ${category}, ${amount}, ${taxYear}, 'csv-import')
    `
    console.log(`  inserted:       ${date}  ${vendor}  $${amount.toFixed(2)}  [${category}]`)
    inserted++
  }

  console.log(`\nDone. inserted=${inserted}  skipped=${skipped}`)
}

main().catch(err => { console.error(err); process.exit(1) })
