/**
 * The CRM's "ask Claude" chat endpoint. Admin-gated; attaches a bounded
 * snapshot of the live pipeline to the caller's chat turns and answers via
 * src/lib/admin-assistant.ts (claude-fable-5). Stateless: conversation
 * history lives in the admin's browser panel, not the database.
 */
import { NextRequest, NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin-auth'
import {
  askCrmAssistant,
  MAX_TURN_CHARS,
  MAX_TURNS,
  type AssistantTurn,
} from '@/lib/admin-assistant'
import { sql } from '@/lib/db'

// Fable can think for tens of seconds on a full pipeline review.
export const maxDuration = 300

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: NO_STORE_HEADERS })
}

// Stages the advisor can act on. Closed stages appear only as counts.
const ACTIONABLE_STAGES = ['review', 'new', 'contacted', 'qualified', 'proposal'] as const
const SNAPSHOT_LEAD_LIMIT = 25

function parseTurns(value: unknown): AssistantTurn[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_TURNS * 2) return null
  const turns: AssistantTurn[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null
    const { role, content } = item as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') return null
    if (typeof content !== 'string' || !content.trim() || content.length > MAX_TURN_CHARS) return null
    turns.push({ role, content })
  }
  if (turns[turns.length - 1].role !== 'user') return null
  return turns
}

interface SnapshotLead {
  id: number
  name: string
  organization: string | null
  stage: string
  estimated_value_cents: number | null
  // The Neon driver hands timestamptz back as a Date; tests and other
  // callers may hand a string.
  next_follow_up: string | Date | null
  notes: string | null
  source: string
  govcon: Record<string, unknown> | null
}

function dateOnly(value: string | Date | null): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function govconField(lead: SnapshotLead, key: string): string | null {
  const value = lead.govcon?.[key]
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number') return String(value)
  return null
}

function snapshotLine(lead: SnapshotLead): string {
  const parts = [
    `#${lead.id} [${lead.stage}] ${lead.name.slice(0, 200)}${lead.organization ? ` (${lead.organization.slice(0, 120)})` : ''}`,
  ]
  const score = govconField(lead, 'score')
  if (score) parts.push(`score ${score}`)
  const deadline = govconField(lead, 'deadline')
  if (deadline) parts.push(`deadline ${deadline}`)
  const amount = govconField(lead, 'amount')
  if (amount) parts.push(`amount ${amount}`)
  if (lead.estimated_value_cents) parts.push(`est $${Math.round(lead.estimated_value_cents / 100)}`)
  const followUp = dateOnly(lead.next_follow_up)
  if (followUp) parts.push(`follow-up ${followUp}`)
  const action = govconField(lead, 'recommended_action')
  if (action) parts.push(`recommended: ${action.slice(0, 300)}`)
  const analysis = govconField(lead, 'analysis')
  if (analysis) parts.push(`analysis: ${analysis.slice(0, 400)}`)
  if (lead.notes) parts.push(`notes: ${lead.notes.slice(0, 300)}`)
  return parts.join(' | ')
}

async function buildPipelineSnapshot(): Promise<string> {
  const countRows = (await sql`
    SELECT stage, count(*)::int AS count FROM leads GROUP BY stage
  `) as { stage: string; count: number }[]

  const leadRows = (await sql`
    SELECT id, name, organization, stage, estimated_value_cents, next_follow_up, notes, source, govcon
    FROM leads
    WHERE stage = ANY(${ACTIONABLE_STAGES as unknown as string[]}::text[])
    ORDER BY
      CASE WHEN stage = 'review' THEN 1 ELSE 0 END,
      CASE WHEN govcon->>'score' ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (govcon->>'score')::numeric ELSE -1 END DESC,
      created_at DESC
    LIMIT ${SNAPSHOT_LEAD_LIMIT}
  `) as SnapshotLead[]

  const counts = countRows.map(row => `${row.stage}: ${row.count}`).join(', ')
  const lines = leadRows.map(snapshotLine).join('\n')
  return `Stage counts: ${counts || 'no leads yet'}\nActionable leads (top ${SNAPSHOT_LEAD_LIMIT}, funnel first, then review by radar score):\n${lines || 'none'}`
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not configured')
    return json({ error: 'The assistant is not configured on this deployment' }, { status: 500 })
  }

  let turns: AssistantTurn[] | null = null
  try {
    const body = (await request.json()) as { messages?: unknown }
    turns = parseTurns(body?.messages)
  } catch {
    // Fall through to the shared 400 below.
  }
  if (!turns) {
    return json({ error: 'messages must be 1-32 chat turns ending with a user message' }, { status: 400 })
  }

  let snapshot: string
  try {
    snapshot = await buildPipelineSnapshot()
  } catch (error) {
    console.error(
      'Unable to build the pipeline snapshot',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({ error: 'The pipeline could not be loaded' }, { status: 500 })
  }

  try {
    const reply = await askCrmAssistant(turns, snapshot)
    return json({ reply })
  } catch (error) {
    console.error(
      'The CRM assistant could not answer',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({ error: 'Claude could not answer -- try again in a moment' }, { status: 502 })
  }
}
