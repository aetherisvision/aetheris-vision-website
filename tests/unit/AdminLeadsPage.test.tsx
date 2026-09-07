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
    stage: 'review',
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
  const fetchMock = vi.fn().mockResolvedValueOnce(apiResponse({ leads }))
  vi.stubGlobal('fetch', fetchMock)
  render(<AdminLeadsPage />)
  await screen.findByRole('heading', { name: leads[0].name })
  return fetchMock
}

function card(id = 1) {
  return within(screen.getByRole('heading', { name: `Prospect ${id}` }).closest('article')!)
}

describe('admin lead email drafting', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('tracks simultaneous drafts independently and disables other actions only on the drafting card', async () => {
    const fetchMock = await renderLeads([lead(1), lead(2)])
    const first = pendingResponse()
    const second = pendingResponse()
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    fireEvent.click(card(1).getByRole('button', { name: 'Draft email' }))

    expect(card(1).getByRole('button', { name: 'Drafting…' })).toBeDisabled()
    expect(card(1).getByRole('button', { name: 'Save lead' })).toBeDisabled()
    expect(card(1).getByRole('button', { name: 'Pursue' })).toBeDisabled()
    expect(card(1).getByRole('button', { name: 'Not pursuing' })).toBeDisabled()
    expect(card(1).getByRole('combobox')).toBeDisabled()
    expect(card(1).getByRole('spinbutton')).toBeDisabled()
    expect(card(1).getByRole('textbox')).toBeDisabled()
    expect(card(1).getByRole('status')).toHaveTextContent('Creating Gmail draft…')
    expect(card(2).getByRole('button', { name: 'Draft email' })).toBeEnabled()

    fireEvent.click(card(2).getByRole('button', { name: 'Draft email' }))
    await act(async () => { first.resolve(apiResponse({ messageId: 'message-1' })) })

    expect(card(1).getByRole('link', { name: 'Gmail draft ready' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=message-1',
    )
    expect(card(1).getByRole('status')).toHaveTextContent('Your Gmail draft is ready.')
    expect(card(1).getByRole('button', { name: 'Save lead' })).toBeEnabled()
    expect(card(2).getByRole('button', { name: 'Drafting…' })).toBeDisabled()
    expect(card(2).getByRole('button', { name: 'Save lead' })).toBeDisabled()

    await act(async () => { second.resolve(apiResponse({ messageId: 'message-2' })) })
    expect(card(2).getByRole('link', { name: 'Gmail draft ready' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/admin/leads/1/draft-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate: false }),
    })
  })

  it('shows the Gmail reconnection error and a fixed local recovery link in the affected card', async () => {
    const fetchMock = await renderLeads([lead(1), lead(2)])
    fetchMock.mockResolvedValueOnce(apiResponse({
      code: 'GMAIL_RECONNECT_REQUIRED',
      error: 'The Gmail connection has expired. Reconnect Gmail to create drafts.',
      reconnectUrl: 'https://untrusted.example/redirect',
    }, 409))

    fireEvent.click(card(2).getByRole('button', { name: 'Draft email' }))

    const alert = await card(2).findByRole('alert')
    expect(alert).toHaveTextContent('The Gmail connection has expired.')
    expect(within(alert).getByRole('link', { name: 'Reconnect Gmail' })).toHaveAttribute('href', '/admin/gmail')
    expect(card(1).queryByRole('alert')).not.toBeInTheDocument()
    expect(card(2).getByRole('button', { name: 'Draft email' })).toBeEnabled()
  })

  it('allows a pending claim to be retried and leaves concurrency enforcement to the API', async () => {
    const fetchMock = await renderLeads([lead(1, { gmail_draft_created_at: '2026-09-01T12:00:00.000Z' })])
    fetchMock.mockResolvedValueOnce(apiResponse({ error: 'A draft is already being created for this lead -- try again in a moment' }, 409))

    expect(card().getByText('An earlier request may have created a Gmail draft. Check Gmail before retrying to avoid a duplicate.')).toBeVisible()
    fireEvent.click(card().getByRole('button', { name: 'Retry draft' }))
    expect(await card().findByRole('alert')).toHaveTextContent('A draft is already being created')
    expect(card().getByRole('button', { name: 'Retry draft' })).toBeEnabled()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/leads/1/draft-email', expect.objectContaining({
      body: JSON.stringify({ regenerate: false }),
    }))

    fetchMock.mockResolvedValueOnce(apiResponse({ messageId: 'recovered-message' }))
    fireEvent.click(card().getByRole('button', { name: 'Retry draft' }))

    expect(await card().findByRole('link', { name: 'Gmail draft ready' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=recovered-message',
    )
    expect(card().queryByRole('alert')).not.toBeInTheDocument()
    expect(card().queryByRole('button', { name: 'Retry draft' })).not.toBeInTheDocument()
  })

  it('preserves a created Gmail draft link when the API reports that recording it failed', async () => {
    const fetchMock = await renderLeads()
    fetchMock.mockResolvedValueOnce(apiResponse({
      messageId: 'created-but-unrecorded',
      draftedAt: '2026-09-07T12:00:00.000Z',
      error: 'The draft exists in Gmail, but could not be recorded on this lead.',
    }, 500))

    fireEvent.click(card().getByRole('button', { name: 'Draft email' }))

    expect(await card().findByRole('alert')).toHaveTextContent('The draft exists in Gmail')
    expect(card().getByRole('link', { name: 'Gmail draft ready' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=created-but-unrecorded',
    )
    expect(card().getByRole('button', { name: 'Recreate draft' })).toBeEnabled()
    expect(card().queryByRole('button', { name: 'Draft email' })).not.toBeInTheDocument()
  })

  it('explains non-JSON platform timeouts and restores the draft action', async () => {
    const fetchMock = await renderLeads()
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 504,
      json: async () => { throw new SyntaxError('Unexpected token < in JSON') },
    })

    fireEvent.click(card().getByRole('button', { name: 'Draft email' }))

    expect(await card().findByRole('alert')).toHaveTextContent('The draft request timed out. Check Gmail for a draft before retrying.')
    expect(card().getByRole('button', { name: 'Draft email' })).toBeEnabled()
    expect(screen.queryByText(/Unexpected token/)).not.toBeInTheDocument()
  })

  it('requires confirmation to recreate a draft and preserves its link while replacing it', async () => {
    const fetchMock = await renderLeads([lead(1, {
      gmail_draft_id: 'original-message',
      gmail_draft_created_at: '2026-09-01T12:00:00.000Z',
    })])
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)

    fireEvent.click(card().getByRole('button', { name: 'Recreate draft' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const pending = pendingResponse()
    fetchMock.mockReturnValueOnce(pending.promise)
    fireEvent.click(card().getByRole('button', { name: 'Recreate draft' }))

    expect(confirm).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/leads/1/draft-email', expect.objectContaining({
      body: JSON.stringify({ regenerate: true }),
    }))
    expect(card().getByRole('link', { name: 'Gmail draft ready' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=original-message',
    )

    await act(async () => { pending.resolve(apiResponse({ messageId: 'replacement-message' })) })
    expect(card().getByRole('link', { name: 'Gmail draft ready' })).toHaveAttribute(
      'href', 'https://mail.google.com/mail/#drafts?compose=replacement-message',
    )
  })

  it('does not report success when a successful response is missing its draft ID', async () => {
    const fetchMock = await renderLeads()
    fetchMock.mockResolvedValueOnce(apiResponse({}))

    fireEvent.click(card().getByRole('button', { name: 'Draft email' }))

    expect(await card().findByRole('alert')).toHaveTextContent('The draft service did not return a Gmail draft.')
    expect(card().queryByRole('link', { name: 'Gmail draft ready' })).not.toBeInTheDocument()
  })
})
