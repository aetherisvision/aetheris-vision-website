import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'

import AdminLeadsPage from '@/app/admin/leads/page'

function lead(id = 1, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Prospect ${id}`,
    email: `prospect${id}@example.com`,
    organization: null,
    phone: null,
    service: null,
    message: 'A prospective project',
    source: 'contact',
    stage: 'new',
    estimated_value_cents: null,
    next_follow_up: null,
    notes: null,
    client_id: null,
    project_id: null,
    intake_id: null,
    relationship_status: null,
    project_status: null,
    gmail_draft_id: null,
    gmail_draft_created_at: null,
    govcon: null,
    created_at: '2026-09-01T12:00:00.000Z',
    removed_at: null,
    removal_reason: null,
    workflow_version: 0,
    activity_history: [],
    ...overrides,
  }
}

function apiResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function pendingResponse() {
  let resolve!: (response: ReturnType<typeof apiResponse>) => void
  const promise = new Promise<ReturnType<typeof apiResponse>>(done => { resolve = done })
  return { promise, resolve }
}

async function renderLeads(leads = [lead()]) {
  window.location.hash = `#lead-${leads[0].id}`
  const fetchMock = vi.fn().mockResolvedValueOnce(apiResponse({ leads }))
  vi.stubGlobal('fetch', fetchMock)
  render(<AdminLeadsPage />)
  await screen.findByRole('heading', { name: leads[0].name })
  return fetchMock
}

function workspace() {
  return within(screen.getByRole('article', { name: 'Selected opportunity' }))
}

function opportunity(id: number) {
  return within(screen.getByRole('complementary', { name: 'Opportunity list' }))
    .getByRole('button', { name: new RegExp(`Prospect ${id}(?!\\d)`) })
}

function workflowQueue(name: RegExp) {
  return within(screen.getByRole('navigation', { name: 'Opportunity workflow' })).getByRole('button', { name })
}

describe('admin lead email drafting', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.location.hash = ''
  })

  it('refreshes the queues after an authorized sent-mail sync', async () => {
    const original = lead(1, {stage:'review',source:'opportunity-radar'})
    const fetchMock = await renderLeads([original])
    fetchMock.mockResolvedValueOnce(apiResponse({ok:true,moved:1}))
      .mockResolvedValueOnce(apiResponse({leads:[lead(1,{stage:'contacted',source:'opportunity-radar'})]}))
    fireEvent.click(screen.getByRole('button',{name:'Sync sent mail'}))
    expect(await screen.findByText('1 opportunity moved to Follow-ups from sent mail.')).toBeVisible()
    expect(workflowQueue(/^Review/)).toHaveTextContent('0')
    expect(workflowQueue(/^Follow-ups/)).toHaveTextContent('1')
    expect(fetchMock).toHaveBeenNthCalledWith(2,'/api/cron/lead-correspondence?days=90', {cache:'no-store'})
  })

  it('locks selection, queues, and other actions while drafting, then reenables them and preserves each opportunity’s result', async () => {
    const fetchMock = await renderLeads([lead(1), lead(2)])
    const first = pendingResponse()
    const second = pendingResponse()
    fetchMock.mockReturnValueOnce(first.promise)

    expect(screen.getAllByRole('article', { name: 'Selected opportunity' })).toHaveLength(1)
    expect(workflowQueue(/^Active/)).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(workspace().getByLabelText('Phone'), { target: { value: '555-0199' } })
    fireEvent.change(workspace().getByLabelText('Next follow-up'), { target: { value: '2026-12-04' } })
    fireEvent.click(workspace().getByText('Notes, value & related records'))
    expect(workspace().getByRole('button', { name: 'Save contact' })).toBeEnabled()
    expect(workspace().getByRole('button', { name: 'Record outreach sent' })).toBeEnabled()
    fireEvent.click(workspace().getByRole('button', { name: 'Draft email' }))

    expect(workspace().getByRole('button', { name: 'Drafting…' })).toBeDisabled()
    for (const name of ['Save contact', 'Save notes & value', 'Save follow-up date', 'Record outreach sent', 'Close as lost', 'Remove from workspace']) {
      expect(workspace().getByRole('button', { name })).toBeDisabled()
    }
    for (const label of ['Email', 'Phone', 'Next follow-up', 'Working notes', 'Estimated value (USD)']) {
      expect(workspace().getByLabelText(label)).toBeDisabled()
    }
    expect(workspace().getByRole('status')).toHaveTextContent('Preparing your draft with Claude. This may take a couple of minutes…')
    expect(opportunity(2)).toBeDisabled()
    expect(screen.getByLabelText('Select Prospect 2')).toBeDisabled()
    expect(screen.getByLabelText('Select all')).toBeDisabled()
    expect(screen.getByRole('searchbox')).toBeDisabled()
    expect(workflowQueue(/^Review/)).toBeDisabled()
    expect(screen.getByRole('button', { name: /^All opportunities/ })).toBeDisabled()

    fireEvent.click(opportunity(2))
    fireEvent.click(workflowQueue(/^Review/))
    fireEvent.click(workspace().getByRole('button', { name: 'Save contact' }))
    fireEvent.click(workspace().getByRole('button', { name: 'Remove from workspace' }))
    expect(workspace().getByRole('heading', { name: 'Prospect 1' })).toBeVisible()
    expect(workflowQueue(/^Active/)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('region', { name: 'Confirm removal' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await act(async () => { first.resolve(apiResponse({ messageId: 'message-1' })) })

    expect(workspace().getByRole('link', { name: 'Gmail draft ready ↗' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=message-1',
    )
    expect(workspace().getByRole('status')).toHaveTextContent('Your Gmail draft is ready.')
    expect(workspace().getByRole('button', { name: 'Save contact' })).toBeEnabled()
    expect(workspace().getByRole('button', { name: 'Save notes & value' })).toBeEnabled()
    expect(workspace().getByRole('button', { name: 'Record outreach sent' })).toBeEnabled()
    expect(opportunity(2)).toBeEnabled()
    expect(screen.getByLabelText('Select Prospect 2')).toBeEnabled()
    expect(screen.getByRole('searchbox')).toBeEnabled()
    expect(workflowQueue(/^Review/)).toBeEnabled()

    fireEvent.click(opportunity(2))
    expect(workspace().getByRole('heading', { name: 'Prospect 2' })).toBeVisible()
    expect(workspace().queryByRole('status')).not.toBeInTheDocument()
    expect(workspace().queryByRole('link', { name: 'Gmail draft ready ↗' })).not.toBeInTheDocument()
    fetchMock.mockReturnValueOnce(second.promise)
    fireEvent.click(workspace().getByRole('button', { name: 'Draft email' }))
    expect(opportunity(1)).toBeDisabled()

    await act(async () => { second.resolve(apiResponse({ messageId: 'message-2' })) })
    expect(workspace().getByRole('link', { name: 'Gmail draft ready ↗' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=message-2',
    )
    fireEvent.click(opportunity(1))
    expect(workspace().getByRole('link', { name: 'Gmail draft ready ↗' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=message-1',
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/admin/leads/1/draft-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate: false }),
    })
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/admin/leads/2/draft-email', expect.objectContaining({
      body: JSON.stringify({ regenerate: false }),
    }))
  })

  it('shows the Gmail reconnection error and fixed local recovery link only for the affected opportunity', async () => {
    const fetchMock = await renderLeads([lead(1), lead(2)])
    fetchMock.mockResolvedValueOnce(apiResponse({
      code: 'GMAIL_RECONNECT_REQUIRED',
      error: 'The Gmail connection has expired. Reconnect Gmail to create drafts.',
      reconnectUrl: 'https://untrusted.example/redirect',
    }, 409))

    fireEvent.click(opportunity(2))
    fireEvent.click(workspace().getByRole('button', { name: 'Draft email' }))

    const alert = await workspace().findByRole('alert')
    expect(alert).toHaveTextContent('The Gmail connection has expired.')
    expect(within(alert).getByRole('link', { name: 'Reconnect Gmail' })).toHaveAttribute('href', '/admin/gmail')
    expect(workspace().getByRole('button', { name: 'Draft email' })).toBeEnabled()
    fireEvent.click(opportunity(1))
    expect(workspace().queryByRole('alert')).not.toBeInTheDocument()
    expect(workspace().getByRole('button', { name: 'Draft email' })).toBeEnabled()
    fireEvent.click(opportunity(2))
    expect(workspace().getByRole('alert')).toHaveTextContent('The Gmail connection has expired.')
  })

  it('allows a pending claim to be retried and leaves concurrency enforcement to the API', async () => {
    const fetchMock = await renderLeads([lead(1, { gmail_draft_created_at: '2026-09-01T12:00:00.000Z' })])
    fetchMock.mockResolvedValueOnce(apiResponse({ error: 'A draft is already being created for this lead -- try again in a moment' }, 409))

    expect(workspace().getByText('An earlier request may have created a Gmail draft. Check Gmail before retrying to avoid a duplicate.')).toBeVisible()
    fireEvent.click(workspace().getByRole('button', { name: 'Retry draft' }))
    expect(await workspace().findByRole('alert')).toHaveTextContent('A draft is already being created')
    expect(workspace().getByRole('button', { name: 'Retry draft' })).toBeEnabled()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/leads/1/draft-email', expect.objectContaining({
      body: JSON.stringify({ regenerate: false }),
    }))

    fetchMock.mockResolvedValueOnce(apiResponse({ messageId: 'recovered-message' }))
    fireEvent.click(workspace().getByRole('button', { name: 'Retry draft' }))

    expect(await workspace().findByRole('link', { name: 'Gmail draft ready ↗' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=recovered-message',
    )
    expect(workspace().queryByRole('alert')).not.toBeInTheDocument()
    expect(workspace().queryByRole('button', { name: 'Retry draft' })).not.toBeInTheDocument()
  })

  it('preserves a created Gmail draft link when the API reports that recording it failed', async () => {
    const fetchMock = await renderLeads()
    fetchMock.mockResolvedValueOnce(apiResponse({
      messageId: 'created-but-unrecorded',
      draftedAt: '2026-09-07T12:00:00.000Z',
      error: 'The draft exists in Gmail, but could not be recorded on this lead.',
    }, 500))

    fireEvent.click(workspace().getByRole('button', { name: 'Draft email' }))

    expect(await workspace().findByRole('alert')).toHaveTextContent('The draft exists in Gmail')
    expect(workspace().getByRole('link', { name: 'Gmail draft ready ↗' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=created-but-unrecorded',
    )
    expect(workspace().getByRole('button', { name: 'Recreate draft' })).toBeEnabled()
    expect(workspace().queryByRole('button', { name: 'Draft email' })).not.toBeInTheDocument()
  })

  it('explains non-JSON platform timeouts and restores the draft action', async () => {
    const fetchMock = await renderLeads()
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 504,
      json: async () => { throw new SyntaxError('Unexpected token < in JSON') },
    })

    fireEvent.click(workspace().getByRole('button', { name: 'Draft email' }))

    expect(await workspace().findByRole('alert')).toHaveTextContent('The request timed out. Check Gmail for a draft before retrying.')
    expect(workspace().getByRole('button', { name: 'Draft email' })).toBeEnabled()
    expect(screen.queryByText(/Unexpected token/)).not.toBeInTheDocument()
  })

  it('requires confirmation to recreate a draft and preserves its link while replacing it', async () => {
    const fetchMock = await renderLeads([lead(1, {
      gmail_draft_id: 'original-message',
      gmail_draft_created_at: '2026-09-01T12:00:00.000Z',
    })])
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)

    fireEvent.click(workspace().getByRole('button', { name: 'Recreate draft' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const pending = pendingResponse()
    fetchMock.mockReturnValueOnce(pending.promise)
    fireEvent.click(workspace().getByRole('button', { name: 'Recreate draft' }))

    expect(confirm).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/leads/1/draft-email', expect.objectContaining({
      body: JSON.stringify({ regenerate: true }),
    }))
    expect(workspace().getByRole('link', { name: 'Gmail draft ready ↗' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=original-message',
    )

    await act(async () => { pending.resolve(apiResponse({ messageId: 'replacement-message' })) })
    expect(workspace().getByRole('link', { name: 'Gmail draft ready ↗' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=replacement-message',
    )
  })

  it('does not report success when a successful response is missing its draft ID', async () => {
    const fetchMock = await renderLeads()
    fetchMock.mockResolvedValueOnce(apiResponse({}))

    fireEvent.click(workspace().getByRole('button', { name: 'Draft email' }))

    expect(await workspace().findByRole('alert')).toHaveTextContent('The draft service did not return a Gmail draft.')
    expect(workspace().queryByRole('link', { name: 'Gmail draft ready ↗' })).not.toBeInTheDocument()
  })
})
