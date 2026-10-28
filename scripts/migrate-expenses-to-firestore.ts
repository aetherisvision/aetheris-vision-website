/**
 * Idempotent migration script: copies existing PostgreSQL `expenses` rows into
 * Firestore metadata (`FIRESTORE_PROJECT_ID` / `FIRESTORE_DATABASE_ID`) and
 * migrates any legacy `@vercel/blob` receipt URLs into the private GCS receipt
 * bucket (`GCS_RECEIPT_BUCKET`).
 *
 * Usage:
 *   FIRESTORE_PROJECT_ID=lucid-loader-493512-g1 \
 *   GCS_RECEIPT_BUCKET=lucid-loader-493512-g1-crm-private \
 *   npm run db:migrate:expenses-firestore
 */

import { backfillExpensesToFirestoreAndGcs } from '../src/lib/expense-store'
import { getFirestoreExpenseConfig } from '../src/lib/expense-firestore'

async function main() {
  const config = getFirestoreExpenseConfig()
  const result = await backfillExpensesToFirestoreAndGcs()
  console.log(
    JSON.stringify({
      ok: true,
      projectId: config.projectId,
      databaseId: config.databaseId,
      expensesCollection: config.expensesCollection,
      receiptsCollection: config.receiptsCollection,
      ...result,
    }),
  )
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  )
  process.exit(1)
})
