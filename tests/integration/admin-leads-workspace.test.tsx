import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminLeadsPage from '@/app/admin/leads/page'
import type { Lead } from '@/lib/lead-workflow'

const fixture = (patch: Partial<Lead> = {}): Lead => ({
  id: 1, name: 'Coastal observations study', email: 'contact@example.org', organization: 'Example agency',
  phone: null, service: null, message: 'Scope and requirements', source: 'opportunity-radar', stage: 'review',
  estimated_value_cents: null, next_follow_up: '2026-12-01', notes: 'Original working notes', client_id: null,
  project_id: null, intake_id: null, gmail_draft_id: null, gmail_draft_created_at: null,
  govcon: { score: 80, deadline: '2026-12-01' }, created_at: '2026-09-01T10:00:00Z',
  removed_at: null, removal_reason: null, workflow_version: 0, activity_history: [], ...patch,
})
let records: Lead[]
let requests: { path: string; body: Record<string, unknown> }[]
let rejectPatch = false
let losePatchReply = false
let rejectConversion = false
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  records = [fixture()]; requests = []; rejectPatch = false; losePatchReply = false; rejectConversion = false
  window.location.hash = ''
  vi.stubGlobal('fetch', vi.fn(async (path: string, init?: RequestInit) => {
    if (!init?.method) return json({ leads: structuredClone(records) })
    const body = JSON.parse(String(init.body || '{}'))
    requests.push({ path, body })
    if (path === '/api/admin/leads/manage') {
      records = records.map(lead => body.ids.includes(lead.id) ? { ...lead, removed_at: body.action === 'remove' ? new Date().toISOString() : null, removal_reason: body.reason ?? null, workflow_version: lead.workflow_version + 1 } : lead)
      return json({ leads: records.filter(lead => body.ids.includes(lead.id)) })
    }
    if (init.method === 'PATCH') {
      if (rejectPatch) return json({ error: 'Saved opportunity changed', code: 'LEAD_CONFLICT' }, 409)
      if (losePatchReply) { losePatchReply = false; throw new TypeError('Network connection lost') }
      const lead = records.find(lead => lead.id === body.id)!
      const activity = body.activity ? [{ ...body.activity, created_at: new Date().toISOString(), from_stage: lead.stage, to_stage: body.stage }] : []
      const updated = { ...lead, ...body, govcon: { ...lead.govcon, ...(body.proposal_brief !== undefined ? { crm_proposal_brief: body.proposal_brief } : {}) }, activity_history: [...lead.activity_history, ...activity], workflow_version: lead.workflow_version + 1 }
      records = records.map(item => item.id === lead.id ? updated : item)
      return json({ lead: updated })
    }
    if (path.endsWith('/draft-email')) return json({ messageId: 'draft-fixture', draftedAt: '2026-09-09T00:00:00Z' })
    if (path.endsWith('/convert') && rejectConversion) return json({ error: 'Opportunity changed during conversion', code: 'LEAD_CONFLICT' }, 409)
    if (path.endsWith('/convert')) return json({ clientId: 11, projectId: 22, lead: { ...records[0], client_id: 11, project_id: 22, stage: 'proposal', workflow_version: records[0].workflow_version + 1 } })
    throw new Error(`Unexpected request ${path}`)
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
async function open() { render(<AdminLeadsPage />); await screen.findByRole('heading', { name: 'Coastal observations study' }) }
const queue = (name: RegExp) => within(screen.getByRole('navigation', { name: 'Opportunity workflow' })).getByRole('button', { name })

describe('opportunity workspace user journeys', () => {
  it('keeps pursuit selected, clears inherited deadline, and distinguishes a draft from sent outreach', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'Pursue' }))
    await screen.findByRole('heading', { name: 'Start the conversation' })
    expect(queue(/^Active/)).toHaveAttribute('aria-pressed', 'true')
    expect(requests[0].body).toMatchObject({ stage: 'new', next_follow_up: null, expected_version: 0, notes: 'Original working notes', activity: { kind: 'stage_change' } })
    expect(screen.getByLabelText('Next follow-up')).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: 'Draft email' }))
    await screen.findByRole('link', { name: 'Gmail draft ready ↗' })
    expect(requests.filter(item => item.path === '/api/admin/leads')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Record outreach sent' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Outreach notes'), { target: { value: 'Sent introduction to program office' } })
    fireEvent.change(screen.getByLabelText('Next follow-up'), { target: { value: '2026-12-04' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record outreach sent' }))
    await screen.findByRole('heading', { name: 'Keep the conversation moving' })
    expect(requests.at(-1)?.body).toMatchObject({ stage: 'contacted', expected_version: 1, next_follow_up: '2026-12-04', activity: { kind: 'outreach', note: 'Outreach email sent: Sent introduction to program office' } })
    expect(screen.getByRole('region', { name: 'Activity history' })).toHaveTextContent('Outreach email sent')
  })

  it('confirms the exact bulk removal set and restores previous stages', async () => {
    records.push(fixture({ id: 2, name: 'Second review lead' }))
    await open()
    fireEvent.click(screen.getByLabelText('Select all'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove 2' }))
    expect(requests).toHaveLength(0)
    const confirm = screen.getByRole('region', { name: 'Confirm removal' })
    expect(confirm).toHaveTextContent('Coastal observations study')
    expect(confirm).toHaveTextContent('Second review lead')
    fireEvent.change(within(confirm).getByLabelText('Reason (optional)'), { target: { value: 'Outside scope' } })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Remove 2' }))
    await screen.findByRole('button', { name: 'Undo removal' })
    expect(requests[0].body).toEqual({ action: 'remove', ids: [1, 2], reason: 'Outside scope' })
    expect(screen.queryByRole('heading', { name: 'Coastal observations study' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Undo removal' }))
    await screen.findByRole('heading', { name: 'Coastal observations study' })
    expect(records.every(lead => lead.stage === 'review' && !lead.removed_at)).toBe(true)
  })

  it.each(['new', 'contacted', 'proposal', 'won'] as const)('removed %s leads offer restore with no outreach or editing actions', async stage => {
    records = [fixture({ stage, removed_at: '2026-09-08T10:00:00Z', removal_reason: 'No fit' })]
    window.location.hash = '#lead-1'
    await open()
    expect(screen.getByRole('button', { name: 'Restore opportunity' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Draft email' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save notes & value' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Create proposal project' })).toBeNull()
  })

  it('retains activity and follow-up when moving into proposals, then converts with the newly saved version', async () => {
    records = [fixture({ stage: 'contacted', workflow_version: 4, next_follow_up: '2026-12-04' })]
    window.location.hash = '#lead-1'
    await open()
    fireEvent.change(screen.getByLabelText('Follow-up notes'), { target: { value: 'Scope agreed on call' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ready for proposal' }))
    await screen.findByRole('heading', { name: 'Develop the approach and scope' })
    expect(screen.getByLabelText('Next follow-up')).toHaveValue('2026-12-04')
    expect(screen.getByRole('region', { name: 'Activity history' })).toHaveTextContent('Scope agreed on call')
    fireEvent.change(screen.getByLabelText('Proposal brief'), { target: { value: 'Outcome: coastal mapping\nDeliverable: analysis report' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create proposal project' }))
    await screen.findByRole('link', { name: 'Open proposal project #22 ↗' })
    expect(requests.at(-1)).toMatchObject({ path: '/api/admin/leads/1/convert', body: { expected_version: 6 } })
  })

  it('keeps local input after a conflict until the user explicitly reloads the saved version', async () => {
    records = [fixture({ stage: 'new' })]; window.location.hash = '#lead-1'
    await open(); rejectPatch = true
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-0199' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save contact' }))
    const reload = await screen.findByRole('button', { name: 'Discard local edits & reload saved version' })
    expect(screen.getByLabelText('Phone')).toHaveValue('555-0199')
    fireEvent.click(reload)
    await waitFor(() => expect(screen.getByLabelText('Phone')).toHaveValue(''))
  })

  it('retains the selected matching opportunity while refining search', async () => {
    records.push(fixture({ id: 2, name: 'Second review lead' }))
    await open()
    fireEvent.click(within(screen.getByRole('complementary', { name: 'Opportunity list' })).getByRole('button', { name: /Second review lead/ }))
    expect(screen.getByRole('heading', { name: 'Second review lead' })).toBeVisible()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Example agency' } })
    expect(screen.getByRole('heading', { name: 'Second review lead' })).toBeVisible()
  })

  it('keeps the opportunity visible when saving a contact changes its search match', async () => {
    records = [fixture({ stage: 'new' })]; window.location.hash = '#lead-1'
    await open()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'contact@example.org' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'corrected@example.org' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save contact' }))
    await screen.findByText('Contact details saved.')
    expect(screen.getByLabelText('Email')).toHaveValue('corrected@example.org')
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('heading', { name: 'Coastal observations study' })).toBeVisible()
  })

  it('offers explicit conflict recovery when proposal conversion races another saved update', async () => {
    records = [fixture({ stage: 'qualified', govcon: { crm_proposal_brief: 'A working brief' } })]; window.location.hash = '#lead-1'
    await open(); rejectConversion = true
    fireEvent.click(screen.getByRole('button', { name: 'Create proposal project' }))
    await screen.findByRole('button', { name: 'Discard local edits & reload saved version' })
    expect(screen.getByRole('alert')).toHaveTextContent('Opportunity changed during conversion')
  })

  it('reuses an activity ID after uncertain transport failure but does not duplicate click requests', async () => {
    await open(); losePatchReply = true
    fireEvent.click(screen.getByRole('button', { name: 'Pursue' }))
    await screen.findByRole('alert')
    const originalId = (requests[0].body.activity as { id: string }).id
    fireEvent.click(screen.getByRole('button', { name: 'Pursue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pursue' }))
    await screen.findByRole('heading', { name: 'Start the conversation' })
    expect(requests).toHaveLength(2)
    expect((requests[1].body.activity as { id: string }).id).toBe(originalId)
  })
})
