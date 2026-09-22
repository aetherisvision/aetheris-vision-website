import { neon } from '@neondatabase/serverless'
import { createPostgresSql, postgresConfig } from './postgres'
import type { Sql } from './types'

let client: Sql | null = null

function getClient(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    const driver = process.env.DATABASE_DRIVER ?? 'neon'
    if (driver === 'postgres') client = createPostgresSql(postgresConfig(process.env))
    else if (driver === 'neon') client = neon(url) as unknown as Sql
    else throw new Error('Unsupported DATABASE_DRIVER')
  }
  return client
}

/**
 * Lazily-constructed database client. Importing this module never touches the
 * environment, so `next build` (and CI) can run with no database secret;
 * the connection string is read on first query at request time.
 */
export const sql: Sql = new Proxy(function sqlProxy() {} as unknown as Sql, {
  apply: (_target, _thisArg, args: unknown[]) => (getClient() as unknown as (...a: unknown[]) => unknown)(...args),
  get: (_target, prop) => (getClient() as unknown as Record<PropertyKey, unknown>)[prop],
})
