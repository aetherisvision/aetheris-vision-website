import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Client } from 'pg'
import { types as neonTypes } from '@neondatabase/serverless'
import { createPostgresSql, postgresConfig } from '@/lib/db/postgres'
import { documentProjectLinkMigration } from '@/lib/db/migrations/011_document_project_link'

describe('Cloud SQL connection configuration', () => {
  it('uses the managed socket instead of the connection URL host', () => {
    const config = postgresConfig({
      DATABASE_URL: 'postgresql://app:p%40ss@unused/crm',
      CLOUD_SQL_CONNECTION_NAME: 'business:us-central1:crm',
    })
    const client = new Client(config)
    expect(client.host).toBe('/cloudsql/business:us-central1:crm')
    expect(client.user).toBe('app')
    expect(client.database).toBe('crm')
    expect(config.password).toBe('p@ss')
    expect(config.connectionString).toBeUndefined()
  })
})

const url = process.env.MIGRATION_VERIFY_DATABASE_URL
describe.skipIf(!url)('PostgreSQL adapter on a disposable database', () => {
  let sql: ReturnType<typeof createPostgresSql>
  beforeAll(async () => {
    const parsed = new URL(url!)
    if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.pathname !== '/avcrm') {
      throw new Error('Adapter tests require the disposable local avcrm database')
    }
    sql = createPostgresSql({ connectionString: url, max: 2 })
    await sql.query('CREATE TABLE gcp_adapter_verification (id integer PRIMARY KEY, value text NOT NULL)')
  })
  afterAll(async () => {
    if (sql) {
      await sql.query('DROP TABLE IF EXISTS gcp_adapter_verification')
      await sql.close()
    }
  })

  it('binds hostile input and executes an awaited query only once', async () => {
    const value = "x'); DROP TABLE gcp_adapter_verification; --"
    const query = sql`INSERT INTO gcp_adapter_verification VALUES (1, ${value}) RETURNING value`
    expect(await query).toEqual([{ value }])
    expect(await query).toEqual([{ value }])
  })

  it('commits ordered statements on one connection with the requested isolation', async () => {
    const results = await sql.transaction(tx => [
      tx`INSERT INTO gcp_adapter_verification VALUES (2, 'before')`,
      tx`UPDATE gcp_adapter_verification SET value = 'after' WHERE id = 2 RETURNING value`,
      tx`SHOW transaction_isolation`,
    ], { isolationLevel: 'Serializable' })
    expect(results[1]).toEqual([{ value: 'after' }])
    expect(results[2]).toEqual([{ transaction_isolation: 'serializable' }])
  })

  it('rolls back all statements and leaves the pool usable after an error', async () => {
    await expect(sql.transaction(tx => [
      tx`INSERT INTO gcp_adapter_verification VALUES (3, 'rollback')`,
      tx`INSERT INTO gcp_adapter_verification VALUES (3, 'duplicate')`,
    ])).rejects.toMatchObject({ code: '23505' })
    expect(await sql`SELECT id FROM gcp_adapter_verification WHERE id = 3`).toEqual([])
  })

  it('rejects queries from outside the transaction callback', async () => {
    await expect(sql.transaction(() => [sql`INSERT INTO gcp_adapter_verification VALUES (4, 'escaped')`])).rejects.toThrow('callback')
    expect(await sql`SELECT id FROM gcp_adapter_verification WHERE id = 4`).toEqual([])
  })

  it('preserves Neon date, bigint, JSON and array representations', async () => {
    const [row] = await sql`SELECT '2026-09-22'::date AS d, '2026-09-22 12:34:56+00'::timestamptz AS t, 9007199254740993::bigint AS n, '{"ok":true}'::jsonb AS j, ARRAY[1,2] AS a`
    expect(row.d).toEqual(neonTypes.getTypeParser(1082)('2026-09-22'))
    expect(row.t).toEqual(neonTypes.getTypeParser(1184)('2026-09-22 12:34:56+00'))
    expect(row.n).toBe('9007199254740993')
    expect(row.j).toEqual({ ok: true })
    expect(row.a).toEqual([1, 2])
  })

  it('upgrades legacy documents without losing rows and keeps project history guarded', async () => {
    const results = await sql.transaction(tx => [
      tx.query('CREATE TEMP TABLE projects (id integer PRIMARY KEY) ON COMMIT DROP'),
      tx.query('CREATE TEMP TABLE documents (id integer PRIMARY KEY, title text) ON COMMIT DROP'),
      tx.query("INSERT INTO documents VALUES (1, 'Preserved document')"),
      ...documentProjectLinkMigration.up(tx),
      ...documentProjectLinkMigration.up(tx),
      tx.query('INSERT INTO projects VALUES (1)'),
      tx.query('UPDATE documents SET project_id = 1 WHERE id = 1'),
      tx.query('DELETE FROM projects WHERE id = 1'),
      tx.query('SELECT title, project_id FROM documents'),
    ])
    expect(results.at(-1)).toEqual([{ title: 'Preserved document', project_id: null }])
  })
})
