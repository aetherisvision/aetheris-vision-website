/**
 * Integration endpoint for Aetheris Vision's opportunity-radar tool
 * (github.com/aetherisvision/opportunity-radar, a separate internal-only
 * Python app -- never deployed publicly, av-radar serve only binds to
 * 127.0.0.1). This is the ONLY way that tool's data reaches this website's
 * production database: opportunity-radar never holds a Postgres connection
 * string, only this narrow, authenticated HTTP surface.
 *
 * Auth: Authorization: Bearer <RADAR_SECRET> -- a dedicated secret, never
 * shared with CRON_SECRET or ADMIN_PASSPHRASE, so it can be rotated or
 * revoked independently without affecting Vercel Cron or the admin panel.
 * Fails closed if RADAR_SECRET is unset (matches this codebase's existing
 * fail-closed convention in admin-auth.ts).
 *
 * Scope, deliberately narrow: this route can create and update `leads`
 * rows where source='opportunity-radar' ONLY (enforced in the SQL itself,
 * in crm.ts's updateGovconLead -- not just here). It CANNOT reach
 * /api/admin/leads/[id]/convert or otherwise create clients/projects rows
 * -- turning a government-contracting lead into a real client/project stays
 * a human decision made in the admin UI, never an automated side effect of
 * a radar sync.
 */
import { NextRequest, NextResponse } from 'next/server'

import { safeEqual } from '@/lib/admin-auth'
import {
  captureGovconLead,
  updateGovconLead,
  LeadConflictError,
  LEAD_STAGES,
  type GovconLeadInput,
  type GovconLeadUpdateInput,
  type ManualLeadStage,
} from '@/lib/crm'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }
const MANUAL_STAGES = LEAD_STAGES.filter((stage) => stage !== 'won') as readonly ManualLeadStage[]

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: NO_STORE_HEADERS })
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.RADAR_SECRET
  if (!secret) return false
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return safeEqual(authHeader, `Bearer ${secret}`)
}

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await request.json()
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readBody(request)
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 })

  if (typeof body.title !== 'string' || !body.title.trim()) {
    return json({ error: 'title is required' }, { status: 400 })
  }
  if (typeof body.externalRef !== 'string' || !body.externalRef.trim()) {
    return json({ error: 'externalRef is required' }, { status: 400 })
  }

  const input: GovconLeadInput = {
    title: body.title,
    externalRef: body.externalRef,
    agency: typeof body.agency === 'string' ? body.agency : null,
    contactEmail: typeof body.contactEmail === 'string' ? body.contactEmail : null,
    contactPhone: typeof body.contactPhone === 'string' ? body.contactPhone : null,
    estimatedValueCents:
      typeof body.estimatedValueCents === 'number' ? body.estimatedValueCents : null,
    nextFollowUp: typeof body.nextFollowUp === 'string' ? body.nextFollowUp : null,
    notes: typeof body.notes === 'string' ? body.notes : null,
    govcon:
      body.govcon && typeof body.govcon === 'object' && !Array.isArray(body.govcon)
        ? (body.govcon as Record<string, unknown>)
        : null,
  }

  try {
    const result = await captureGovconLead(input)
    return json(result, { status: result.created ? 201 : 200 })
  } catch (error) {
    console.error(
      'Unable to capture opportunity-radar lead',
      error instanceof Error ? error.message : 'Unknown error',
    )
    if (error instanceof LeadConflictError) {
      return json({ error: error.message }, { status: 409 })
    }
    if (error instanceof Error) {
      return json({ error: error.message }, { status: 400 })
    }
    return json({ error: 'The lead could not be captured' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readBody(request)
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 })

  if (typeof body.externalRef !== 'string' || !body.externalRef.trim()) {
    return json({ error: 'externalRef is required' }, { status: 400 })
  }
  if (body.stage !== undefined) {
    if (
      typeof body.stage !== 'string' ||
      !MANUAL_STAGES.includes(body.stage as ManualLeadStage)
    ) {
      return json({ error: `stage must be one of: ${MANUAL_STAGES.join(', ')}` }, { status: 400 })
    }
  }

  const input: GovconLeadUpdateInput = {
    externalRef: body.externalRef,
    stage: typeof body.stage === 'string' ? (body.stage as ManualLeadStage) : undefined,
    notes: typeof body.notes === 'string' ? body.notes : null,
    nextFollowUp: typeof body.nextFollowUp === 'string' ? body.nextFollowUp : null,
    estimatedValueCents:
      typeof body.estimatedValueCents === 'number' ? body.estimatedValueCents : null,
    govconPatch:
      body.govconPatch && typeof body.govconPatch === 'object' && !Array.isArray(body.govconPatch)
        ? (body.govconPatch as Record<string, unknown>)
        : null,
  }

  try {
    const result = await updateGovconLead(input)
    if (!result) return json({ error: 'Lead not found' }, { status: 404 })
    return json(result)
  } catch (error) {
    console.error(
      'Unable to update opportunity-radar lead',
      error instanceof Error ? error.message : 'Unknown error',
    )
    if (error instanceof LeadConflictError) {
      return json({ error: error.message }, { status: 409 })
    }
    if (error instanceof Error) {
      return json({ error: error.message }, { status: 400 })
    }
    return json({ error: 'The lead could not be updated' }, { status: 500 })
  }
}
