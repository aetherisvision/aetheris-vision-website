import { mintAdminSessionToken } from '../helpers/admin-session'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sqlMock, askCrmAssistantMock } = vi.hoisted(() => ({
  sqlMock: vi.fn(),
  askCrmAssistantMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ sql: sqlMock }))
vi.mock('@/lib/admin-assistant', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin-assistant')>('@/lib/admin-assistant')
  return { ...actual, askCrmAssistant: askCrmAssistantMock }
})

const TEST_PASSPHRASE = 'assistant-contract-test'

function request(body: unknown, authenticated = true): NextRequest {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (authenticated) headers.set('Cookie', `av-admin-session=${mintAdminSessionToken(TEST_PASSPHRASE)}`)
  return new NextRequest('http://localhost/api/admin/assistant', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

async function callRoute(body: unknown, authenticated = true) {
  const { POST } = await import('@/app/api/admin/assistant/route')
  return POST(request(body, authenticated))
}

describe('POST /api/admin/assistant', () => {
  beforeEach(() => {
    sqlMock.mockReset()
    askCrmAssistantMock.mockReset()
    vi.stubEnv('ADMIN_PASSPHRASE', TEST_PASSPHRASE)
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key')
  })

  it('rejects an unauthenticated request before touching anything', async () => {
    const response = await callRoute({ messages: [{ role: 'user', content: 'hi' }] }, false)
    expect(response.status).toBe(401)
    expect(sqlMock).not.toHaveBeenCalled()
    expect(askCrmAssistantMock).not.toHaveBeenCalled()
  })

  it('returns 500 when the assistant is not configured', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    const response = await callRoute({ messages: [{ role: 'user', content: 'hi' }] })
    expect(response.status).toBe(500)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it.each([
    ['no messages', {}],
    ['empty messages', { messages: [] }],
    ['assistant-last conversation', { messages: [{ role: 'assistant', content: 'hello' }] }],
    ['non-string content', { messages: [{ role: 'user', content: 7 }] }],
  ])('rejects %s with a 400', async (_label, body) => {
    const response = await callRoute(body)
    expect(response.status).toBe(400)
    expect(askCrmAssistantMock).not.toHaveBeenCalled()
  })

  it('answers with a live pipeline snapshot attached', async () => {
    sqlMock
      .mockResolvedValueOnce([{ stage: 'review', count: 3 }, { stage: 'new', count: 1 }])
      .mockResolvedValueOnce([
        {
          id: 3,
          name: 'FERC Flood Hydrologist Services',
          organization: 'FERC',
          stage: 'review',
          estimated_value_cents: null,
          next_follow_up: null,
          notes: null,
          source: 'opportunity-radar',
          govcon: { score: 78, deadline: '2026-09-10', recommended_action: 'Line up a flood hydrologist sub' },
        },
      ])
    askCrmAssistantMock.mockResolvedValue('Pursue the FERC lead first.')

    const response = await callRoute({ messages: [{ role: 'user', content: 'What should I do today?' }] })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ reply: 'Pursue the FERC lead first.' })

    const [turns, snapshot] = askCrmAssistantMock.mock.calls[0] as [unknown, string]
    expect(turns).toEqual([{ role: 'user', content: 'What should I do today?' }])
    expect(snapshot).toContain('review: 3')
    expect(snapshot).toContain('FERC Flood Hydrologist Services')
    expect(snapshot).toContain('deadline 2026-09-10')
  })

  it('maps an assistant failure to a clear 502', async () => {
    sqlMock.mockResolvedValueOnce([]).mockResolvedValueOnce([])
    askCrmAssistantMock.mockRejectedValue(new Error('overloaded'))

    const response = await callRoute({ messages: [{ role: 'user', content: 'hi' }] })
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'Claude could not answer -- try again in a moment',
    })
  })
})
