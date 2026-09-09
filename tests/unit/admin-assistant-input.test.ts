import { describe, expect, it } from 'vitest'
import { buildAssistantInput, type AssistantTurn } from '@/lib/admin-assistant'
import { isClaudeSubscriptionInput } from '@/lib/claude-subscription-limits'

describe('CRM conversation input bounds', () => {
  it('keeps the latest question while bounding long and heavily escaped conversations for the worker', () => {
    const turns: AssistantTurn[] = Array.from({ length: 16 }, (_, index) => ({
      role: index % 2 ? 'user' : 'assistant', content: '\u0001'.repeat(4000),
    }))
    turns[15] = { role: 'user', content: 'Keep this latest question.' }
    const input = buildAssistantInput(turns, '\u0001'.repeat(30_000))
    expect(isClaudeSubscriptionInput(input)).toBe(true)
    expect(input.prompt).toContain('Keep this latest question.')
  })
})
