'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const
const MANUAL_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'lost'] as const

type Stage = typeof STAGES[number]

interface Lead {
  id: number
  name: string
  email: string
  organization: string | null
  phone: string | null
  service: string | null
  message: string
  source: string
  stage: Stage
  estimated_value_cents: number | null
  next_follow_up: string | null
  notes: string | null
  client_id: number | null
  project_id: number | null
  intake_id: number | null
  relationship_status: string | null
  project_status: string | null
  gmail_draft_id: string | null
  gmail_draft_created_at: string | null
  created_at: string
}

const colors = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  surfaceAlt: 'rgba(255,255,255,0.035)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f1f5f9',
  muted: 'rgba(255,255,255,0.56)',
  dim: 'rgba(255,255,255,0.32)',
  blue: '#5BA8D9',
  green: '#6ee7b7',
  amber: '#fbbf24',
  red: '#f87171',
}

const stageLabels: Record<Stage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
}

const stageColors: Record<Stage, string> = {
  new: '#93c5fd',
  contacted: '#67e8f9',
  qualified: '#fcd34d',
  proposal: '#c4b5fd',
  won: '#6ee7b7',
  lost: '#fca5a5',
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function isOverdue(value: string | null, stage: Stage) {
  if (!value || stage === 'won' || stage === 'lost') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${value.slice(0, 10)}T00:00:00`) < today
}

function formatCurrency(cents: number | null) {
  if (cents === null) return 'Not estimated'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function titleCase(value: string | null) {
  if (!value) return null
  return value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase())
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Stage | 'all'>('all')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  async function loadLeads() {
    try {
      const response = await fetch('/api/admin/leads')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Leads could not be loaded')
      setLeads(data.leads ?? [])
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Leads could not be loaded' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial data hydration for this client-only admin screen.
    void loadLeads()
  }, [])

  const visible = useMemo(
    () => filter === 'all' ? leads : leads.filter(lead => lead.stage === filter),
    [filter, leads]
  )

  const counts = useMemo(
    () => Object.fromEntries(STAGES.map(stage => [stage, leads.filter(lead => lead.stage === stage).length])) as Record<Stage, number>,
    [leads]
  )

  const openLeads = leads.filter(lead => lead.stage !== 'won' && lead.stage !== 'lost')
  const openValue = openLeads.reduce((sum, lead) => sum + (lead.estimated_value_cents ?? 0), 0)

  function updateLocal(id: number, update: Partial<Lead>) {
    setLeads(current => current.map(lead => lead.id === id ? { ...lead, ...update } : lead))
  }

  async function saveLead(lead: Lead) {
    if (lead.stage === 'won') return
    setBusyId(lead.id)
    setNotice(null)

    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          stage: lead.stage,
          estimated_value_cents: lead.estimated_value_cents,
          next_follow_up: dateInputValue(lead.next_follow_up) || null,
          notes: lead.notes,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The lead could not be updated')
      updateLocal(lead.id, data.lead)
      setNotice({ tone: 'success', text: `${lead.name} was updated` })
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'The lead could not be updated' })
    } finally {
      setBusyId(null)
    }
  }

  async function prepareProposal(lead: Lead) {
    setBusyId(lead.id)
    setNotice(null)

    try {
      const response = await fetch(`/api/admin/leads/${lead.id}/convert`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The proposal could not be prepared')

      updateLocal(lead.id, {
        ...data.lead,
        client_id: data.clientId ?? data.lead?.client_id ?? lead.client_id,
        project_id: data.projectId ?? data.lead?.project_id ?? lead.project_id,
      })
      setNotice({
        tone: 'success',
        text: data.projectCreated
          ? `A proposal project is ready for ${lead.name}`
          : `The existing proposal project is linked to ${lead.name}`,
      })
      await loadLeads()
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'The proposal could not be prepared' })
    } finally {
      setBusyId(null)
    }
  }

  async function draftEmail(lead: Lead) {
    setBusyId(lead.id)
    setNotice(null)

    try {
      const response = await fetch(`/api/admin/leads/${lead.id}/draft-email`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The draft could not be created')

      updateLocal(lead.id, {
        gmail_draft_id: data.draftId,
        gmail_draft_created_at: data.draftedAt,
      })
      setNotice({ tone: 'success', text: `A Gmail draft is ready for ${lead.name} -- review and send from Gmail` })
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'The draft could not be created' })
    } finally {
      setBusyId(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    color: colors.text,
    padding: '9px 11px',
    fontSize: '13px',
    colorScheme: 'dark',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: colors.dim,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '5px',
  }

  const relationLinkStyle: React.CSSProperties = {
    color: colors.blue,
    fontSize: '12px',
    textDecoration: 'none',
    padding: '5px 8px',
    borderRadius: '6px',
    border: `1px solid ${colors.border}`,
    background: colors.surfaceAlt,
  }

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 72px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'end', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: colors.blue, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '11px', fontWeight: 800, margin: '0 0 8px' }}>
            CRM
          </p>
          <h1 style={{ color: colors.text, fontSize: '26px', margin: '0 0 8px' }}>Sales Overview</h1>
          <p style={{ color: colors.muted, fontSize: '14px', lineHeight: 1.6, margin: 0, maxWidth: '650px' }}>
            Track each inquiry through follow-up and proposal preparation. A lead is marked won only after the SOW is signed.
          </p>
        </div>
        <select value={filter} onChange={event => setFilter(event.target.value as Stage | 'all')} style={{ ...inputStyle, width: '185px' }} aria-label="Filter leads by stage">
          <option value="all">All leads</option>
          {STAGES.map(stage => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
        </select>
      </div>

      <section aria-label="Pipeline summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ padding: '15px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.surface }}>
          <span style={{ display: 'block', color: colors.muted, fontSize: '11px', marginBottom: '5px' }}>Open leads</span>
          <strong style={{ color: colors.text, fontSize: '22px' }}>{openLeads.length}</strong>
        </div>
        <div style={{ padding: '15px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.surface }}>
          <span style={{ display: 'block', color: colors.muted, fontSize: '11px', marginBottom: '5px' }}>Open pipeline</span>
          <strong style={{ color: colors.text, fontSize: '22px' }}>{formatCurrency(openValue)}</strong>
        </div>
        <div style={{ padding: '15px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.surface }}>
          <span style={{ display: 'block', color: colors.muted, fontSize: '11px', marginBottom: '5px' }}>Proposals</span>
          <strong style={{ color: colors.text, fontSize: '22px' }}>{counts.proposal}</strong>
        </div>
        <div style={{ padding: '15px', borderRadius: '10px', border: `1px solid ${colors.border}`, background: colors.surface }}>
          <span style={{ display: 'block', color: colors.muted, fontSize: '11px', marginBottom: '5px' }}>Won</span>
          <strong style={{ color: colors.text, fontSize: '22px' }}>{counts.won}</strong>
        </div>
      </section>

      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '6px 11px', borderRadius: '999px', border: `1px solid ${filter === 'all' ? colors.blue : colors.border}`, background: filter === 'all' ? 'rgba(91,168,217,0.14)' : 'transparent', color: filter === 'all' ? colors.blue : colors.muted, cursor: 'pointer', fontSize: '12px' }}>
          All {leads.length}
        </button>
        {STAGES.map(stage => (
          <button key={stage} onClick={() => setFilter(stage)} style={{ padding: '6px 11px', borderRadius: '999px', border: `1px solid ${filter === stage ? stageColors[stage] : colors.border}`, background: filter === stage ? `${stageColors[stage]}18` : 'transparent', color: filter === stage ? stageColors[stage] : colors.muted, cursor: 'pointer', fontSize: '12px' }}>
            {stageLabels[stage]} {counts[stage]}
          </button>
        ))}
      </div>

      {notice && (
        <div role="status" style={{ padding: '11px 14px', marginBottom: '16px', borderRadius: '8px', border: `1px solid ${notice.tone === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(110,231,183,0.28)'}`, background: notice.tone === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(110,231,183,0.08)', color: notice.tone === 'error' ? colors.red : colors.green, fontSize: '13px' }}>
          {notice.text}
        </div>
      )}

      {loading ? (
        <p style={{ color: colors.muted }}>Loading leads…</p>
      ) : visible.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', background: colors.surface, borderRadius: '12px', border: `1px solid ${colors.border}`, color: colors.muted }}>
          No leads in this stage
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {visible.map(lead => {
            const overdue = isOverdue(lead.next_follow_up, lead.stage)
            const locked = lead.stage === 'won'
            return (
              <article id={`lead-${lead.id}`} key={lead.id} style={{ scrollMarginTop: '76px', background: colors.surface, border: `1px solid ${overdue ? 'rgba(248,113,113,0.35)' : colors.border}`, borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                      <h2 style={{ color: colors.text, fontSize: '17px', margin: 0 }}>
                        {lead.name}{lead.organization ? ` · ${lead.organization}` : ''}
                      </h2>
                      <span style={{ color: stageColors[lead.stage], background: `${stageColors[lead.stage]}16`, border: `1px solid ${stageColors[lead.stage]}35`, borderRadius: '999px', padding: '3px 8px', fontSize: '10px', fontWeight: 700 }}>
                        {stageLabels[lead.stage]}
                      </span>
                    </div>
                    <p style={{ color: colors.muted, fontSize: '13px', margin: 0 }}>
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} style={{ color: colors.blue }}>{lead.email}</a>
                      ) : (
                        <span style={{ color: colors.dim, fontStyle: 'italic' }}>No contact email on file</span>
                      )}
                      {lead.phone ? ` · ${lead.phone}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: colors.dim, fontSize: '11px' }}>Lead #{lead.id}</span>
                    <p style={{ color: colors.dim, fontSize: '11px', margin: '3px 0 0' }}>
                      {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '7px', margin: '14px 0 10px', flexWrap: 'wrap' }}>
                  {lead.service && <span style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(91,168,217,0.1)', color: colors.blue, fontSize: '11px' }}>{lead.service}</span>}
                  <span style={{ padding: '4px 8px', borderRadius: '999px', background: colors.surfaceAlt, color: colors.dim, fontSize: '11px' }}>{titleCase(lead.source)}</span>
                  {lead.relationship_status && <span style={{ padding: '4px 8px', borderRadius: '999px', background: colors.surfaceAlt, color: colors.muted, fontSize: '11px' }}>Relationship: {titleCase(lead.relationship_status)}</span>}
                  {lead.project_status && <span style={{ padding: '4px 8px', borderRadius: '999px', background: colors.surfaceAlt, color: colors.muted, fontSize: '11px' }}>Project: {titleCase(lead.project_status)}</span>}
                  {overdue && <span style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(248,113,113,0.1)', color: colors.red, fontSize: '11px', fontWeight: 700 }}>Follow-up overdue</span>}
                </div>
                <p style={{ whiteSpace: 'pre-wrap', color: colors.muted, lineHeight: 1.6, fontSize: '13px', margin: '0 0 18px' }}>{lead.message}</p>

                {locked ? (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(110,231,183,0.2)', background: 'rgba(110,231,183,0.06)', color: colors.green, fontSize: '12px', marginBottom: '14px' }}>
                    Won was recorded automatically after signature. This lead is read-only.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <label>
                        <span style={labelStyle}>Stage</span>
                        <select value={lead.stage} onChange={event => updateLocal(lead.id, { stage: event.target.value as Stage })} style={inputStyle}>
                          {MANUAL_STAGES.map(stage => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
                        </select>
                      </label>
                      <label>
                        <span style={labelStyle}>Estimated value</span>
                        <input type="number" min="0" step="100" value={lead.estimated_value_cents === null ? '' : lead.estimated_value_cents / 100} onChange={event => updateLocal(lead.id, { estimated_value_cents: event.target.value ? Math.round(Number(event.target.value) * 100) : null })} placeholder="USD" style={inputStyle} />
                      </label>
                      <label>
                        <span style={labelStyle}>Next follow-up</span>
                        <input type="date" value={dateInputValue(lead.next_follow_up)} onChange={event => updateLocal(lead.id, { next_follow_up: event.target.value || null })} style={inputStyle} />
                      </label>
                    </div>
                    <label>
                      <span style={labelStyle}>Notes</span>
                      <textarea rows={3} value={lead.notes || ''} onChange={event => updateLocal(lead.id, { notes: event.target.value })} placeholder="Context, next action, or proposal notes" style={{ ...inputStyle, resize: 'vertical' }} />
                    </label>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    {lead.intake_id && <Link href={`/admin/intake#intake-${lead.intake_id}`} style={relationLinkStyle}>Intake #{lead.intake_id}</Link>}
                    {lead.client_id && <Link href={`/admin/clients#client-${lead.client_id}`} style={relationLinkStyle}>Client #{lead.client_id}</Link>}
                    {lead.project_id && <Link href={`/admin/projects#project-${lead.project_id}`} style={relationLinkStyle}>Project #{lead.project_id}</Link>}
                    {lead.gmail_draft_id && (
                      <a href={`https://mail.google.com/mail/u/0/#drafts?compose=${encodeURIComponent(lead.gmail_draft_id)}`} target="_blank" rel="noopener noreferrer" style={relationLinkStyle}>
                        Gmail draft ready
                      </a>
                    )}
                    {!lead.intake_id && !lead.client_id && !lead.project_id && !lead.gmail_draft_id && <span style={{ color: colors.dim, fontSize: '12px' }}>No related records yet</span>}
                  </div>
                  {!locked && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {!lead.project_id && lead.stage !== 'lost' && (
                        <button onClick={() => prepareProposal(lead)} disabled={busyId === lead.id} style={{ padding: '9px 13px', borderRadius: '8px', border: '1px solid rgba(110,231,183,0.3)', background: 'rgba(110,231,183,0.1)', color: colors.green, cursor: busyId === lead.id ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '12px' }}>
                          {busyId === lead.id ? 'Preparing…' : 'Prepare proposal'}
                        </button>
                      )}
                      {lead.email && !lead.gmail_draft_id && (
                        <button onClick={() => draftEmail(lead)} disabled={busyId === lead.id} style={{ padding: '9px 13px', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.1)', color: colors.amber, cursor: busyId === lead.id ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '12px' }}>
                          {busyId === lead.id ? 'Drafting…' : 'Draft email'}
                        </button>
                      )}
                      <button onClick={() => saveLead(lead)} disabled={busyId === lead.id} style={{ padding: '9px 15px', borderRadius: '8px', border: 'none', background: busyId === lead.id ? 'rgba(91,168,217,0.4)' : colors.blue, color: colors.bg, cursor: busyId === lead.id ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '12px' }}>
                        {busyId === lead.id ? 'Saving…' : 'Save lead'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
