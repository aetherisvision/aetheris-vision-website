import { randomUUID } from 'node:crypto'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectMigrationStatements } from '@/lib/db/migrations/execution'
import { leadWorkspaceMigration } from '@/lib/db/migrations/009_lead_workspace'

const mock = vi.hoisted(() => ({ sql: Object.assign(vi.fn(), { transaction: vi.fn() }) }))
vi.mock('@/lib/db', () => ({ sql: mock.sql }))
import { captureGovconLead, manageLeads, prepareLeadProposal, transitionProjectLifecycle, updateGovconLead, updateLead, type UpdateLeadInput } from '@/lib/crm'

// Opt-in real SQL verification. Refuses remote databases and uses its own
// disposable schema, never the caller's public schema or production data.
const connectionString = process.env.CRM_WORKSPACE_TEST_DATABASE_URL
describe.skipIf(!connectionString)('opportunity workspace PostgreSQL behavior', () => {
  const schema = `crm_workspace_${randomUUID().replaceAll('-', '')}`
  let client: Client
  let connected = false
  let backendPid: number
  async function query(strings: TemplateStringsArray, ...values: unknown[]) {
    const text = strings.reduce((result, part, index) => `${result}${index ? `$${index}` : ''}${part}`, '')
    return (await client.query(text, values)).rows
  }
  beforeAll(async () => {
    const url = new URL(connectionString!)
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Tests require a loopback PostgreSQL database')
    client = new Client({ connectionString })
    await client.connect()
    connected = true
    backendPid = (await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
    await client.query(`CREATE SCHEMA ${schema}`)
    await client.query(`SET search_path TO ${schema}`)
    await client.query(`
      CREATE TABLE clients (
        id serial PRIMARY KEY, name text NOT NULL, contact_name text NOT NULL,
        email text NOT NULL, phone text, relationship_status text DEFAULT 'prospect', updated_at timestamptz DEFAULT now()
      );
      CREATE UNIQUE INDEX client_email ON clients ((lower(btrim(email))));
      CREATE TABLE leads (
        id serial PRIMARY KEY, name text NOT NULL, email text NOT NULL, organization text,
        phone text, service text, message text NOT NULL, source text NOT NULL DEFAULT 'test', external_id text,
        stage text NOT NULL DEFAULT 'new', estimated_value_cents integer, next_follow_up timestamptz, notes text,
        client_id integer REFERENCES clients(id), gmail_draft_id text, gmail_draft_created_at timestamptz,
        govcon jsonb, email_verified_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );
      CREATE UNIQUE INDEX lead_external ON leads (source, external_id) WHERE external_id IS NOT NULL;
      CREATE TABLE projects (
        id serial PRIMARY KEY, name text, client_id integer REFERENCES clients(id), lead_id integer REFERENCES leads(id),
        status text DEFAULT 'proposal', source text, external_id text, signed_at timestamptz, docuseal_submission_id text,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );
      CREATE UNIQUE INDEX project_external ON projects (source, external_id) WHERE external_id IS NOT NULL;
      CREATE TABLE intake_submissions (
        id serial PRIMARY KEY, lead_id integer REFERENCES leads(id), project_id integer REFERENCES projects(id),
        status text DEFAULT 'new', created_at timestamptz DEFAULT now(), submitted_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );
    `)
    // Migrate a populated table to prove existing stage and lead data survive.
    await client.query("INSERT INTO leads (name,email,message,stage) VALUES ('Existing','existing@example.com','Existing','contacted')")
    for (const statement of collectMigrationStatements(leadWorkspaceMigration)) await client.query(statement.text, statement.values)
    const existing = (await client.query('SELECT stage, activity_history, workflow_version, removed_at FROM leads')).rows[0]
    expect(existing).toMatchObject({ stage: 'contacted', activity_history: [], workflow_version: 0, removed_at: null })
    mock.sql.mockImplementation(query)
    mock.sql.transaction.mockImplementation(async (callback: (sql: typeof query) => Promise<unknown>[], options?: { isolationLevel?: string }) => {
      await client.query(options?.isolationLevel === 'Serializable'
        ? 'BEGIN ISOLATION LEVEL SERIALIZABLE' : 'BEGIN ISOLATION LEVEL READ COMMITTED')
      try {
        const results = await Promise.all(callback(query))
        await client.query('COMMIT')
        return results
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    })
  })
  afterAll(async () => {
    if (connected) {
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
      await client.end()
    }
  })
  beforeEach(async () => {
    await client.query('TRUNCATE intake_submissions, projects, leads, clients RESTART IDENTITY CASCADE')
  })
  async function lead(stage = 'new') {
    return (await client.query("INSERT INTO leads (name,email,message,stage) VALUES ('Opportunity','officer@example.com','Scope',$1) RETURNING *", [stage])).rows[0]
  }
  async function stored(id: number) { return (await client.query('SELECT * FROM leads WHERE id=$1', [id])).rows[0] }
  function update(id: number, patch: Partial<UpdateLeadInput> = {}): UpdateLeadInput {
    return { leadId: id, stage: 'new', estimatedValueCents: null, nextFollowUp: null, notes: null, ...patch }
  }
  async function competingWriter() {
    const other = new Client({ connectionString })
    await other.connect()
    await other.query(`SET search_path TO ${schema}`)
    await other.query('BEGIN')
    return other
  }
  async function waitForRowLock(observer: Client) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const result = await observer.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1', [backendPid])
      if (result.rows[0]?.wait_event_type === 'Lock') return
      await new Promise(resolve => setTimeout(resolve, 20))
      await observer.query('SELECT pg_stat_clear_snapshot()')
    }
    throw new Error('Expected the concurrent workflow write to wait on a row lock')
  }

  it('removes and restores a selection, preserving stage and linked records with idempotent retries', async () => {
    const first = await lead('contacted')
    const second = await lead('review')
    await client.query('INSERT INTO projects (lead_id) VALUES ($1)', [first.id])
    const removed = await manageLeads({ action: 'remove', ids: [second.id, first.id], reason: 'Wrong fit' })
    expect(removed).toHaveLength(2)
    expect(removed.map(item => item.stage)).toEqual(['contacted', 'review'])
    expect(removed[0].project_id).toBe(1)
    expect(removed.every(item => item.removed_at && item.removal_reason === 'Wrong fit')).toBe(true)
    await manageLeads({ action: 'remove', ids: [first.id, second.id], reason: 'Retried' })
    expect(await stored(first.id)).toMatchObject({ workflow_version: 1, removal_reason: 'Wrong fit' })
    expect((await stored(first.id)).activity_history).toHaveLength(1)
    const restored = await manageLeads({ action: 'restore', ids: [first.id, second.id] })
    expect(restored[0]).toMatchObject({ stage: 'contacted', removed_at: null, removal_reason: null, workflow_version: 2 })
    expect(restored[0].activity_history.map(event => event.kind)).toEqual(['removed', 'restored'])
    expect((await client.query('SELECT count(*)::int AS count FROM projects')).rows[0].count).toBe(1)
  })

  it('changes none of a batch when an ID is missing or one draft is active', async () => {
    const first = await lead()
    const second = await lead()
    await expect(manageLeads({ action: 'remove', ids: [first.id, 999] })).rejects.toThrow('No opportunities were changed')
    await client.query('UPDATE leads SET gmail_draft_created_at=now() WHERE id=$1', [second.id])
    await expect(manageLeads({ action: 'remove', ids: [first.id, second.id] })).rejects.toThrow('No opportunities were changed')
    expect(await stored(first.id)).toMatchObject({ removed_at: null, workflow_version: 0, activity_history: [] })
    await client.query("UPDATE leads SET gmail_draft_created_at=now()-interval '6 minutes' WHERE id=$1", [second.id])
    expect(await manageLeads({ action: 'remove', ids: [first.id, second.id] })).toHaveLength(2)
  })

  it('appends activity once, rejects reused IDs with different payloads, and never reapplies retry edits', async () => {
    const row = await lead()
    const input = update(row.id, { stage: 'contacted', expectedVersion: 0, notes: 'Discovery notes',
      activity: { id: 'outreach-1', kind: 'outreach', note: 'Called the officer' } })
    const first = await updateLead(input)
    expect(first).toMatchObject({ stage: 'contacted', workflowVersion: 1 })
    expect(first.activityHistory).toHaveLength(1)
    expect(first.activityHistory[0]).toMatchObject({ kind: 'outreach', note: 'Called the officer', from_stage: 'new', to_stage: 'contacted' })
    expect(Date.parse(first.activityHistory[0].created_at)).not.toBeNaN()
    await updateLead(update(row.id, { stage: 'qualified', expectedVersion: 1, notes: 'Newer notes' }))
    const retry = await updateLead(input)
    expect(retry).toMatchObject({ stage: 'qualified', notes: 'Newer notes', workflowVersion: 2 })
    expect(retry.activityHistory).toHaveLength(2)
    await expect(updateLead({ ...input, activity: { ...input.activity!, note: 'Changed content' } })).rejects.toThrow('changed')
    await expect(updateLead(update(row.id, { stage: 'qualified', expectedVersion: 0, notes: 'Stale' }))).rejects.toThrow('changed')
    expect((await stored(row.id)).notes).toBe('Newer notes')
  })

  it('protects contact edits and stage changes during a draft and refuses edits while removed', async () => {
    const row = await lead()
    await client.query('UPDATE leads SET gmail_draft_created_at=now() WHERE id=$1', [row.id])
    await expect(updateLead(update(row.id, { email: 'other@example.com', expectedVersion: 0 }))).rejects.toThrow('changed')
    await expect(updateLead(update(row.id, { stage: 'lost', expectedVersion: 0 }))).rejects.toThrow('changed')
    await client.query('UPDATE leads SET gmail_draft_created_at=NULL WHERE id=$1', [row.id])
    await updateLead(update(row.id, { email: 'other@example.com', expectedVersion: 0 }))
    await manageLeads({ action: 'remove', ids: [row.id] })
    await expect(updateLead(update(row.id, { expectedVersion: 2, notes: 'Hidden edit' }))).rejects.toThrow('changed')
    expect((await stored(row.id)).notes).toBeNull()
  })

  it('retains the removal tombstone through radar capture and PATCH without losing the original lead', async () => {
    const captured = await captureGovconLead({ title: 'Notice', externalRef: 'SAM:removed', notes: 'Original', govcon: { score: 80 } })
    await manageLeads({ action: 'remove', ids: [captured.leadId] })
    const before = await stored(captured.leadId)
    expect(await captureGovconLead({ title: 'New scan', externalRef: 'SAM:removed', estimatedValueCents: 9999, govcon: { score: 90 } }))
      .toMatchObject({ leadId: captured.leadId, created: false, suppressed: true })
    expect(await updateGovconLead({ externalRef: 'SAM:removed', stage: 'new', notes: 'Overwritten', govconPatch: { score: 99 } }))
      .toMatchObject({ leadId: captured.leadId, stage: 'review', suppressed: true })
    const after = await stored(captured.leadId)
    expect(after).toMatchObject({ stage: 'review', notes: 'Original', estimated_value_cents: null, workflow_version: before.workflow_version, govcon: { score: 80 } })
    expect(after.activity_history).toEqual(before.activity_history)
    expect(after.removed_at).toEqual(before.removed_at)
  })

  it('preserves workflow fields and proposal history after pursuit while refreshing radar analysis', async () => {
    const captured = await captureGovconLead({ title: 'Notice', externalRef: 'SAM:pursued', govcon: { score: 80, crm_proposal_brief: 'Forged brief' } })
    expect((await stored(captured.leadId)).govcon).toEqual({ score: 80 })
    await updateLead(update(captured.leadId, { stage: 'new', expectedVersion: 0, notes: 'Admin notes',
      nextFollowUp: '2026-09-22', estimatedValueCents: 1234, proposalBrief: 'Admin brief' }))
    await captureGovconLead({ title: 'Scan update', externalRef: 'SAM:pursued', estimatedValueCents: 9999,
      nextFollowUp: '2026-09-10', govcon: { score: 90, crm_proposal_brief: 'Forged' } })
    await updateGovconLead({ externalRef: 'SAM:pursued', stage: 'lost', notes: 'Radar notes',
      estimatedValueCents: 999, nextFollowUp: '2026-09-01', govconPatch: { score: 91, crm_proposal_brief: 'Forged again' } })
    const result = await stored(captured.leadId)
    expect(result).toMatchObject({ stage: 'new', notes: 'Admin notes', estimated_value_cents: 1234, workflow_version: 1,
      govcon: { score: 91, crm_proposal_brief: 'Admin brief' } })
    expect(result.next_follow_up.toISOString()).toBe('2026-09-22T00:00:00.000Z')
    expect(result.activity_history).toHaveLength(1)
  })

  it('creates a versioned proposal and refuses conversion after removal or a stale version', async () => {
    const row = await lead('qualified')
    await expect(prepareLeadProposal({ leadId: row.id, projectName: 'Response', expectedVersion: 1 })).rejects.toThrow()
    const proposal = await prepareLeadProposal({ leadId: row.id, projectName: 'Response', expectedVersion: 0 })
    expect(proposal.leadStage).toBe('proposal')
    expect(await stored(row.id)).toMatchObject({ workflow_version: 1, stage: 'proposal' })
    await manageLeads({ action: 'remove', ids: [row.id] })
    await expect(prepareLeadProposal({ leadId: row.id, projectName: 'Response' })).rejects.toThrow()
    expect((await client.query('SELECT count(*)::int AS count FROM projects')).rows[0].count).toBe(1)
  })

  it('never creates a proposal client from a malformed radar contact', async () => {
    const captured = await captureGovconLead({ title: 'Notice', externalRef: 'SAM:bad-email',
      contactEmail: 'one@example.com,two@example.com' })
    await updateLead(update(captured.leadId, { stage: 'new', expectedVersion: 0 }))
    await expect(prepareLeadProposal({ leadId: captured.leadId, projectName: 'Response', expectedVersion: 1 }))
      .rejects.toThrow('one valid contact email')
    expect((await client.query('SELECT count(*)::int AS count FROM clients')).rows[0].count).toBe(0)
    expect((await client.query('SELECT count(*)::int AS count FROM projects')).rows[0].count).toBe(0)
  })

  it('versions project-driven lead closure and rejects a stale workspace reopening without duplicating lifecycle events', async () => {
    const row = await lead('qualified')
    const proposal = await prepareLeadProposal({ leadId: row.id, projectName: 'Response', expectedVersion: 0 })
    await transitionProjectLifecycle({ projectId: proposal.projectId, to: 'canceled' })
    expect(await stored(row.id)).toMatchObject({ stage: 'lost', workflow_version: 2 })
    expect((await stored(row.id)).activity_history).toHaveLength(2)
    await expect(updateLead(update(row.id, { stage: 'new', expectedVersion: 1 }))).rejects.toThrow('changed')
    await transitionProjectLifecycle({ projectId: proposal.projectId, to: 'canceled' })
    expect(await stored(row.id)).toMatchObject({ stage: 'lost', workflow_version: 2 })
    expect((await stored(row.id)).activity_history).toHaveLength(2)
  })

  it('rejects proposal creation if the validated contact changes before the lead lock', async () => {
    const row = await lead('qualified')
    const writer = await competingWriter()
    try {
      mock.sql.mockImplementationOnce(async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const result = await query(strings, ...values)
        await writer.query('UPDATE leads SET email=$1 WHERE id=$2', ['changed@example.com', row.id])
        await writer.query('COMMIT')
        return result
      })
      await expect(prepareLeadProposal({ leadId: row.id, projectName: 'Response' })).rejects.toThrow()
      expect((await client.query('SELECT count(*)::int AS count FROM clients')).rows[0].count).toBe(0)
      expect(await stored(row.id)).toMatchObject({ stage: 'qualified', email: 'changed@example.com' })
    } finally { await writer.query('ROLLBACK'); await writer.end() }
  })

  it('rejects a workflow save that waits behind a concurrent removal without losing the removal', async () => {
    const row = await lead()
    const writer = await competingWriter()
    try {
      await writer.query('UPDATE leads SET removed_at=now(), workflow_version=workflow_version+1 WHERE id=$1', [row.id])
      const attempted = updateLead(update(row.id, { expectedVersion: 0, notes: 'Stale write' })).catch(error => error)
      await waitForRowLock(writer)
      await writer.query('COMMIT')
      expect(await attempted).toMatchObject({ code: '40001' })
      expect(await stored(row.id)).toMatchObject({ notes: null, workflow_version: 1 })
      expect((await stored(row.id)).removed_at).not.toBeNull()
    } finally { await writer.query('ROLLBACK'); await writer.end() }
  })

  it('aborts the whole removal batch when another transaction changes a selected row during locking', async () => {
    const first = await lead()
    const second = await lead()
    const writer = await competingWriter()
    try {
      await writer.query('UPDATE leads SET notes=$1, workflow_version=workflow_version+1 WHERE id=$2', ['Concurrent edit', second.id])
      const attempted = manageLeads({ action: 'remove', ids: [first.id, second.id] }).catch(error => error)
      await waitForRowLock(writer)
      await writer.query('COMMIT')
      expect(await attempted).toMatchObject({ code: '40001' })
      expect(await stored(first.id)).toMatchObject({ removed_at: null, workflow_version: 0 })
      expect(await stored(second.id)).toMatchObject({ removed_at: null, notes: 'Concurrent edit', workflow_version: 1 })
    } finally { await writer.query('ROLLBACK'); await writer.end() }
  })

  it('keeps radar capture suppressed when it waits behind a concurrent removal', async () => {
    const captured = await captureGovconLead({ title: 'Notice', externalRef: 'SAM:concurrent', govcon: { score: 80 } })
    const writer = await competingWriter()
    try {
      await writer.query('UPDATE leads SET removed_at=now(), workflow_version=workflow_version+1 WHERE id=$1', [captured.leadId])
      const attempted = captureGovconLead({ title: 'Rescan', externalRef: 'SAM:concurrent', govcon: { score: 99 } })
      await waitForRowLock(writer)
      await writer.query('COMMIT')
      expect(await attempted).toMatchObject({ leadId: captured.leadId, suppressed: true, created: false })
      expect(await stored(captured.leadId)).toMatchObject({ workflow_version: 1, govcon: { score: 80 } })
    } finally { await writer.query('ROLLBACK'); await writer.end() }
  })
})
