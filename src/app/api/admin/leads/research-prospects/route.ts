import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { sql } from '@/lib/db'
import type { ResearchProfile } from '@/lib/lead-workflow'

type Prospect = ResearchProfile & {
  organization: string
  contact_name: string
  email: string
  existing_lead_id?: number
}

const noStore = { 'Cache-Control': 'no-store' }
function respond(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore })
}
function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}
function validProspect(value: unknown): value is Prospect {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const row = value as Record<string, unknown>
  const fields: [string, number][] = [
    ['organization', 300], ['contact_name', 200], ['type', 150], ['state', 50],
    ['contact_role', 200], ['email_route', 300], ['why_fit', 2000], ['opener', 2000],
    ['wave', 50], ['next_step', 2000], ['source_url', 1000], ['verified_at', 30],
  ]
  if (fields.some(([key, max]) => !text(row[key], max))) return false
  if (!Number.isSafeInteger(row.rank) || Number(row.rank) < 1 || Number(row.rank) > 1000) return false
  if (!Number.isSafeInteger(row.score) || Number(row.score) < 0 || Number(row.score) > 100) return false
  if (!['A', 'B', 'C'].includes(String(row.tier))) return false
  if (typeof row.email !== 'string' || row.email.length > 300 ||
    (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))) return false
  if (row.existing_lead_id !== undefined &&
    (!Number.isSafeInteger(row.existing_lead_id) || Number(row.existing_lead_id) < 1)) return false
  try { if (new URL(String(row.source_url)).protocol !== 'https:') return false } catch { return false }
  return /^\d{4}-\d{2}-\d{2}$/.test(String(row.verified_at))
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return respond({ error: 'Unauthorized' }, 401)
  let body: unknown
  try { body = await request.json() } catch { return respond({ error: 'Invalid JSON' }, 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return respond({ error: 'Invalid import' }, 400)
  const input = body as Record<string, unknown>
  if (!text(input.campaign, 80) || !/^[a-z0-9][a-z0-9-]*$/.test(input.campaign) ||
    !Array.isArray(input.prospects) || input.prospects.length < 1 || input.prospects.length > 100 ||
    !input.prospects.every(validProspect)) return respond({ error: 'Invalid research prospect list' }, 400)
  const prospects = input.prospects as Prospect[]
  if (new Set(prospects.map(item => item.rank)).size !== prospects.length) {
    return respond({ error: 'Ranks must be unique within the list' }, 400)
  }

  try {
    for (const item of prospects.filter(item => item.existing_lead_id)) {
      const existing = await sql`
        SELECT id FROM leads WHERE id = ${item.existing_lead_id!}
          AND lower(btrim(email)) = lower(btrim(${item.email}))
          AND removed_at IS NULL
      `
      if (!item.email || !existing.length) {
        return respond({ error: `Existing CRM record for rank ${item.rank} does not match its contact email` }, 409)
      }
    }

    const results = await sql.transaction(tx => prospects.map(item => {
      const profile: ResearchProfile = {
        rank: item.rank, tier: item.tier, score: item.score, type: item.type,
        state: item.state, contact_role: item.contact_role, email_route: item.email_route,
        why_fit: item.why_fit, opener: item.opener, wave: item.wave,
        next_step: item.next_step, source_url: item.source_url, verified_at: item.verified_at,
      }
      const profileJson = JSON.stringify(profile)
      if (item.existing_lead_id) return tx`
        UPDATE leads SET govcon = COALESCE(govcon, '{}'::jsonb)
          || jsonb_build_object('research_profile', ${profileJson}::jsonb), updated_at = now()
        WHERE id = ${item.existing_lead_id}
        RETURNING id, false AS created
      `
      const externalId = `${input.campaign}-${String(item.rank).padStart(3, '0')}`
      return tx`
        INSERT INTO leads (name, email, organization, service, message, source,
          external_id, stage, notes, govcon)
        VALUES (${item.contact_name}, ${item.email}, ${item.organization},
          'Atmospheric data harmonization', ${item.why_fit}, 'research-prospect',
          ${externalId}, 'review', ${item.next_step},
          jsonb_build_object('research_profile', ${profileJson}::jsonb))
        ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL
        DO UPDATE SET govcon = COALESCE(leads.govcon, '{}'::jsonb)
          || jsonb_build_object('research_profile', ${profileJson}::jsonb),
          updated_at = now()
        RETURNING id, (xmax = 0) AS created
      `
    }))
    const rows = results.flat()
    return respond({ count: rows.length, created: rows.filter(row => row.created).length })
  } catch (error) {
    console.error('Could not import research prospects', error instanceof Error ? error.message : 'Unknown error')
    return respond({ error: 'Research prospects could not be imported' }, 500)
  }
}
