/**
 * GET /api/admin/documents/[id]/pdf
 *
 * Returns a print-optimized HTML page for a document.
 * Open in a browser tab → Cmd+P → Save as PDF to produce a branded PDF.
 * Uses marked to convert Markdown content to HTML server-side.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { marked } from 'marked'

const ADMIN_COOKIE = 'av-admin-session'

function isAdmin(request: NextRequest) {
  return request.cookies.get(ADMIN_COOKIE)?.value === 'authenticated'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const rows = await sql`
    SELECT d.id, d.title, d.content, d.created_at,
           c.name AS client_name
    FROM documents d
    JOIN clients c ON c.id = d.client_id
    WHERE d.id = ${Number(id)}
  `

  if (rows.length === 0) {
    return new NextResponse('Document not found', { status: 404 })
  }

  const doc = rows[0]
  const bodyHtml = await marked(doc.content ?? '', { gfm: true })
  const dateStr = new Date(doc.created_at as string).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escHtml(doc.title as string)} — Aetheris Vision</title>
  <style>
    /* ── Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Georgia", "Times New Roman", serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #1a202c;
      background: #fff;
    }

    /* ── Page shell (screen preview) ── */
    .page {
      max-width: 760px;
      margin: 0 auto;
      padding: 48px 56px 64px;
    }

    /* ── Header ── */
    .doc-header {
      background: #0A1628;
      margin: -48px -56px 40px;
      padding: 22px 40px;
      display: flex;
      align-items: center;
    }
    .doc-header img { height: 50px; display: block; }

    /* ── Meta strip ── */
    .doc-meta {
      border-bottom: 2px solid #0A1628;
      padding-bottom: 14px;
      margin-bottom: 28px;
    }
    .doc-meta .title {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 20pt;
      font-weight: 700;
      color: #0A1628;
      margin-bottom: 4px;
    }
    .doc-meta .sub {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #64748b;
    }

    /* ── Body prose ── */
    .prose h1, .prose h2 { font-family: Arial, Helvetica, sans-serif; color: #0A1628; }
    .prose h1 { font-size: 16pt; margin: 28px 0 10px; }
    .prose h2 { font-size: 13pt; margin: 22px 0 8px; }
    .prose h3 { font-size: 11pt; font-family: Arial, Helvetica, sans-serif; font-weight: 700; margin: 18px 0 6px; }
    .prose p  { margin: 0 0 10px; }
    .prose ul, .prose ol { padding-left: 22px; margin: 0 0 10px; }
    .prose li { margin-bottom: 4px; }
    .prose strong { color: #0A1628; }
    .prose em { color: #486890; }
    .prose hr { border: none; border-top: 1px solid #cbd5e1; margin: 24px 0; }
    .prose table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
    .prose th { background: #0A1628; color: #F3F7F9; padding: 8px 12px; text-align: left; font-family: Arial, Helvetica, sans-serif; }
    .prose td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; }
    .prose tr:nth-child(even) td { background: #f8fafc; }
    .prose blockquote { border-left: 3px solid #5BA8D9; padding-left: 16px; color: #486890; margin: 14px 0; }
    .prose code { font-family: "Courier New", monospace; font-size: 9.5pt; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
    .prose pre  { background: #f1f5f9; border-radius: 6px; padding: 14px 16px; overflow-x: auto; margin: 14px 0; }
    .prose pre code { background: none; padding: 0; }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 48px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }

    /* ── Print button (screen only) ── */
    .print-btn {
      position: fixed;
      top: 16px;
      right: 20px;
      background: #29426C;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    .print-btn:hover { background: #1e3a5f; }

    /* ── Print styles ── */
    @media print {
      .print-btn { display: none; }
      .page { max-width: 100%; padding: 0; }
      .doc-header { margin: 0 0 28px; }
      body { font-size: 10.5pt; }
      @page { margin: 1.8cm 2cm; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>

  <div class="page">
    <!-- Header -->
    <div class="doc-header">
      <img
        src="https://aetherisvision.com/logo/av-logo-horizontal-dark.png"
        alt="Aetheris Vision"
        onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
      />
      <span style="display:none;color:#F3F7F9;font-family:Arial,sans-serif;font-size:18px;font-weight:700;">Aetheris Vision LLC</span>
    </div>

    <!-- Document meta -->
    <div class="doc-meta">
      <div class="title">${escHtml(doc.title as string)}</div>
      <div class="sub">
        Client: ${escHtml(doc.client_name as string)} &nbsp;·&nbsp; Prepared ${escHtml(dateStr)}
      </div>
    </div>

    <!-- Body -->
    <div class="prose">
      ${bodyHtml}
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <span>Aetheris Vision LLC · marston@aetherisvision.com</span>
      <span>aetherisvision.com</span>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/** Escape HTML special characters to prevent XSS in string interpolation */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
