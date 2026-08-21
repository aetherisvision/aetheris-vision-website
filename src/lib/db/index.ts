import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

type Sql = NeonQueryFunction<false, false>

let client: Sql | null = null

function getClient(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    client = neon(url)
  }
  return client
}

/**
 * Lazily-constructed Neon client. Importing this module never touches the
 * environment, so `next build` (and CI) can run with no database secret;
 * the connection string is read on first query at request time.
 */
export const sql: Sql = new Proxy(function sqlProxy() {} as unknown as Sql, {
  apply: (_target, _thisArg, args: unknown[]) => (getClient() as unknown as (...a: unknown[]) => unknown)(...args),
  get: (_target, prop) => (getClient() as unknown as Record<PropertyKey, unknown>)[prop],
})
