import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSubmission, downloadSignedPdf } from '@/lib/docuseal';

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get('av-admin-session')?.value === 'authenticated';
}

// Check Docuseal for any sow_sent submissions that were signed, and auto-complete them
async function syncSignedSubmissions() {
  const pending = await sql`
    SELECT i.id AS intake_id, p.id AS project_id, p.docuseal_submission_id
    FROM intake_submissions i
    JOIN projects p ON p.id = i.project_id
    WHERE i.status = 'sow_sent'
      AND p.docuseal_submission_id IS NOT NULL
  `;

  for (const row of pending) {
    try {
      const sub = await getSubmission(row.docuseal_submission_id);
      if (sub.status !== 'completed') continue;

      const pdfBuffer = await downloadSignedPdf(row.docuseal_submission_id);
      const pdfBase64 = pdfBuffer.toString('base64');

      await sql`
        UPDATE projects
        SET signed_pdf_base64 = ${pdfBase64}, status = 'signed', signed_at = NOW()
        WHERE id = ${row.project_id}
      `;
      await sql`UPDATE intake_submissions SET status = 'won' WHERE id = ${row.intake_id}`;
      console.log(`✅ Auto-synced signed SOW for project ${row.project_id}`);
    } catch (e) {
      console.error(`Failed to sync submission ${row.docuseal_submission_id}:`, e);
    }
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Sync any signed-but-not-yet-updated submissions before returning data
    await syncSignedSubmissions();

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
        i.platform_preference,
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
