import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminAssistant from '@/components/AdminAssistant'

describe('subscription assistant retry', () => {
  beforeEach(() => {
    sessionStorage.clear()
    HTMLElement.prototype.scrollTo = vi.fn()
  })

  it('retries the original question without requiring reentry or duplicating it', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'The analysis worker is offline.' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reply: 'Review the deadline first.' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<AdminAssistant />)
    fireEvent.click(screen.getByRole('button', { name: 'Ask Claude what to do next' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Message for Claude' }), { target: { value: 'Which lead first?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Retry request' }))
    await screen.findByText('Review the deadline first.')
    const [first, retry] = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body))
    expect(retry).toEqual(first)
    expect(screen.getAllByText('Which lead first?')).toHaveLength(1)
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})
