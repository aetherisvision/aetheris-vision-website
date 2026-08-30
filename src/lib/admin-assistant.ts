/**
 * The CRM's "ask Claude" advisor (Marston 2026-08-30: "a window in the CRM
 * to talk to Claude about what to do next").
 *
 * Admin-only, conversational, stateless on the server: the client sends the
 * visible chat turns, the route attaches a bounded snapshot of the live
 * pipeline, and claude-fable-5 answers with concrete next moves. Cost is
 * bounded by hard caps on turn count, turn length, and snapshot size (all
 * enforced here), roughly a nickel per exchange at expected volume, and the
 * only caller is the passphrase-gated admin UI.
 */
import Anthropic from '@anthropic-ai/sdk'

export const ASSISTANT_MODEL = 'claude-fable-5'

export interface AssistantTurn {
  role: 'user' | 'assistant'
  content: string
}

export class AssistantError extends Error {}

export const MAX_TURNS = 16
export const MAX_TURN_CHARS = 4000

const SYSTEM_PROMPT = `You are the business development advisor inside the Aetheris Vision LLC CRM, talking directly with the owner, Marston S. Ward, Ph.D. Aetheris Vision is his one-person scientific and technical consultancy in Oklahoma: atmospheric science, AI/ML weather and environmental systems, and scientific data engineering. It is an SBA-certified SDVOSB, VOSB, and HUBZone small business with active SAM.gov registration. He is a PhD atmospheric scientist, a Certified Consulting Meteorologist, and a USAF veteran.

Each message includes a PIPELINE SNAPSHOT of his current leads (stages, radar scores, analyses, deadlines, follow-ups). Ground every answer in it. Your job is to tell him what to do next: which leads deserve attention first and why, what the concrete next action is (a call, an email, a proposal step, a no-bid), and which deadlines or overdue follow-ups are at risk. When the right move is to drop something, say so plainly.

Style, binding: plain traditional English in connected sentences. Never use an em-dash. Be direct and specific; name leads by their titles and use only facts from the snapshot or the conversation. If the snapshot does not contain what he asks about, say so instead of guessing. Keep answers short: a few sentences for a simple question, at most a handful of short paragraphs for a full pipeline review. No headers, no bullet spam, no enthusiasm filler.`

function turnsWithinBounds(turns: AssistantTurn[]): AssistantTurn[] {
  return turns.slice(-MAX_TURNS).map(turn => ({
    role: turn.role,
    content: turn.content.slice(0, MAX_TURN_CHARS),
  }))
}

export async function askCrmAssistant(
  turns: AssistantTurn[],
  pipelineSnapshot: string,
): Promise<string> {
  const bounded = turnsWithinBounds(turns)
  const last = bounded[bounded.length - 1]
  if (!last || last.role !== 'user') {
    throw new AssistantError('The conversation must end with a user message')
  }
  // The snapshot rides on the latest user turn (not the system prompt) so
  // the stable system prompt stays byte-identical across requests.
  const messages: Anthropic.MessageParam[] = bounded.slice(0, -1).map(turn => ({
    role: turn.role,
    content: turn.content,
  }))
  messages.push({
    role: 'user',
    content: `PIPELINE SNAPSHOT (${new Date().toISOString().slice(0, 10)})\n${pipelineSnapshot}\n\n${last.content}`,
  })

  const client = new Anthropic({ timeout: 90_000, maxRetries: 0 })
  const response = await client.messages.create({
    model: ASSISTANT_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages,
  })
  if (response.stop_reason === 'refusal') {
    throw new AssistantError('The model declined to answer')
  }
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()
  // Thinking counts against max_tokens on Fable: a hard question can spend
  // the whole budget reasoning and leave little or no text. Return what
  // there is with a note rather than 502ing on a billed reply.
  if (response.stop_reason === 'max_tokens') {
    if (!text) throw new AssistantError('The reply ran out of room before any text -- ask a narrower question')
    return `${text}\n\n[Cut off -- ask a follow-up to continue.]`
  }
  if (!text) throw new AssistantError('The model returned an empty reply')
  return text
}
