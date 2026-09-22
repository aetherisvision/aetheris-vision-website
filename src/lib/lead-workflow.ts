export type LeadStage = 'review' | 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | 'declined'
export type LeadQueue = 'review' | 'active' | 'follow-up' | 'proposal' | 'closed' | 'removed' | 'research' | 'all'
export interface ResearchProfile {
  rank: number
  tier: string
  score: number
  type: string
  state: string
  contact_role: string
  email_route: string
  why_fit: string
  opener: string
  wave: string
  next_step: string
  source_url: string
  verified_at: string
}
export interface LeadActivity {
  id: string
  kind: 'outreach' | 'follow_up' | 'note' | 'stage_change' | 'removed' | 'restored'
  note: string
  created_at: string
  from_stage?: LeadStage
  to_stage?: LeadStage
}

export interface Lead {
  id: number
  name: string
  email: string
  organization: string | null
  phone: string | null
  service: string | null
  message: string
  source: string
  stage: LeadStage
  estimated_value_cents: number | null
  next_follow_up: string | null
  notes: string | null
  client_id: number | null
  project_id: number | null
  intake_id: number | null
  gmail_draft_id: string | null
  gmail_draft_created_at: string | null
  govcon: Record<string, unknown> | null
  research_profile?: ResearchProfile | null
  created_at: string
  removed_at: string | null
  removal_reason: string | null
  workflow_version: number
  activity_history: LeadActivity[]
}

export const QUEUES: { id: LeadQueue; label: string; description: string }[] = [
  { id: 'review', label: 'Review', description: 'Decide what to pursue' },
  { id: 'active', label: 'Active', description: 'Opportunities you are pursuing' },
  { id: 'follow-up', label: 'Follow-ups', description: 'Conversations and next actions' },
  { id: 'proposal', label: 'Proposals', description: 'Develop your approach' },
  { id: 'closed', label: 'Closed', description: 'Won, lost, or not pursuing' },
  { id: 'removed', label: 'Removed', description: 'Restore leads removed from active work' },
]

export function queueFor(lead: Pick<Lead, 'stage'> & Partial<Pick<Lead, 'removed_at'>>): Exclude<LeadQueue, 'all'> {
  if (lead.removed_at) return 'removed'
  switch (lead.stage) {
    case 'review': return 'review'
    case 'new': return 'active'
    case 'contacted': return 'follow-up'
    case 'qualified': case 'proposal': return 'proposal'
    default: return 'closed'
  }
}

export function isActiveLead(lead: Pick<Lead, 'stage' | 'removed_at'>): boolean {
  return !lead.removed_at && ['new', 'contacted', 'qualified', 'proposal'].includes(lead.stage)
}

export function matchesQueue(lead: Lead, queue: LeadQueue): boolean {
  if (queue === 'removed') return Boolean(lead.removed_at)
  if (lead.removed_at) return false
  if (queue === 'research') return Boolean(lead.research_profile)
  if (queue === 'all') return true
  if (queue === 'active') return isActiveLead(lead)
  if (queue === 'follow-up') return isActiveLead(lead) && (lead.stage === 'contacted' || Boolean(lead.next_follow_up))
  return queueFor(lead) === queue
}

export function workflowStep(lead: Lead): string {
  if (lead.stage === 'review') return 'Review'
  if (lead.stage === 'new') return lead.gmail_draft_id ? 'Outreach' : 'Pursue'
  if (lead.stage === 'contacted') return 'Follow-up'
  if (lead.stage === 'qualified' || lead.stage === 'proposal') return 'Proposal'
  return { won: 'Won', lost: 'Lost', declined: 'Not pursuing' }[lead.stage]
}

export function hasActiveDraftClaim(lead: Lead, now = Date.now()): boolean {
  if (lead.gmail_draft_id || !lead.gmail_draft_created_at) return false
  const claimedAt = Date.parse(lead.gmail_draft_created_at)
  return Number.isFinite(claimedAt) && claimedAt > now - 5 * 60_000
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function nextWeek(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return localDate(date)
}

export function followUpDue(lead: Lead): boolean {
  return isActiveLead(lead) &&
    Boolean(lead.next_follow_up && lead.next_follow_up.slice(0, 10) <= localDate())
}

export function radarText(lead: Lead, key: string): string {
  const value = lead.govcon?.[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

export function opportunityUrl(lead: Lead): string | null {
  const value = radarText(lead, 'sam_url')
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch { return null }
}

export function proposalBrief(lead: Lead): string {
  return radarText(lead, 'crm_proposal_brief')
}

export function exportProposalBrief(lead: Lead, brief: string): string {
  return [
    `# ${lead.name}`, lead.organization ? `Organization: ${lead.organization}` : '',
    radarText(lead, 'source_id') ? `Reference: ${radarText(lead, 'source_id')}` : '',
    opportunityUrl(lead) ? `Opportunity: ${opportunityUrl(lead)}` : '',
    lead.email ? `Contact: ${lead.email}` : '',
    radarText(lead, 'deadline') ? `Response deadline: ${radarText(lead, 'deadline')}` : '',
    '', '## Proposal brief', brief,
  ].filter(line => line !== null).join('\n')
}
