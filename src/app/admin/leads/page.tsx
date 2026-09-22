'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gmailDraftUrl } from '@/lib/gmail-draft-url'
import { exportProposalBrief, followUpDue, hasActiveDraftClaim, matchesQueue, nextWeek, opportunityUrl, proposalBrief, QUEUES, queueFor, radarText, workflowStep, type Lead, type LeadActivity, type LeadQueue, type LeadStage } from '@/lib/lead-workflow'
import styles from './leads.module.css'

interface Edits { email: string; phone: string; notes: string; followUp: string; value: string; brief: string; activity: string }
interface Notice { tone: 'success' | 'error'; text: string; reconnect?: boolean; conflict?: boolean }
const stageLabels: Record<LeadStage, string> = { review: 'In review', new: 'Ready for outreach', contacted: 'Following up', qualified: 'Proposal planning', proposal: 'Proposal in progress', won: 'Won', lost: 'Lost', declined: 'Not pursuing' }
function initialEdits(lead: Lead): Edits {
  return { email: lead.email, phone: lead.phone ?? '', notes: lead.notes ?? '', followUp: lead.stage === 'review' ? '' : lead.next_follow_up?.slice(0, 10) ?? '', value: lead.estimated_value_cents === null ? '' : String(lead.estimated_value_cents / 100), brief: proposalBrief(lead), activity: '' }
}

function matchesSearch(lead: Lead, search: string): boolean {
  return `${lead.name} ${lead.organization ?? ''} ${lead.email} ${radarText(lead, 'source_id')}`.toLowerCase().includes(search.trim().toLowerCase())
}

async function responseData(response: Response) {
  const data = await response.json().catch(() => null)
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(response.status === 504 || response.status === 408
      ? 'The request timed out. Check Gmail for a draft before retrying.'
      : 'The request could not be completed. Refresh to check its status before retrying.')
  }
  return data
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [queue, setQueue] = useState<LeadQueue>('review')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [dueOnly, setDueOnly] = useState(false)
  const [edits, setEdits] = useState<Record<number, Edits>>({})
  const [pending, setPending] = useState<Record<number, string>>({})
  const [notices, setNotices] = useState<Record<number, Notice>>({})
  const [checked, setChecked] = useState<number[]>([])
  const [removal, setRemoval] = useState<{ ids: number[]; reason: string } | null>(null)
  const [managementNotice, setManagementNotice] = useState<Notice | null>(null)
  const [undoIds, setUndoIds] = useState<number[]>([])
  const [managing, setManaging] = useState(false)
  const [syncingMail, setSyncingMail] = useState(false)
  const [importingResearch, setImportingResearch] = useState(false)
  const operation = useRef(false)
  const activityRetries = useRef(new Map<string, string>())
  const busy = managing || syncingMail || importingResearch || Object.keys(pending).length > 0

  async function loadLeads() {
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch('/api/admin/leads?include_removed=true', { cache: 'no-store' })
      const data = await responseData(response)
      if (!response.ok) throw new Error(data.error || 'Opportunities could not be loaded')
      setLeads(data.leads ?? [])
      const hashId = Number(window.location.hash.match(/^#lead-(\d+)$/)?.[1])
      if (hashId) {
        const linked = (data.leads as Lead[]).find(lead => lead.id === hashId)
        if (linked) { setSelectedId(hashId); setQueue(queueFor(linked)) }
      }
    } catch (error) { setLoadError(error instanceof Error ? error.message : 'Opportunities could not be loaded') }
    finally { setLoading(false) }
  }
  useEffect(() => { void loadLeads() }, [])

  async function syncSentMail() {
    if (busy) return
    setSyncingMail(true)
    setManagementNotice(null)
    try {
      const response = await fetch('/api/cron/lead-correspondence?days=90', {cache:'no-store'})
      const data = await responseData(response)
      if (!response.ok) throw new Error(data.error || 'Sent mail could not be checked')
      await loadLeads()
      setManagementNotice({tone:'success',text:data.moved
        ? `${data.moved} ${data.moved === 1 ? 'opportunity' : 'opportunities'} moved to Follow-ups from sent mail.`
        : 'Sent mail checked. No new opportunities matched.'})
    } catch (error) {
      setManagementNotice({tone:'error',text:error instanceof Error ? error.message : 'Sent mail could not be checked'})
    } finally {setSyncingMail(false)}
  }

  async function importResearch(file: File) {
    if (busy) return
    setImportingResearch(true)
    setManagementNotice(null)
    try {
      const payload = JSON.parse(await file.text())
      const response = await fetch('/api/admin/leads/research-prospects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await responseData(response)
      if (!response.ok) throw new Error(data.error || 'Research prospects could not be imported')
      await loadLeads()
      setSearch(''); setDueOnly(false); setQueue('research'); setSelectedId(null); setChecked([])
      setManagementNotice({ tone: 'success', text: `${data.count} research prospects are ready in the CRM (${data.created} new records).` })
    } catch (error) {
      setManagementNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Research prospects could not be imported' })
    } finally { setImportingResearch(false) }
  }

  const visible = useMemo(() => leads.filter(lead =>
    matchesQueue(lead, queue) && (!dueOnly || followUpDue(lead)) &&
    matchesSearch(lead, search)
  ).sort((a, b) => {
    if (queue === 'research') return (a.research_profile?.rank ?? 9999) - (b.research_profile?.rank ?? 9999)
    if (queue === 'follow-up' || dueOnly) return (a.next_follow_up || '9999').localeCompare(b.next_follow_up || '9999')
    if (queue === 'review') return Number(b.govcon?.score ?? -1) - Number(a.govcon?.score ?? -1)
    return b.created_at.localeCompare(a.created_at)
  }), [leads, queue, search, dueOnly])
  const selected = visible.find(lead => lead.id === selectedId) ?? visible[0] ?? null
  const edit = selected ? edits[selected.id] ?? initialEdits(selected) : null
  const action = selected ? pending[selected.id] : undefined
  const notice = selected ? notices[selected.id] : undefined
  const closed = selected ? queueFor(selected) === 'closed' : false
  const removed = Boolean(selected?.removed_at)
  const phase = removed ? 'removed' : selected?.stage === 'new' ? 'outreach' : selected ? queueFor(selected) : 'review'
  const link = selected ? opportunityUrl(selected) : null

  function selectQueue(next: LeadQueue) { setQueue(next); setSelectedId(null); setDueOnly(false); setChecked([]) }
  function changeEdit(patch: Partial<Edits>) {
    if (selected) setEdits(current => ({ ...current, [selected.id]: { ...(current[selected.id] ?? initialEdits(selected)), ...patch } }))
  }
  function mergeLead(id: number, patch: Partial<Lead>) { setLeads(current => current.map(lead => lead.id === id ? { ...lead, ...patch } : lead)) }
  function setNotice(id: number, value: Notice) { setNotices(current => ({ ...current, [id]: value })) }
  function start(id: number, label: string) {
    if (operation.current) return false
    operation.current = true
    setPending(current => ({ ...current, [id]: label }))
    setNotices(current => { const next = { ...current }; delete next[id]; return next })
    setSelectedId(id)
    return true
  }
  function finish(id: number) { operation.current = false; setPending(current => { const next = { ...current }; delete next[id]; return next }) }

  async function persistLead(lead: Lead, values: Edits, stage: LeadStage, activity?: string, kind: LeadActivity['kind'] = 'note'): Promise<Lead> {
    const fingerprint = JSON.stringify({ id: lead.id, version: lead.workflow_version, stage, values, activity, kind })
    let activityId = activityRetries.current.get(fingerprint)
    if (activity && !activityId) { activityId = crypto.randomUUID(); activityRetries.current.set(fingerprint, activityId) }
    const response = await fetch('/api/admin/leads', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lead.id, stage, expected_version: lead.workflow_version, notes: values.notes || null,
        estimated_value_cents: values.value ? Math.round(Number(values.value) * 100) : null,
        next_follow_up: values.followUp || null,
        ...(values.email.trim() !== lead.email ? { email: values.email.trim() } : {}),
        ...(values.phone.trim() !== (lead.phone ?? '') ? { phone: values.phone.trim() || null } : {}),
        ...(values.brief !== proposalBrief(lead) ? { proposal_brief: values.brief || null } : {}),
        ...(activity ? { activity: { id: activityId, kind, note: [activity, values.activity.trim()].filter(Boolean).join(': ') } } : {}),
      }),
    })
    const data = await responseData(response)
    if (!response.ok) {
      const error = new Error(data.error || 'Changes could not be saved')
      if (data.code === 'LEAD_CONFLICT') error.name = 'LeadConflict'
      throw error
    }
    const saved = data.lead as Lead
    mergeLead(lead.id, saved)
    setEdits(current => ({ ...current, [lead.id]: { ...initialEdits(saved), activity: activity ? '' : values.activity } }))
    activityRetries.current.delete(fingerprint)
    if (!matchesQueue(saved, queue) || (dueOnly && !followUpDue(saved))) {
      setQueue(queueFor(saved)); setDueOnly(false); setChecked([])
    }
    if (!matchesSearch(saved, search)) setSearch('')
    setSelectedId(lead.id)
    return saved
  }

  async function save(lead: Lead, values: Edits, stage = lead.stage, message = 'Changes saved.', activity?: string, kind: LeadActivity['kind'] = 'note') {
    if (stage === 'won' || lead.removed_at || !start(lead.id, 'Saving…')) return
    try {
      await persistLead(lead, values, stage, activity, kind)
      setNotice(lead.id, { tone: 'success', text: message })
    } catch (error) {
      setNotice(lead.id, { tone: 'error', text: error instanceof Error ? error.message : 'Changes could not be saved', conflict: error instanceof Error && error.name === 'LeadConflict' })
    } finally { finish(lead.id) }
  }

  async function reloadSaved(lead: Lead) {
    if (!start(lead.id, 'Reloading…')) return
    try {
      const response = await fetch('/api/admin/leads?include_removed=true', { cache: 'no-store' })
      const data = await responseData(response)
      if (!response.ok) throw new Error(data.error || 'Could not reload the saved opportunity')
      const saved = (data.leads as Lead[]).find(item => item.id === lead.id)
      if (!saved) throw new Error('This opportunity could not be found')
      setLeads(data.leads)
      setEdits(current => ({ ...current, [lead.id]: initialEdits(saved) }))
      setQueue(queueFor(saved)); setDueOnly(false); setChecked([])
      setNotice(lead.id, { tone: 'success', text: 'Loaded the latest saved version.' })
    } catch (error) { setNotice(lead.id, { tone: 'error', text: error instanceof Error ? error.message : 'Could not reload the opportunity' }) }
    finally { finish(lead.id) }
  }

  async function manage(action: 'remove' | 'restore', ids: number[], reason = '') {
    if (!ids.length || operation.current) return
    operation.current = true; setManaging(true); setManagementNotice(null)
    try {
      const response = await fetch('/api/admin/leads/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids, ...(action === 'remove' ? { reason } : {}) }),
      })
      const data = await responseData(response)
      if (!response.ok) throw new Error(data.error || 'Opportunities could not be updated')
      const updated = data.leads as Lead[]
      setLeads(current => current.map(lead => ({ ...lead, ...updated.find(item => item.id === lead.id) })))
      setEdits(current => { const next = { ...current }; ids.forEach(id => { delete next[id] }); return next })
      setChecked([]); setRemoval(null); setSelectedId(null)
      setUndoIds(action === 'remove' ? ids : [])
      setManagementNotice({ tone: 'success', text: `${ids.length} ${ids.length === 1 ? 'opportunity' : 'opportunities'} ${action === 'remove' ? 'removed. History and linked records are preserved.' : 'restored to the previous workflow stage.'}` })
      if (action === 'restore' && ids.length === 1 && updated[0]) { setQueue(queueFor(updated[0])); setDueOnly(false); setSelectedId(ids[0]) }
    } catch (error) { setManagementNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Opportunities could not be updated' }) }
    finally { operation.current = false; setManaging(false) }
  }

  function requestRemoval(ids: number[]) { setRemoval({ ids: [...ids], reason: '' }); setManagementNotice(null) }

  async function draftEmail(lead: Lead, regenerate = false) {
    if (regenerate && !window.confirm('Write a fresh draft? The current draft stays in Gmail until you delete it there.')) return
    if (!start(lead.id, 'Drafting…')) return
    let reconnect = false
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}/draft-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ regenerate }) })
      const data = await responseData(response)
      reconnect = data.code === 'GMAIL_RECONNECT_REQUIRED'
      if (typeof data.messageId === 'string' && data.messageId) mergeLead(lead.id, { gmail_draft_id: data.messageId, gmail_draft_created_at: data.draftedAt ?? new Date().toISOString() })
      if (!response.ok) throw new Error(data.error || 'The draft could not be created')
      if (typeof data.messageId !== 'string' || !data.messageId) throw new Error('The draft service did not return a Gmail draft. Check Gmail before retrying.')
      setNotice(lead.id, { tone: 'success', text: 'Your Gmail draft is ready. Review and send it in Gmail. Sent mail sync will move this opportunity to Follow-ups.' })
    } catch (error) { setNotice(lead.id, { tone: 'error', text: error instanceof Error ? error.message : 'The draft could not be created', reconnect }) }
    finally { finish(lead.id) }
  }

  async function prepareProposal(lead: Lead, values: Edits) {
    if (!start(lead.id, 'Creating project…')) return
    try {
      const saved = await persistLead(lead, values, lead.stage, values.activity.trim() ? 'Proposal update' : undefined)
      const response = await fetch(`/api/admin/leads/${lead.id}/convert`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expected_version: saved.workflow_version }) })
      const data = await responseData(response)
      if (!response.ok) {
        const error = new Error(data.error || 'The proposal project could not be created')
        if (data.code === 'LEAD_CONFLICT') error.name = 'LeadConflict'
        throw error
      }
      mergeLead(lead.id, { ...data.lead, client_id: data.clientId, project_id: data.projectId })
      if (data.lead) setEdits(current => ({ ...current, [lead.id]: initialEdits(data.lead) }))
      setNotice(lead.id, { tone: 'success', text: 'Proposal project ready. Continue developing the brief here, or open the project to track delivery.' })
    } catch (error) { setNotice(lead.id, { tone: 'error', text: error instanceof Error ? error.message : 'The proposal could not be prepared', conflict: error instanceof Error && error.name === 'LeadConflict' }) }
    finally { finish(lead.id) }
  }

  function downloadBrief(lead: Lead, brief: string) {
    const url = URL.createObjectURL(new Blob([exportProposalBrief(lead, brief)], { type: 'text/markdown;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `opportunity-${lead.id}-proposal-brief.md`; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <main id="main" className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>AETHERIS VISION · CRM</p><h1>Opportunity workspace</h1><p className={styles.subtitle}>Decide what to pursue. Keep the next action in view.</p></div>
        <Link href="/admin/gmail" className={styles.textLink}>Gmail connection ↗</Link>
      </header>
      <nav className={styles.queues} aria-label="Opportunity workflow">
        {QUEUES.map(item => <button key={item.id} aria-pressed={queue === item.id} disabled={busy} title={item.description} onClick={() => selectQueue(item.id)} className={queue === item.id ? styles.activeQueue : ''}>
          <span>{item.label}<strong>{leads.filter(lead => matchesQueue(lead, item.id)).length}</strong></span>
        </button>)}
      </nav>
      <div className={styles.toolbar}>
        <label className={styles.search}><span className={styles.srOnly}>Search opportunities</span><input type="search" disabled={busy} placeholder="Search opportunities, agencies, contacts…" value={search} onChange={event => { setSearch(event.target.value); setChecked([]) }} /></label>
        <button disabled={busy} className={styles.secondary} aria-pressed={dueOnly} onClick={() => { setDueOnly(!dueOnly); setQueue('all'); setSelectedId(null); setChecked([]) }}>Follow-up due <strong>{leads.filter(followUpDue).length}</strong></button>
        <button disabled={busy} className={styles.quiet} onClick={() => selectQueue('all')}>All opportunities ({leads.filter(lead => !lead.removed_at).length})</button>
        <button disabled={busy} className={styles.secondary} aria-pressed={queue === 'research'} onClick={() => selectQueue('research')}>Research prospects ({leads.filter(lead => !lead.removed_at && lead.research_profile).length})</button>
        <label className={styles.importLabel}>Import research list <input type="file" accept="application/json,.json" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void importResearch(file); event.target.value = '' }} /></label>
        <button disabled={busy} className={styles.secondary} onClick={() => void syncSentMail()}>{syncingMail ? 'Checking Gmail…' : 'Sync sent mail'}</button>
      </div>
      {managementNotice && <div className={managementNotice.tone === 'error' ? styles.error : styles.success} role={managementNotice.tone === 'error' ? 'alert' : 'status'}>{managementNotice.text} {undoIds.length > 0 && <button disabled={busy} className={styles.quiet} onClick={() => void manage('restore', undoIds)}>Undo removal</button>}</div>}
      {removal && <section className={styles.removalPanel} aria-label="Confirm removal">
        <h2>Remove {removal.ids.length} {removal.ids.length === 1 ? 'opportunity' : 'opportunities'}?</h2>
        <p>These leave your working queues and stay suppressed when radar scans again. You can restore them from Removed, with their previous stage and history.</p>
        <ul>{removal.ids.map(id => <li key={id}>{leads.find(lead => lead.id === id)?.name ?? `Opportunity #${id}`}</li>)}</ul>
        <label>Reason (optional)<input disabled={busy} maxLength={1000} value={removal.reason} onChange={event => setRemoval({ ...removal, reason: event.target.value })} placeholder="Outside our scope, expired, no viable contact…" /></label>
        <p className={styles.help}>Unsaved edits on these opportunities will be discarded. Existing projects and Gmail drafts stay available.</p>
        <div className={styles.actions}><button disabled={busy} className={styles.dangerButton} onClick={() => void manage('remove', removal.ids, removal.reason)}>Remove {removal.ids.length}</button><button disabled={busy} className={styles.quiet} onClick={() => setRemoval(null)}>Cancel</button></div>
      </section>}
      {loadError && <div role="alert" className={styles.error}>{loadError} <button className={styles.secondary} onClick={() => void loadLeads()}>Retry loading</button></div>}
      {loading ? <p role="status">Loading opportunities…</p> : <div className={styles.layout}>
        <aside className={styles.inbox} aria-label="Opportunity list">
          <div className={styles.listTitle}><strong>{dueOnly ? 'Follow-up due' : queue === 'research' ? 'Research prospects' : QUEUES.find(item => item.id === queue)?.label ?? 'All opportunities'}</strong><span>{visible.length} opportunities</span></div>
          {!visible.length && <p className={styles.empty}>No opportunities here. Choose another queue or change your search.</p>}
          {!!visible.length && <div className={styles.bulkBar}>
            <label><input type="checkbox" disabled={busy} checked={visible.slice(0, 100).every(lead => checked.includes(lead.id))} onChange={event => setChecked(event.target.checked ? visible.slice(0, 100).map(lead => lead.id) : [])} />{checked.length ? `${checked.length} selected` : visible.length > 100 ? 'Select first 100' : 'Select all'}</label>
            {checked.length > 0 && <button disabled={busy} className={styles.quiet} onClick={() => queue === 'removed' ? void manage('restore', checked) : requestRemoval(checked)}>{queue === 'removed' ? 'Restore' : 'Remove'} {checked.length}</button>}
          </div>}
          <div className={styles.list}>
            {visible.map(lead => <div key={lead.id} className={`${styles.listRow} ${selected?.id === lead.id ? styles.selectedRow : ''}`}>
              <input className={styles.rowCheck} type="checkbox" aria-label={`Select ${lead.name}`} disabled={busy || (!checked.includes(lead.id) && checked.length >= 100)} checked={checked.includes(lead.id)} onChange={event => setChecked(current => event.target.checked ? [...current, lead.id] : current.filter(id => id !== lead.id))} />
              <button disabled={busy} onClick={() => setSelectedId(lead.id)} aria-current={selected?.id === lead.id ? 'true' : undefined} className={styles.row}>
                <span className={styles.rowMeta}>{lead.research_profile ? `RESEARCH #${lead.research_profile.rank}` : lead.source === 'opportunity-radar' ? 'RADAR' : 'INQUIRY'}{lead.research_profile ? <span>Score {lead.research_profile.score} · Tier {lead.research_profile.tier}</span> : typeof lead.govcon?.score === 'number' && <span>Fit {lead.govcon.score}</span>}</span>
                <strong>{lead.name}</strong><span>{lead.organization || lead.email || 'Contact needed'}</span>
                <span className={followUpDue(lead) ? styles.due : styles.rowStage}>{lead.removed_at ? 'Removed' : followUpDue(lead) ? `Follow-up due ${lead.next_follow_up?.slice(0, 10)}` : stageLabels[lead.stage]}</span>
              </button>
            </div>)}
          </div>
        </aside>
        {selected && edit ? <article id={`lead-${selected.id}`} className={styles.workspace} aria-label="Selected opportunity">
          <header className={styles.opportunityHeader}>
            <div className={styles.rowMeta}><span>{removed ? 'Removed' : stageLabels[selected.stage]}</span><span>Opportunity #{selected.id}</span></div>
            <div className={styles.actions}>{removed ? <button disabled={busy} className={styles.secondary} onClick={() => void manage('restore', [selected.id])}>Restore opportunity</button> : <button disabled={busy} className={styles.quiet} onClick={() => requestRemoval([selected.id])}>Remove from workspace</button>}</div>
            <h2>{selected.name}</h2><p>{selected.organization || (selected.source === 'opportunity-radar' ? 'Opportunity radar' : 'Website inquiry')}</p>
            <div className={styles.facts}>
              {radarText(selected, 'source_id') && <span>Reference <strong>{radarText(selected, 'source_id')}</strong></span>}
              {radarText(selected, 'deadline') && <span>Response deadline <strong>{radarText(selected, 'deadline')}</strong></span>}
              {link && <a href={link} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Open opportunity ↗</a>}
            </div>
          </header>
          {!closed && !removed && <ol className={styles.steps} aria-label="Opportunity progress">{['Review', 'Pursue', 'Outreach', 'Follow-up', 'Proposal'].map((step, index) => <li key={step} aria-current={workflowStep(selected) === step ? 'step' : undefined}><span>{index + 1}</span>{step}</li>)}</ol>}
          {notice && <div role={notice.tone === 'error' ? 'alert' : 'status'} className={notice.tone === 'error' ? styles.error : styles.success}>{notice.text}{notice.reconnect && <> <Link href="/admin/gmail" className={styles.textLink}>Reconnect Gmail</Link></>}{notice.conflict && <button disabled={busy} className={styles.secondary} onClick={() => void reloadSaved(selected)}>Discard local edits & reload saved version</button>}</div>}
          {action && <p role="status" className={styles.progress}>{action === 'Drafting…' ? 'Preparing your draft with Claude. This may take a couple of minutes…' : action}</p>}

          <section className={styles.actionPanel} aria-label="Next action">
            {removed && <><h3>Removed from active work</h3><p>{selected.removal_reason || 'No removal reason recorded.'}</p><p className={styles.help}>Restore this opportunity to resume at its previous stage. Radar will keep it out of your working queues until then.</p></>}
            {phase === 'review' && <><p className={styles.eyebrow}>DECISION</p><h3>Is this worth pursuing?</h3><p>{radarText(selected, 'recommended_action') || 'Review the opportunity and its fit, then move it into outreach when you are ready.'}</p><div className={styles.actions}><button disabled={busy} className={styles.primary} onClick={() => void save(selected, edit, 'new', 'You are pursuing this opportunity. Start outreach below.', 'Decided to pursue', 'stage_change')}>Pursue</button><button disabled={busy} className={styles.quiet} onClick={() => requestRemoval([selected.id])}>Remove</button></div></>}
            {phase === 'outreach' && <><p className={styles.eyebrow}>FIRST CONTACT</p><h3>Start the conversation</h3><p>Prepare your message, then review and send it in Gmail. Sent mail sync moves matching opportunities to Follow-ups automatically.</p></>}
            {phase === 'follow-up' && <><p className={styles.eyebrow}>FOLLOW-UP</p><h3>{followUpDue(selected) ? 'Your follow-up is due' : 'Keep the conversation moving'}</h3><p>{selected.next_follow_up ? `Next follow-up: ${selected.next_follow_up.slice(0, 10)}.` : 'Set the next date so this opportunity stays on your radar.'}</p></>}
            {phase === 'proposal' && <><p className={styles.eyebrow}>PROPOSAL</p><h3>Develop the approach and scope</h3><p>Use the opportunity requirements to prepare a working brief. Save it here and download a copy when you need it.</p></>}
            {closed && <><h3>{stageLabels[selected.stage]}</h3><p>{selected.stage === 'won' ? 'Recorded as won after signature.' : selected.stage === 'declined' ? 'This opportunity was not pursued. You can return it to review.' : 'This opportunity is closed.'}</p>{selected.stage === 'declined' && <button disabled={busy} className={styles.secondary} onClick={() => void save(selected, edit, 'review', 'Returned to review.')}>Reconsider</button>}</>}

            {['outreach', 'follow-up', 'proposal'].includes(phase) && <>
              <fieldset disabled={busy} className={styles.contact}>
                <legend>Contact</legend>
                <label>Email<input type="email" value={edit.email} onChange={event => changeEdit({ email: event.target.value })} placeholder="Contact email address" disabled={Boolean(selected.client_id || selected.gmail_draft_id || hasActiveDraftClaim(selected))} /></label>
                <label>Phone<input type="tel" value={edit.phone} onChange={event => changeEdit({ phone: event.target.value })} /></label>
                {(edit.email.trim() !== selected.email || edit.phone !== (selected.phone ?? '')) && <button className={styles.secondary} onClick={() => void save(selected, edit, selected.stage, 'Contact details saved.')}>Save contact</button>}
              </fieldset>
              {(selected.client_id || selected.gmail_draft_id || hasActiveDraftClaim(selected)) && <p className={styles.help}>{selected.client_id ? 'This email is linked to an existing client and cannot be changed here. Check and correct the recipient in Gmail before sending.' : selected.gmail_draft_id ? 'A draft is already addressed to this contact. Review or correct its recipient in Gmail.' : 'The contact is locked while a draft is being prepared.'}</p>}
              {!selected.email && <p className={styles.help}>Add and save a contact email to draft outreach or create a proposal project.{link && <> The <a className={styles.textLink} href={link} target="_blank" rel="noopener noreferrer">original listing</a> may name the right contact.</>}</p>}
              {selected.gmail_draft_id && <a href={gmailDraftUrl(selected.gmail_draft_id)} target="_blank" rel="noopener noreferrer" className={styles.primaryLink}>Gmail draft ready ↗</a>}
              {selected.gmail_draft_created_at && !selected.gmail_draft_id && <p className={styles.help}>An earlier request may have created a Gmail draft. Check Gmail before retrying to avoid a duplicate.</p>}
              {selected.email && <div className={styles.actions}><button disabled={busy || edit.email.trim() !== selected.email} className={styles.secondary} onClick={() => void draftEmail(selected, !!selected.gmail_draft_id)}>{action === 'Drafting…' ? 'Drafting…' : selected.gmail_draft_id ? 'Recreate draft' : selected.gmail_draft_created_at ? 'Retry draft' : 'Draft email'}</button><a href={`mailto:${selected.email}`} className={styles.textLink}>Open email app ↗</a></div>}
            </>}
            {['outreach', 'follow-up', 'proposal'].includes(phase) && <fieldset disabled={busy} className={styles.followUp}>
              <legend>{phase === 'outreach' ? 'After you send or call' : 'Record the next step'}</legend>
              <label>{phase === 'outreach' ? 'Outreach notes' : 'Follow-up notes'}<textarea rows={2} maxLength={3500} value={edit.activity} onChange={event => changeEdit({ activity: event.target.value })} placeholder="Who you contacted, what you discussed, or what you need next" /></label>
              <label>Next follow-up<input type="date" value={edit.followUp} onChange={event => changeEdit({ followUp: event.target.value })} /></label>
              <div className={styles.actions}><button className={styles.quiet} onClick={() => changeEdit({ followUp: nextWeek() })}>In one week</button><button className={styles.secondary} onClick={() => void save(selected, edit, selected.stage, 'Follow-up date saved.')}>Save follow-up date</button></div>
              <div className={styles.actions}>{phase === 'outreach' ? <><button className={styles.primary} disabled={!edit.followUp} onClick={() => void save(selected, edit, 'contacted', 'Outreach recorded. Your next step is follow-up.', 'Outreach email sent', 'outreach')}>Record outreach sent</button><button className={styles.secondary} disabled={!edit.followUp} onClick={() => void save(selected, edit, 'contacted', 'Call recorded. Your next step is follow-up.', 'Call completed', 'outreach')}>Record call</button></> : <><button className={styles.secondary} disabled={!edit.activity.trim() || !edit.followUp} onClick={() => void save(selected, edit, selected.stage, 'Follow-up recorded.', 'Follow-up completed', 'follow_up')}>Record follow-up</button>{phase !== 'proposal' && <button className={styles.primary} onClick={() => void save(selected, edit, 'qualified', 'Ready for proposal planning. Build your brief below.', 'Ready for proposal', 'stage_change')}>Ready for proposal</button>}</>}</div>
              {phase === 'outreach' && !edit.followUp && <p className={styles.help}>Choose your follow-up date before recording outreach.</p>}
            </fieldset>}
            {phase === 'proposal' && <fieldset disabled={busy} className={styles.proposal}>
              <legend>Proposal brief</legend>
              <p className={styles.help}>Cover the requested outcome, proposed approach, deliverables, schedule, pricing assumptions, and questions to resolve. This is your working brief, not a submitted proposal.</p>
              <label><span className={styles.srOnly}>Proposal brief</span><textarea rows={12} maxLength={20000} value={edit.brief} onChange={event => changeEdit({ brief: event.target.value })} placeholder="Outcome and requirements\n\nProposed approach\n\nDeliverables\n\nSchedule and pricing\n\nQuestions to resolve" /></label>
              <div className={styles.actions}><button className={styles.primary} onClick={() => void save(selected, edit, selected.stage, 'Proposal brief saved.', edit.activity.trim() ? 'Proposal update' : undefined)}>Save proposal brief</button><button className={styles.secondary} disabled={!edit.brief.trim()} onClick={() => downloadBrief(selected, edit.brief)}>Download brief</button></div>
              <div className={styles.projectHandoff}>{selected.project_id ? <Link className={styles.textLink} href={`/admin/projects#project-${selected.project_id}`}>Open proposal project #{selected.project_id} ↗</Link> : <button className={styles.secondary} disabled={!selected.email || !edit.brief.trim()} onClick={() => void prepareProposal(selected, edit)}>Create proposal project</button>}<p className={styles.help}>The project tracks dates and delivery. Your proposal brief stays attached to this opportunity.</p></div>
            </fieldset>}
          </section>

          {selected.research_profile && <section className={styles.context} aria-label="Research prospect profile">
            <h3>Research prospect profile</h3>
            <p><strong>Rank {selected.research_profile.rank} · Score {selected.research_profile.score} · Tier {selected.research_profile.tier} · {selected.research_profile.wave}</strong></p>
            <p>{selected.research_profile.why_fit}</p>
            <h4>Discussion opener</h4><p>{selected.research_profile.opener}</p>
            <h4>Next action</h4><p>{selected.research_profile.next_step}</p>
            <p className={styles.help}>Contact route: {selected.research_profile.email_route} · {selected.research_profile.contact_role} · {selected.research_profile.state}</p>
            <a href={selected.research_profile.source_url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Official source ↗</a>
          </section>}

          <section className={styles.context} aria-label="Opportunity context">
            <h3>{selected.source === 'opportunity-radar' ? 'Radar assessment' : selected.research_profile ? 'Background' : 'Inquiry details'}</h3>
            {radarText(selected, 'analysis') ? <p>{radarText(selected, 'analysis')}</p> : selected.message !== selected.name && <p>{selected.message}</p>}
            {(['fit_reasons', 'cautions'] as const).map(key => { const items = selected.govcon?.[key]; return Array.isArray(items) && items.length ? <div key={key} className={key === 'cautions' ? styles.cautions : styles.fit}><h4>{key === 'cautions' ? 'Watch for' : 'Why it fits'}</h4><ul>{items.filter(item => typeof item === 'string').map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null })}
            {phase !== 'review' && radarText(selected, 'recommended_action') && <p><strong>Radar recommendation: </strong>{radarText(selected, 'recommended_action')}</p>}
          </section>
          <section className={styles.history} aria-label="Activity history">
            <h3>Activity</h3>
            {(selected.activity_history ?? []).length ? <ol>{[...selected.activity_history].reverse().map(item => <li key={item.id}><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time><p>{item.note}</p>{item.from_stage && item.to_stage && item.from_stage !== item.to_stage && <small>{stageLabels[item.from_stage]} → {stageLabels[item.to_stage]}</small>}</li>)}</ol> : <p className={styles.help}>Actions you record here will appear in this history.</p>}
          </section>
          <details className={styles.details}>
            <summary>Notes, value & related records</summary>
            <fieldset disabled={busy || closed || removed}>
              <label>Estimated value (USD)<input type="number" min="0" step="100" value={edit.value} onChange={event => changeEdit({ value: event.target.value })} /></label>
              <label>Working notes<textarea rows={6} maxLength={10000} value={edit.notes} onChange={event => changeEdit({ notes: event.target.value })} /></label>
              {!closed && !removed && <button className={styles.secondary} onClick={() => void save(selected, edit)}>Save notes & value</button>}
            </fieldset>
            <div className={styles.actions}>
              {selected.intake_id && <Link className={styles.textLink} href={`/admin/intake#intake-${selected.intake_id}`}>Intake & SOW #{selected.intake_id} ↗</Link>}
              {selected.client_id && <Link className={styles.textLink} href={`/admin/clients#client-${selected.client_id}`}>Client #{selected.client_id} ↗</Link>}
              {selected.project_id && <Link className={styles.textLink} href={`/admin/projects#project-${selected.project_id}`}>Project #{selected.project_id} ↗</Link>}
              {!closed && !removed && phase !== 'review' && <button disabled={busy} className={styles.dangerButton} onClick={() => { if (window.confirm('Close this opportunity as lost? Any open proposal project and intake will also be closed.')) void save(selected, edit, 'lost', 'Opportunity closed as lost.') }}>Close as lost</button>}
            </div>
          </details>
        </article> : <section className={styles.noSelection}><h2>Choose an opportunity</h2><p>Select a queue to review opportunities or continue work already in progress.</p></section>}
      </div>}
    </main>
  )
}
