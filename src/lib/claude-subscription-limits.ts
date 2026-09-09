/** Shared by the hosted producer and local consumer; contains no credentials or database code. */
export const CLAUDE_SUBSCRIPTION_MODEL = 'claude-fable-5' as const
export const MAX_CLAUDE_SYSTEM_CHARS = 12_000
export const MAX_CLAUDE_PROMPT_CHARS = 85_000
export const MAX_CLAUDE_INPUT_CHARS = 100_000

export interface ClaudeSubscriptionInput {
  model: typeof CLAUDE_SUBSCRIPTION_MODEL
  system: string
  prompt: string
}

export function isClaudeSubscriptionInput(value: unknown): value is ClaudeSubscriptionInput {
  if (!value || typeof value !== 'object') return false
  const input = value as Record<string, unknown>
  return input.model === CLAUDE_SUBSCRIPTION_MODEL
    && typeof input.system === 'string' && input.system.length > 0 && input.system.length <= MAX_CLAUDE_SYSTEM_CHARS
    && typeof input.prompt === 'string' && input.prompt.length > 0 && input.prompt.length <= MAX_CLAUDE_PROMPT_CHARS
    && JSON.stringify(input).length <= MAX_CLAUDE_INPUT_CHARS
}
