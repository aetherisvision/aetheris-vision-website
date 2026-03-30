import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendForSigning } from '@/lib/docuseal';

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get('av-admin-session')?.value === 'authenticated';
}

// Convert markdown SOW to a clean, styled HTML document
function markdownToHtml(markdown: string, title: string): string {
  // Basic markdown → HTML conversion for SOW content
  let html = markdown
    // Headers
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Bullet lists — collect consecutive lines starting with -
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[^]*?<\/li>\n?)+/gm, (match) => `<ul>${match}</ul>`)
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Paragraphs — double newlines
    .replace(/\n\n/g, '</p><p>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 48px 56px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .header h1 { font-size: 22pt; color: #1e3a5f; font-weight: 700; margin-bottom: 4px; }
    .header .meta { font-size: 10pt; color: #555; }
    h1 { font-size: 18pt; color: #1e3a5f; margin: 28px 0 8px; }
    h2 { font-size: 13pt; color: #1e3a5f; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #dde4ed; }
    h3 { font-size: 11pt; color: #2c3e50; margin: 16px 0 6px; }
    p { margin: 8px 0; }
    ul { margin: 8px 0 8px 24px; }
    li { margin: 4px 0; }
    strong { color: #1a1a1a; }
    hr { border: none; border-top: 1px solid #dde4ed; margin: 20px 0; }
    .footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 2px solid #1e3a5f;
      font-size: 9pt;
      color: #777;
    }
    .signature-block {
      margin-top: 48px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .signature-field { border-top: 1px solid #333; padding-top: 6px; font-size: 9pt; color: #555; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Statement of Work</h1>
    <div class="meta">
      Aetheris Vision LLC &nbsp;·&nbsp; 210 N Mustang Mall Terrace PMB 29, Mustang, OK 73064<br>
      marston@aetherisvision.com &nbsp;·&nbsp; aetherisvision.com
    </div>
  </div>

  <div class="content">
    <p>${html}</p>
  </div>

  <div class="footer">
    This Statement of Work is confidential and intended solely for the named parties.
    Aetheris Vision LLC · EIN 33-4818538 · Oklahoma LLC
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const { contact_name, contact_email, company_name, client_id, project_id, project_name } = rows[0];

    // Convert SOW markdown → HTML → base64
    const title = `SOW — ${company_name}`;
    const htmlDoc = markdownToHtml(sow_content, title);
    const htmlBase64 = Buffer.from(htmlDoc).toString('base64');

    // Send to Docuseal
    const submission = await sendForSigning({
      pdfBase64: htmlBase64,
      fileName: `${title}.html`,
      signerName: contact_name,
      signerEmail: contact_email,
    });

    const submissionId = String(submission.id ?? submission.submission_id ?? submission.data?.id ?? '');
    if (!submissionId) {
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
