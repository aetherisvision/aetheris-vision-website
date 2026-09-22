/** A sent Gmail message can advance a lead only when the recipient and the
 * opportunity both match. Agency mailboxes are often shared by many leads. */
export interface CorrespondenceLead {
  id: number
  stage: string
  removed_at?: string | Date | null
  last_sent_message_id?: string | null
  name: string
  email: string
  source: string
  created_at: string | Date
  gmail_draft_id: string | null
  gmail_draft_created_at: string | Date | null
  gmail_draft_subject: string | null
  gmail_thread_id: string | null
  source_id: string | null
}

export interface SentMessage {
  id: string
  threadId: string
  sentAt: number
  to: string
  subject: string
}

function emailAddresses(header: string): Set<string> {
  return new Set((header.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [])
    .map(address => address.toLowerCase()))
}

function normalizedSubject(subject: string): string {
  return subject.replace(/^(?:(?:re|fwd?|aw):\s*)+/gi, '').trim().replace(/\s+/g, ' ').toLowerCase()
}

const COMMON_WORDS = new Set([
  'services', 'service', 'request', 'information', 'sources', 'sought',
  'notice', 'support', 'federal', 'government', 'contract', 'contracts',
  'opportunity', 'acquisition', 'response', 'capability', 'business',
])

function titleEvidence(name: string, subject: string): boolean {
  const lower = subject.toLowerCase()
  const codes = name.match(/\b[a-z]{2,}-\d{2}-\d{5,}\b/gi) ?? []
  if (codes.some(code => lower.includes(code.toLowerCase()))) return true
  const standaloneAcronyms = name.match(/\b[A-Z][A-Z0-9]{4,}\b/g) ?? []
  if (standaloneAcronyms.some(acronym => lower.includes(acronym.toLowerCase()))) return true
  const acronyms = name.match(/\(([A-Z][A-Z0-9]{4,})\)/g) ?? []
  if (acronyms.some(acronym => lower.includes(acronym.slice(1, -1).toLowerCase()))) return true
  const terms = [...new Set((name.toLowerCase().match(/[a-z0-9]{5,}/g) ?? [])
    .filter(word => !COMMON_WORDS.has(word)))]
  return terms.filter(word => lower.includes(word)).length >= 2
}

/** Return one lead only. A tie is unsafe, even if several cards describe the
 * same solicitation: the CRM must not guess which card owns the conversation. */
export function matchSentMessage(leads: CorrespondenceLead[], message: SentMessage): CorrespondenceLead | null {
  const recipients = emailAddresses(message.to)
  const subject = normalizedSubject(message.subject)
  const eligible = leads.filter(lead =>
    Boolean(lead.email) && recipients.has(lead.email.trim().toLowerCase()) &&
    message.sentAt >= new Date(lead.created_at).getTime())
  const ranked = eligible.map(lead => {
    const draftedBeforeSend = Boolean(lead.gmail_draft_created_at &&
      message.sentAt >= new Date(lead.gmail_draft_created_at).getTime())
    let rank = 0
    if (lead.gmail_thread_id && lead.gmail_thread_id === message.threadId) rank = 5
    else if (lead.gmail_draft_id === message.id) rank = 5
    else if (lead.gmail_draft_subject && draftedBeforeSend &&
      normalizedSubject(lead.gmail_draft_subject) === subject) rank = 4
    else if (lead.source_id && lead.source_id.length >= 12 &&
      subject.includes(lead.source_id.toLowerCase())) rank = 4
    else if (draftedBeforeSend && titleEvidence(lead.name, subject)) rank = 3
    else if (eligible.length === 1 && titleEvidence(lead.name, subject)) rank = 2
    else if (eligible.length === 1 && lead.source === 'website_intake' &&
      /^re:\s*/i.test(message.subject)) rank = 1
    return { lead, rank }
  }).sort((a, b) => b.rank - a.rank)
  return ranked[0]?.rank > 0 && ranked[0].rank > (ranked[1]?.rank ?? 0) ? ranked[0].lead : null
}
