import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth'
import { sql } from '@/lib/db';
import { sendForSigning, buildSignatureBlock } from '@/lib/docuseal';


// Convert markdown SOW to a full HTML document with embedded DocuSeal field tags
function markdownToHtml(markdown: string, title: string, signerName: string, isSelfSign: boolean): string {
  const body = markdown
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[^]*?<\/li>\n?)+/gm, (match) => `<ul>${match}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; padding: 48px 56px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #29426C; padding-bottom: 20px; margin-bottom: 32px; }
    .header h1 { font-size: 22pt; color: #29426C; font-weight: 700; margin-bottom: 4px; }
    .header .meta { font-size: 10pt; color: #555; }
    h1 { font-size: 18pt; color: #29426C; margin: 28px 0 8px; }
    h2 { font-size: 13pt; color: #29426C; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #dde4ed; }
    h3 { font-size: 11pt; color: #2c3e50; margin: 16px 0 6px; }
    p { margin: 8px 0; }
    ul { margin: 8px 0 8px 24px; }
    li { margin: 4px 0; }
    strong { color: #1a1a1a; }
    hr { border: none; border-top: 1px solid #dde4ed; margin: 20px 0; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #dde4ed; font-size: 9pt; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Statement of Work</h1>
    <div class="meta">
      Aetheris Vision LLC &nbsp;·&nbsp; 210 N Mustang Mall Terrace PMB 29, Mustang, OK 73064<br>
      contact@aetherisvision.com &nbsp;·&nbsp; aetherisvision.com
    </div>
  </div>
  <div class="content"><p>${body}</p></div>
  ${buildSignatureBlock(isSelfSign, signerName)}
  <div class="footer">
    This Statement of Work is confidential and intended solely for the named parties.
    Aetheris Vision LLC · EIN 33-4818538 · Oklahoma LLC
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return unauthorizedResponse();
  }

  try {
    const { intake_id, sow_content } = await request.json();
    if (!intake_id || !sow_content) {
      return NextResponse.json({ error: 'intake_id and sow_content required' }, { status: 400 });
    }

    // Fetch intake + client + project
    const rows = await sql`
      SELECT
        i.id as intake_id, i.company_name, i.contact_name, i.contact_email,
        i.client_id, i.project_id,
        c.name as client_name,
        p.name as project_name
      FROM intake_submissions i
      JOIN clients c ON c.id = i.client_id
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = ${intake_id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Intake not found or missing client/project' }, { status: 404 });
    }

    const { contact_name, contact_email, company_name, project_id } = rows[0];

    const isSelfSign = contact_email.toLowerCase() === 'marston@aetherisvision.com';
    const title = `SOW — ${company_name}`;
    // Convert SOW markdown → HTML with embedded DocuSeal field tags
    const htmlDoc = markdownToHtml(sow_content, title, contact_name, isSelfSign);

    // Send to DocuSeal via /submissions/html (one-shot — no pre-existing template needed)
    const submission = await sendForSigning({
      html: htmlDoc,
      fileName: title,
      signerName: contact_name,
      signerEmail: contact_email,
    });

    // /submissions/html returns an array of submitter objects; submission_id is on each entry
    const firstSubmitter = Array.isArray(submission) ? submission[0] : submission;
    const submissionId = String(
      firstSubmitter?.submission_id ?? firstSubmitter?.id ?? submission?.id ?? ''
    );
    if (!submissionId) {
      console.error('Docuseal raw response:', JSON.stringify(submission));
      throw new Error('Docuseal did not return a submission ID');
    }

    // Save submission ID to project + update intake status
    await Promise.all([
      sql`UPDATE projects SET docuseal_submission_id = ${submissionId} WHERE id = ${project_id}`,
      sql`UPDATE intake_submissions SET status = 'sow_sent' WHERE id = ${intake_id}`,
    ]);

    return NextResponse.json({
      success: true,
      submission_id: submissionId,
      message: `SOW sent to ${contact_email} for signature`,
    });

  } catch (error) {
    console.error('Send for signature failed:', error);
    return NextResponse.json({
      error: 'Failed to send for signature',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
