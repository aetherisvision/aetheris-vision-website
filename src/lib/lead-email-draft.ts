/** Outreach text runs through the owner's subscribed Claude Code worker. */
import { runClaudeSubscription } from '@/lib/claude-subscription'
import { CLAUDE_SUBSCRIPTION_MODEL } from '@/lib/claude-subscription-limits'

export const LEAD_DRAFT_MODEL = CLAUDE_SUBSCRIPTION_MODEL

export interface LeadDraftInput {
  /** Lead name -- for radar-synced leads this is the opportunity title. */
  title: string
  organization: string | null
  notes: string | null
  source: string | null
  /** The radar's structured govcon payload (analysis, fit_reasons, ...). */
  govcon: unknown
}

export interface DraftedLeadEmail {
  subject: string
  /** Plain-text body, paragraphs separated by blank lines. No signature. */
  bodyText: string
}

export class LeadDraftError extends Error {}

const SYSTEM_PROMPT = `You draft outreach emails for Marston S. Ward, Ph.D., owner of Aetheris Vision LLC, a one-person scientific and technical consultancy in Oklahoma. He is a PhD atmospheric scientist, a Certified Consulting Meteorologist, and a USAF veteran. The firm is an SBA-certified SDVOSB, VOSB, and HUBZone small business working in atmospheric science, AI/ML weather and environmental systems, and scientific data engineering. Every draft is reviewed and sent by Marston himself from Gmail, so write the email he would write, in the first person, ready to send.

You are given one lead record: an opportunity his radar system surfaced, with its analysis, fit reasons, cautions, and a recommended action. Read the whole record and write the email that action calls for, adapted to what the opportunity actually is:
- A grant or funding program: write to the program contact. Express specific interest grounded in the program's subject, and ask the one question that most needs answering (eligibility fit, timeline, or whether an approach is in scope).
- An open contract solicitation: write to the contracting officer or small-business specialist. Reference the solicitation by number if the record has one, state capability and intent plainly, and note the set-aside status only when the record shows the set-aside makes it relevant.
- A forecast or pre-solicitation opportunity: write an early positioning note. Introduce the relevant capability and ask about anticipated timeline or industry engagement.

Voice rules, binding:
- Plain, courteous, unhurried prose in connected paragraphs. Never use an em-dash. Use commas, parentheses, colons, or a new sentence instead.
- State the reason for writing in the first two sentences. No throat-clearing, no "I hope this finds you well."
- Where it fits naturally, say what you are NOT asking for, so the reader knows the size of the ask.
- Be exact about facts, and use ONLY facts present in the record. Never invent a contact name, agency detail, deadline, or dollar figure. No placeholders or brackets of any kind.
- Plain traditional English. Never use: leverage (as a verb), robust, crucial, delve, unlock, seamless, cutting-edge, synergy, excited, thrilled.
- Warmth must be specific to the situation, never generic enthusiasm.
- Mention once, naturally, that the capability statement is attached.
- 90 to 180 words. Greet with "Hello," (or the contact's surname with title only if the record names one). End with a closing salutation line only ("Respectfully," for government readers, otherwise "Best regards,") and nothing after it; the signature block is appended automatically.
- Never mention AI, automation, or how the email was produced.

Output format, exactly:
Subject: <the subject line, one line, plain and specific>
<blank line>
<the email body as plain text>`

/** Cap a field so one oversized record can't inflate the request. */
function cap(value: string, limit: number): string {
  return value.length > limit ? value.slice(0, limit) + ' [truncated]' : value
}

function formatGovconValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    return items.length > 0 ? items.join('; ') : null
  }
  return null
}

// The govcon keys worth showing the model, in reading order. Anything else
// in the payload is either display plumbing or already covered by these.
const GOVCON_FIELDS: [key: string, label: string, limit: number][] = [
  ['source', 'Opportunity source', 200],
  // The radar puts the SAM notice/solicitation number (or the grants.gov
  // funding opportunity number) in source_id; the research lane sometimes
  // falls back to a URL there, which formatGovconValue drops.
  ['source_id', 'Solicitation / notice number', 200],
  ['naics', 'NAICS', 200],
  ['psc', 'PSC', 200],
  ['set_aside', 'Set-aside', 200],
  ['amount', 'Amount', 200],
  ['deadline', 'Deadline', 200],
  ['score', 'Radar fit score', 50],
  ['analysis', 'Radar analysis', 4000],
  ['fit_reasons', 'Fit reasons', 2000],
  ['cautions', 'Cautions', 2000],
  ['recommended_action', 'Recommended action', 1000],
  ['sam_url', 'Listing URL', 500],
]

export function buildLeadPrompt(lead: LeadDraftInput): string {
  const lines: string[] = [
    `Today's date: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'LEAD RECORD',
    `Opportunity: ${cap(lead.title, 500)}`,
  ]
  if (lead.organization) lines.push(`Agency / organization: ${cap(lead.organization, 300)}`)
  if (lead.source) lines.push(`CRM source: ${cap(lead.source, 100)}`)
  if (lead.notes) lines.push(`Notes: ${cap(lead.notes, 2000)}`)
  const govcon = lead.govcon
  if (govcon && typeof govcon === 'object' && !Array.isArray(govcon)) {
    for (const [key, label, limit] of GOVCON_FIELDS) {
      const value = formatGovconValue((govcon as Record<string, unknown>)[key])
      if (!value) continue
      // The research lane falls back to a URL as its source_id; a URL is not
      // a solicitation number and must not be offered to the model as one.
      if (key === 'source_id' && /^https?:\/\//i.test(value)) continue
      lines.push(`${label}: ${cap(value, limit)}`)
    }
  }
  lines.push('', 'Write the outreach email for this lead.')
  return lines.join('\n')
}

export function parseDraftedEmail(text: string): DraftedLeadEmail {
  // Tolerate a stray code fence around the whole output.
  const cleaned = text.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
  const match = cleaned.match(/^Subject:[ \t]*(.+)\r?\n\s*\r?\n([\s\S]+)$/)
  if (!match) {
    throw new LeadDraftError('The model reply did not contain a Subject line and body')
  }
  const subject = match[1].replace(/[\r\n]+/g, ' ').trim()
  const bodyText = match[2].trim()
  if (!subject || bodyText.length < 40) {
    throw new LeadDraftError('The model reply was missing a usable subject or body')
  }
  return { subject, bodyText }
}

export async function draftLeadEmail(lead: LeadDraftInput): Promise<DraftedLeadEmail> {
  const text = await runClaudeSubscription('lead_email', {
    model: LEAD_DRAFT_MODEL,
    system: SYSTEM_PROMPT,
    prompt: buildLeadPrompt(lead),
  })
  return parseDraftedEmail(text)
}
