/**
 * ESMAI Letter Template
 * ---------------------
 * Official correspondence template for ESMAI — the AI Meteorology Agent,
 * a project of Aetheris Vision LLC.
 *
 * Usage:
 *   import { buildEsmaiLetter } from '@/lib/esmai-letter-template'
 *   const html = buildEsmaiLetter({ date, recipientName, recipientTitle, ... })
 *
 * The returned HTML string is:
 *   - Print-ready (A4 / Letter-safe margins)
 *   - DocuSeal-compatible (embed <signature-field> / <date-field> tags in body)
 *   - Self-contained (no external dependencies)
 */

export interface EsmaiLetterOptions {
  /** ISO date string or formatted date string, e.g. "April 16, 2026" */
  date?: string
  /** Reference / document number shown in header, e.g. "SLA-2026-001" */
  referenceNumber?: string
  /** Recipient full name */
  recipientName: string
  /** Recipient title / role, e.g. "Owner" */
  recipientTitle?: string
  /** Recipient organization name */
  recipientOrg?: string
  /** Full address block — supply as an array of lines */
  recipientAddress?: string[]
  /** Subject line shown beneath the salutation block */
  subject: string
  /**
   * HTML body content — paragraphs, tables, lists, etc.
   * Do NOT include <html>/<body> wrappers.
   * Signature block is appended automatically unless appendSignature = false.
   */
  body: string
  /**
   * Whether to append the Marston Ward / Aetheris Vision signature block.
   * Default: true. Set false when embedding DocuSeal field tags manually in body.
   */
  appendSignature?: boolean
  /**
   * Include DocuSeal e-signature fields in the signature block.
   * Default: false (rendered as static text for preview/print).
   */
  includeSignatureFields?: boolean
  /** Override the default "From" name in the signature */
  signerName?: string
  /** Override the default "From" title in the signature */
  signerTitle?: string
  /** Override the default footer note */
  footerNote?: string
}

const BRAND = {
  primaryDark:  '#0f172a',   // deep navy — ESMAI primary
  accent:       '#0ea5e9',   // sky blue — atmospheric
  accentDark:   '#0284c7',
  slate:        '#475569',
  slateLight:   '#94a3b8',
  bodyText:     '#1e293b',
  bg:           '#ffffff',
  borderLight:  '#e2e8f0',
  sectionBg:    '#f8fafc',
  legalName:    'Aetheris Vision LLC',
  projectName:  'ESMAI',
  projectFull:  'Environmental & Spatial Meteorology AI',
  principalName:'Marston Ward',
  principalTitle:'Principal — Applied Meteorology & AI',
  email:        'contact@aetherisvision.com',
  website:      'aetherisvision.com',
  location:     'Mustang, OK',
  phone:        '',           // add if/when a business line is set up
} as const

function formatDate(raw?: string): string {
  if (!raw) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }
  // Already formatted (contains letters) — return as-is
  if (/[a-zA-Z]/.test(raw)) return raw
  // Parse ISO
  const d = new Date(raw)
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function buildSignatureBlock(opts: EsmaiLetterOptions): string {
  const name  = opts.signerName  ?? BRAND.principalName
  const title = opts.signerTitle ?? BRAND.principalTitle

  if (opts.includeSignatureFields) {
    // DocuSeal e-signature variant
    return `
      <div style="margin-top:48px;padding-top:20px;border-top:2px solid ${BRAND.accent};">
        <div style="max-width:340px;">
          <p style="font-weight:700;color:${BRAND.primaryDark};margin:0 0 4px;">${BRAND.legalName}</p>
          <p style="font-size:11px;color:${BRAND.slate};margin:0 0 16px;letter-spacing:.02em;">
            ${BRAND.projectName} — ${BRAND.projectFull}
          </p>
          <signature-field name="signature" role="Signer" required="true"
            style="display:block;margin:8px 0;min-height:48px;border-bottom:1px solid ${BRAND.borderLight};"></signature-field>
          <date-field name="date" role="Signer"
            style="display:block;margin:8px 0;"></date-field>
          <p style="font-size:10px;color:${BRAND.slateLight};margin:8px 0 0;">${name}, ${title}</p>
        </div>
      </div>`
  }

  return `
    <div style="margin-top:48px;padding-top:20px;border-top:2px solid ${BRAND.accent};">
      <p style="margin:0 0 32px;color:${BRAND.bodyText};">Sincerely,</p>
      <div style="border-bottom:1px solid ${BRAND.borderLight};width:240px;margin-bottom:6px;"></div>
      <p style="font-weight:700;color:${BRAND.primaryDark};margin:0 0 2px;">${name}</p>
      <p style="font-size:11px;color:${BRAND.slate};margin:0 0 2px;">${title}</p>
      <p style="font-size:11px;color:${BRAND.slate};margin:0;">${BRAND.legalName}</p>
    </div>`
}

/** Build a complete, self-contained HTML letter document. */
export function buildEsmaiLetter(opts: EsmaiLetterOptions): string {
  const date          = formatDate(opts.date)
  const appendSig     = opts.appendSignature !== false
  const refNum        = opts.referenceNumber ?? ''
  const footerNote    = opts.footerNote
    ?? `${BRAND.legalName} · ${BRAND.location} · ${BRAND.email} · ${BRAND.website}`

  const recipientBlock = [
    opts.recipientName,
    opts.recipientTitle,
    opts.recipientOrg,
    ...(opts.recipientAddress ?? []),
  ]
    .filter(Boolean)
    .map(line => `<p style="margin:0;line-height:1.6;color:${BRAND.bodyText};">${line}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.subject} — ${BRAND.projectName} / ${BRAND.legalName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f1f5f9;
      color: ${BRAND.bodyText};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      background: ${BRAND.bg};
      max-width: 820px;
      margin: 40px auto;
      padding: 64px 72px;
      box-shadow: 0 4px 32px rgba(0,0,0,.10);
      border-radius: 4px;
      position: relative;
    }
    /* Left accent stripe */
    .page::before {
      content: '';
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 5px;
      background: linear-gradient(180deg, ${BRAND.accent} 0%, ${BRAND.accentDark} 100%);
      border-radius: 4px 0 0 4px;
    }
    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 28px;
      border-bottom: 1px solid ${BRAND.borderLight};
      margin-bottom: 32px;
    }
    .brand-block {}
    .brand-name {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -.5px;
      color: ${BRAND.primaryDark};
      line-height: 1;
    }
    .brand-name span { color: ${BRAND.accent}; }
    .brand-sub {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: ${BRAND.slateLight};
      margin-top: 5px;
    }
    .header-meta {
      text-align: right;
      font-size: 11px;
      color: ${BRAND.slateLight};
      line-height: 1.8;
    }
    .header-meta .date {
      font-size: 13px;
      font-weight: 600;
      color: ${BRAND.slate};
    }
    /* ── Recipient block ── */
    .recipient-block {
      margin-bottom: 28px;
    }
    /* ── Subject line ── */
    .subject-line {
      background: ${BRAND.sectionBg};
      border-left: 3px solid ${BRAND.accent};
      padding: 10px 16px;
      margin-bottom: 28px;
      border-radius: 0 4px 4px 0;
    }
    .subject-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: ${BRAND.slateLight};
      display: block;
      margin-bottom: 3px;
    }
    .subject-text {
      font-size: 14px;
      font-weight: 700;
      color: ${BRAND.primaryDark};
    }
    /* ── Body ── */
    .body-content {
      line-height: 1.85;
      color: ${BRAND.bodyText};
    }
    .body-content p { margin-bottom: 16px; }
    .body-content h2 {
      font-size: 14px;
      font-weight: 700;
      color: ${BRAND.primaryDark};
      text-transform: uppercase;
      letter-spacing: .06em;
      margin: 28px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid ${BRAND.borderLight};
    }
    .body-content h3 {
      font-size: 13px;
      font-weight: 700;
      color: ${BRAND.primaryDark};
      margin: 20px 0 8px;
    }
    .body-content ul, .body-content ol {
      padding-left: 20px;
      margin-bottom: 16px;
    }
    .body-content li { margin-bottom: 6px; }
    .body-content table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    .body-content th {
      background: ${BRAND.primaryDark};
      color: #fff;
      font-weight: 600;
      font-size: 11px;
      letter-spacing: .05em;
      text-transform: uppercase;
      padding: 10px 14px;
      text-align: left;
    }
    .body-content td {
      padding: 10px 14px;
      border-bottom: 1px solid ${BRAND.borderLight};
      color: ${BRAND.bodyText};
    }
    .body-content tr:nth-child(even) td { background: ${BRAND.sectionBg}; }
    .body-content .highlight-box {
      background: ${BRAND.sectionBg};
      border: 1px solid ${BRAND.borderLight};
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 16px;
    }
    .body-content strong { color: ${BRAND.primaryDark}; }
    /* ── Footer ── */
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid ${BRAND.borderLight};
      font-size: 10px;
      color: ${BRAND.slateLight};
      text-align: center;
      line-height: 1.6;
    }
    /* ── Print ── */
    @media print {
      body { background: white; }
      .page {
        margin: 0; padding: 48px 56px;
        box-shadow: none; border-radius: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="brand-block">
        <div class="brand-name">ES<span>MAI</span></div>
        <div class="brand-sub">${BRAND.projectFull}</div>
        <div class="brand-sub" style="margin-top:4px;color:${BRAND.slateLight};">
          A project of ${BRAND.legalName}
        </div>
      </div>
      <div class="header-meta">
        <div class="date">${date}</div>
        ${refNum ? `<div>${refNum}</div>` : ''}
        <div>${BRAND.location}</div>
        <div>${BRAND.email}</div>
        <div>${BRAND.website}</div>
      </div>
    </div>

    <!-- Recipient -->
    <div class="recipient-block">
      ${recipientBlock}
    </div>

    <!-- Subject -->
    <div class="subject-line">
      <span class="subject-label">Re</span>
      <span class="subject-text">${opts.subject}</span>
    </div>

    <!-- Body -->
    <div class="body-content">
      ${opts.body}
      ${appendSig ? buildSignatureBlock(opts) : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      ${footerNote}
    </div>

  </div>
</body>
</html>`
}

/**
 * Convenience: build a plain salutation paragraph.
 * Usage: `buildSalutation('Mr. Koshy')` → "<p>Dear Mr. Koshy,</p>"
 */
export function buildSalutation(name: string): string {
  return `<p>Dear ${name},</p>`
}

/**
 * Convenience: build a standard closing paragraph above the signature.
 * Usage: `buildClosing()` → "<p>Please do not hesitate to reach out ... "</p>"
 */
export function buildClosing(contactEmail = BRAND.email): string {
  return `<p>Please do not hesitate to reach out with any questions or to discuss the details of this proposal. I look forward to continuing to support your business.</p>
<p>You can reach me directly at <strong>${contactEmail}</strong> or by replying to this letter.</p>`
}
