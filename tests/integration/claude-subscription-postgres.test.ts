import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client, type QueryConfig } from 'pg'
import ts from 'typescript'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { collectMigrationStatements } from '@/lib/db/migrations/execution'
import { adminAiJobsMigration } from '@/lib/db/migrations/010_admin_ai_jobs'

// Execute the actual producer/worker SQL without launching Claude or loading
// credentials. AST extraction keeps query changes visible to these SQL tests;
// interpolations must be explicitly supplied, never evaluated as JavaScript.
function productionStatement(file: string, match: string, bindings: Record<string, unknown> = {}): QueryConfig {
  const path = resolve(process.cwd(), file)
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true)
  const matches: ts.TaggedTemplateExpression[] = []
  function visit(node: ts.Node) {
    if (ts.isTaggedTemplateExpression(node) && ['sql', 'db'].includes(node.tag.getText(source))
      && node.template.getText(source).includes(match)) matches.push(node)
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (matches.length !== 1) throw new Error(`Expected exactly one production SQL statement matching ${match}`)
  const template = matches[0].template
  if (ts.isNoSubstitutionTemplateLiteral(template)) return { text: template.text, values: [] }
  let text = template.head.text
  const values: unknown[] = []
  for (const span of template.templateSpans) {
    const name = span.expression.getText(source)
    if (!Object.hasOwn(bindings, name)) throw new Error(`Missing explicit SQL test binding: ${name}`)
    values.push(bindings[name])
    text += `$${values.length}${span.literal.text}`
  }
  return { text, values }
}

const producer = 'src/lib/claude-subscription.ts'
const worker = 'scripts/claude-subscription-worker.ts'
const input = { model: 'claude-fable-5', system: 'Synthetic test only.', prompt: 'Synthetic opportunity.' }
const serialized = JSON.stringify(input)
const dedupeKey = createHash('sha256').update(`assistant\n${serialized}`).digest('hex')
const enqueue = () => productionStatement(producer, 'INSERT INTO admin_ai_jobs', {
  'randomUUID()': randomUUID(), dedupeKey, kind: 'assistant', serialized,
})
const claim = (claimToken: string) => productionStatement(worker, "SET status = 'running'", { claimToken })
const complete = (id: string, claimToken: string, text: string) => productionStatement(worker, "SET status = 'complete'", {
  'job.id': id, claimToken, text,
})

// This opt-in suite creates and drops only its own random schema on loopback.
const connectionString = process.env.CLAUDE_QUEUE_TEST_DATABASE_URL
describe.skipIf(!connectionString)('Claude subscription queue PostgreSQL behavior', () => {
  const schema = `claude_queue_${randomUUID().replaceAll('-', '')}`
  let client: Client
  let connected = false
  beforeAll(async () => {
    const url = new URL(connectionString!)
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Tests require a loopback PostgreSQL database')
    client = new Client({ connectionString })
    await client.connect()
    connected = true
    await client.query(`CREATE SCHEMA ${schema}`)
    await client.query(`SET search_path TO ${schema}`)
    for (const statement of collectMigrationStatements(adminAiJobsMigration)) await client.query(statement.text, statement.values)
  })
  afterAll(async () => {
    if (connected) {
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
      await client.end()
    }
  })
  beforeEach(async () => { await client.query('TRUNCATE admin_ai_jobs, admin_ai_workers') })
  async function otherClient() {
    const other = new Client({ connectionString })
    await other.connect()
    await other.query(`SET search_path TO ${schema}`)
    return other
  }
  async function stored(id: string) { return (await client.query('SELECT * FROM admin_ai_jobs WHERE id=$1', [id])).rows[0] }

  it('resets an expired completed cache entry to a fresh queued job without retaining old output or lease state', async () => {
    const id = randomUUID()
    await client.query(`INSERT INTO admin_ai_jobs
      (id,dedupe_key,kind,input,status,result,error_code,attempts,claim_token,claimed_at,completed_at,queued_at)
      VALUES ($1,$2,'assistant',$3::jsonb,'complete','Old response','old_error',2,$4,
        now()-interval '26 hours',now()-interval '25 hours',now()-interval '26 hours')`,
    [id, dedupeKey, serialized, randomUUID()])
    const cached = await client.query(productionStatement(producer, 'SELECT result FROM admin_ai_jobs', { dedupeKey }))
    expect(cached.rows).toHaveLength(0)
    expect((await client.query(enqueue())).rows).toEqual([{ id }])
    const row = await stored(id)
    expect(row).toMatchObject({ status: 'queued', result: null, error_code: null, attempts: 0,
      claim_token: null, claimed_at: null, completed_at: null })
    expect(row.queued_at.getTime()).toBeGreaterThan(Date.now() - 10_000)
  })

  it('deduplicates simultaneous enqueue requests and recovers the same active job id', async () => {
    const other = await otherClient()
    try {
      const results = await Promise.all([client.query(enqueue()), other.query(enqueue())])
      expect(results.flatMap(result => result.rows)).toHaveLength(1)
      const lookup = productionStatement(producer, 'SELECT id FROM admin_ai_jobs WHERE dedupe_key', { dedupeKey })
      const [first, second] = await Promise.all([client.query(lookup), other.query(lookup)])
      expect(first.rows).toEqual(second.rows)
      expect(first.rows).toHaveLength(1)
      expect((await client.query('SELECT count(*)::int AS count FROM admin_ai_jobs')).rows[0].count).toBe(1)
      expect(await stored(first.rows[0].id)).toMatchObject({ status: 'queued', attempts: 0 })
    } finally { await other.end() }
  })

  it('lets concurrent workers claim distinct jobs while the earlier row remains locked', async () => {
    const firstId = randomUUID()
    const secondId = randomUUID()
    await client.query(`INSERT INTO admin_ai_jobs (id,dedupe_key,kind,input,queued_at)
      VALUES ($1,'first','assistant',$3::jsonb,now()-interval '1 minute'),
        ($2,'second','assistant',$3::jsonb,now())`, [firstId, secondId, serialized])
    const firstWorker = await otherClient()
    const secondWorker = await otherClient()
    try {
      await firstWorker.query('BEGIN')
      await secondWorker.query('BEGIN')
      // A broken SKIP LOCKED claim must fail promptly, not hang the suite.
      await secondWorker.query("SET LOCAL lock_timeout = '1s'")
      const first = await firstWorker.query(claim(randomUUID()))
      const second = await secondWorker.query(claim(randomUUID()))
      expect(first.rows[0].id).toBe(firstId)
      expect(second.rows[0].id).toBe(secondId)
      await firstWorker.query('COMMIT')
      await secondWorker.query('COMMIT')
      expect(await stored(firstId)).toMatchObject({ status: 'running', attempts: 1 })
      expect(await stored(secondId)).toMatchObject({ status: 'running', attempts: 1 })
    } finally {
      await firstWorker.query('ROLLBACK'); await secondWorker.query('ROLLBACK')
      await firstWorker.end(); await secondWorker.end()
    }
  })

  it('rejects renewal, completion, or failure by an obsolete worker after another worker replaces its lease', async () => {
    const id = (await client.query(enqueue())).rows[0].id
    const originalToken = randomUUID()
    const replacementToken = randomUUID()
    await client.query(claim(originalToken))
    await client.query("UPDATE admin_ai_jobs SET claimed_at=now()-interval '4 minutes' WHERE id=$1", [id])
    await client.query(productionStatement(worker, "SET status = CASE WHEN attempts < 2"))
    expect(await stored(id)).toMatchObject({ status: 'queued', claim_token: null, attempts: 1 })
    expect((await client.query(claim(replacementToken))).rows[0].id).toBe(id)
    await client.query("UPDATE admin_ai_jobs SET claimed_at=now()-interval '2 minutes' WHERE id=$1", [id])
    const beforeRenewal = (await stored(id)).claimed_at
    const renewal = (token: string) => productionStatement(worker, 'SET claimed_at = now()', {
      'owned.id': id, 'owned.token': token,
    })
    expect((await client.query(renewal(originalToken))).rowCount).toBe(0)
    expect((await stored(id)).claimed_at).toEqual(beforeRenewal)
    expect((await client.query(renewal(replacementToken))).rowCount).toBe(1)
    expect((await stored(id)).claimed_at.getTime()).toBeGreaterThan(Date.now() - 10_000)
    expect((await client.query(complete(id, originalToken, 'Obsolete result'))).rowCount).toBe(0)
    const staleFailure = productionStatement(worker, "SET status = 'failed', error_code = ${code}", {
      'job.id': id, claimToken: originalToken, code: 'claude_job_failed',
    })
    expect((await client.query(staleFailure)).rowCount).toBe(0)
    expect(await stored(id)).toMatchObject({ status: 'running', attempts: 2, claim_token: replacementToken, result: null })
    expect((await client.query(complete(id, replacementToken, 'Replacement result'))).rowCount).toBe(1)
    expect(await stored(id)).toMatchObject({ status: 'complete', attempts: 2, claim_token: null, result: 'Replacement result' })
  })
})
