import { runMigrations } from '../src/lib/db/migrations'

async function migrate() {
  const result = await runMigrations()
  console.log(
    `Migration complete: ${result.appliedMigrations.length} migration(s), ` +
      `${result.verifiedColumns} columns, ${result.verifiedIndexes} indexes, ` +
      `${result.verifiedConstraints} constraints verified`,
  )
}

migrate().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
