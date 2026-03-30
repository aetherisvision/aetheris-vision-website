import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get('av-admin-session')?.value === 'authenticated';
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const submissions = await sql`
      SELECT
        i.id,
        i.status,
        i.company_name,
        i.industry,
        i.location,
        i.revenue,
        i.contact_name,
        i.contact_title,
        i.contact_email,
        i.contact_phone,
        i.budget_range,
        i.timeline,
        i.objectives,
        i.special_requirements,
        i.questions_for_us,
        i.client_id,
        i.project_id,
        i.pro_bono,
        i.submitted_at
      FROM intake_submissions i
      ORDER BY i.submitted_at DESC
    `;
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Failed to fetch intake submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if ('pro_bono' in body) {
      await sql`UPDATE intake_submissions SET pro_bono = ${!!body.pro_bono} WHERE id = ${id}`;
      return NextResponse.json({ success: true });
    }

    const { status } = body;
    const validStatuses = ['new', 'in_review', 'sow_sent', 'won', 'lost'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await sql`UPDATE intake_submissions SET status = ${status} WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update intake status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
