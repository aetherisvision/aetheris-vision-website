import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const clientId = token?.clientId as string | undefined

  if (!clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = await sql`
    SELECT id, name, status, start_date, signed_at, docuseal_submission_id,
           current_phase, phase_proposal_date, phase_kickoff_date, phase_design_date,
           phase_development_date, phase_review_date, phase_launched_date, preview_url
    FROM projects
    WHERE client_id = ${Number(clientId)}
    ORDER BY created_at DESC
  `

  return NextResponse.json({ projects })
}
