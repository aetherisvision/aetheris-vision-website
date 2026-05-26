import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const projects = await sql`
    SELECT p.id, p.name, p.status, p.current_phase, p.start_date,
           p.phase_proposal_date, p.phase_kickoff_date, p.phase_design_date,
           p.phase_development_date, p.phase_review_date, p.phase_launched_date,
           c.name AS client_name, p.client_id
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    ORDER BY p.created_at DESC
  `
  return NextResponse.json({ projects })
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return unauthorizedResponse()

  const { id, current_phase, phase_proposal_date, phase_kickoff_date, phase_design_date,
          phase_development_date, phase_review_date, phase_launched_date } = await request.json()

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await sql`
    UPDATE projects SET
      current_phase          = ${current_phase ?? null},
      phase_proposal_date    = ${phase_proposal_date ?? null},
      phase_kickoff_date     = ${phase_kickoff_date ?? null},
      phase_design_date      = ${phase_design_date ?? null},
      phase_development_date = ${phase_development_date ?? null},
      phase_review_date      = ${phase_review_date ?? null},
      phase_launched_date    = ${phase_launched_date ?? null}
    WHERE id = ${Number(id)}
  `
  return NextResponse.json({ ok: true })
}
