import { Pool, type PoolConfig, type PoolClient } from 'pg'
import type { DatabaseQuery, DatabaseRow, QuerySql, Sql, TransactionOptions } from './types'

const isolationLevels = {
  ReadUncommitted: 'READ UNCOMMITTED',
  ReadCommitted: 'READ COMMITTED',
  RepeatableRead: 'REPEATABLE READ',
  Serializable: 'SERIALIZABLE',
} as const

/** A lazy query prevents statements from escaping the transaction callback. */
class PendingQuery implements Promise<DatabaseRow[]> {
  readonly [Symbol.toStringTag] = 'Promise'
  private result?: Promise<DatabaseRow[]>
  constructor(
    readonly text: string,
    readonly values: unknown[],
    private readonly execute: () => Promise<DatabaseRow[]>,
  ) {}

  then<TResult1 = DatabaseRow[], TResult2 = never>(
    onfulfilled?: ((value: DatabaseRow[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    this.result ??= this.execute()
    return this.result.then(onfulfilled, onrejected)
  }

  catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null): Promise<DatabaseRow[] | TResult> {
    return this.then(undefined, onrejected)
  }

  finally(onfinally?: (() => void) | null): Promise<DatabaseRow[]> {
    return this.then().finally(onfinally)
  }
}

function queryFunction(makeQuery: (text: string, values: unknown[]) => DatabaseQuery): QuerySql {
  return Object.assign((strings: TemplateStringsArray, ...values: unknown[]) => {
    if (!Array.isArray(strings) || !Array.isArray(strings.raw)) {
      throw new Error('Use a tagged template or sql.query(text, values)')
    }
    const text = strings.reduce((result, part, index) => result + (index ? `$${index}` : '') + part, '')
    return makeQuery(text, values)
  }, { query: (text: string, values: unknown[] = []) => makeQuery(text, values) })
}

export function postgresConfig(environment: Record<string, string | undefined>): PoolConfig {
  const connectionString = environment.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')
  const socket = environment.CLOUD_SQL_CONNECTION_NAME
  const url = new URL(connectionString)
  if (socket && !/^[a-z0-9-]+:[a-z0-9-]+:[a-z0-9-]+$/.test(socket)) {
    throw new Error('Invalid CLOUD_SQL_CONNECTION_NAME')
  }
  // Cloud Run's managed Cloud SQL socket authenticates and encrypts transport.
  // Direct TCP connections use the SSL settings in DATABASE_URL (never disable verification here).
  return {
    ...(socket ? {
      host: `/cloudsql/${socket}`,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      port: 5432,
    } : { connectionString }),
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    application_name: 'aetherisvision-crm',
  }
}

export function createPostgresSql(config: PoolConfig): Sql & { close(): Promise<void> } {
  const pool = new Pool(config)
  // Idle socket errors must not terminate the entire web server or leak credentials.
  pool.on('error', () => console.error('PostgreSQL idle connection failed'))
  const sql = queryFunction((text, values) => new PendingQuery(text, values, async () => {
    const result = await pool.query(text, values)
    return result.rows
  }))

  return Object.assign(sql, {
    async transaction(build: (sql: QuerySql) => DatabaseQuery[], options: TransactionOptions = {}) {
      const isolation = isolationLevels[options.isolationLevel ?? 'ReadCommitted']
      if (!isolation) throw new Error('Unsupported transaction isolation level')
      const owned = new Set<PendingQuery>()
      const collector = queryFunction((text, values) => {
        const query = new PendingQuery(text, values, () => Promise.reject(new Error('Transaction queries cannot execute independently')))
        owned.add(query)
        return query
      })
      const queries = build(collector)
      if (!Array.isArray(queries) || queries.some(query => !(query instanceof PendingQuery) || !owned.has(query))) {
        throw new Error('Transactions require queries created by their callback')
      }
      const client: PoolClient = await pool.connect()
      let destroy = false
      try {
        await client.query(`BEGIN ISOLATION LEVEL ${isolation} ${options.readOnly ? 'READ ONLY' : 'READ WRITE'} ${options.deferrable ? 'DEFERRABLE' : 'NOT DEFERRABLE'}`)
        const results: DatabaseRow[][] = []
        for (const query of queries as PendingQuery[]) {
          results.push((await client.query(query.text, query.values)).rows)
        }
        await client.query('COMMIT')
        return results
      } catch (error) {
        try { await client.query('ROLLBACK') } catch { destroy = true }
        throw error
      } finally {
        client.release(destroy)
      }
    },
    close: () => pool.end(),
  })
}
