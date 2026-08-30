/** Gmail's web UI deep-links an existing draft by its message id via a
 * `compose` query param, not by the Drafts-API resource id (see
 * createGmailDraft's own doc comment in gmail-client.ts for why).
 *
 * No `/u/<n>/` account index -- that forces a specific signed-in Google
 * account by position, which opens the wrong mailbox for an admin signed
 * into more than one. The bare `/mail/#drafts?compose=...` path resolves
 * against whichever account Gmail is already showing.
 *
 * Framework/runtime-agnostic on purpose (no server-only imports) so both
 * the API route and the client-rendered admin page can share one copy of
 * this URL format instead of duplicating the template string. */
export function gmailDraftUrl(messageId: string): string {
  return `https://mail.google.com/mail/#drafts?compose=${encodeURIComponent(messageId)}`
}
