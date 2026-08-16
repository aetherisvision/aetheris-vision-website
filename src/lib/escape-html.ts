/**
 * Escape user- or database-supplied text before interpolating it into HTML
 * (notification emails, generated PDFs). Single shared implementation — the
 * routes building HTML from untrusted text must all use this one.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
