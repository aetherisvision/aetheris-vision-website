import type { DatabaseMigration, MigrationSql } from './types'

export interface MigrationStatement {
  text: string
  values?: unknown[]
}

/**
 * Materialize a migration without executing it. Versioned migrations deliberately
 * use sql.query() so the same statements can be run by Neon and the local verifier.
 */
export function collectMigrationStatements(migration: DatabaseMigration): MigrationStatement[] {
  const statements: MigrationStatement[] = []
  const unsupportedTaggedTemplate = () => {
    throw new Error(`Migration ${migration.id} must use sql.query()`)
  }
  const collector = Object.assign(unsupportedTaggedTemplate, {
    query(text: string, values?: unknown[]) {
      statements.push({ text, values })
      return null as never
    },
  }) as unknown as MigrationSql

  migration.up(collector)
  return statements
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function dollarQuoted(value: string, prefix: string): string {
  let suffix = 0
  while (true) {
    const tag = `$${prefix}${suffix === 0 ? '' : `_${suffix}`}$`
    if (!value.includes(tag)) return `${tag}${value}${tag}`
    suffix += 1
  }
}

/**
 * Build the second statement in the lock -> guarded-migration transaction.
 *
 * The advisory lock must be acquired by a preceding statement under READ
 * COMMITTED. That guarantees this statement receives a fresh snapshot after a
 * competing migrator commits. Running the DDL and ledger insert inside the same
 * guard prevents a migration from being replayed after that wait.
 */
export function buildGuardedMigrationSql(migration: DatabaseMigration): string {
  const statements = collectMigrationStatements(migration)
  const executions = statements.map((statement, index) => {
    if (statement.values && statement.values.length > 0) {
      throw new Error(
        `Migration ${migration.id} statement ${index + 1} uses bind values; ` +
          'versioned migrations must contain static sql.query() statements',
      )
    }
    return `EXECUTE ${dollarQuoted(statement.text, `av_migration_statement_${index + 1}`)};`
  })

  const body = `
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM schema_migrations WHERE id = ${sqlLiteral(migration.id)}
  ) THEN
    ${executions.join('\n    ')}

    INSERT INTO schema_migrations (id, description)
    VALUES (${sqlLiteral(migration.id)}, ${sqlLiteral(migration.description)});
  END IF;
END
`

  return `DO ${dollarQuoted(body, 'av_migration_guard')};`
}
