'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const dark = {
  surface: '#0d1b2e',
  border: 'rgba(255,255,255,0.08)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.3)',
  blue: '#5BA8D9',
  activeNav: 'rgba(91,168,217,0.15)',
  successText: '#6ee7b7',
  danger: 'rgba(220,38,38,0.12)',
  dangerText: '#f87171',
  dangerBorder: 'rgba(220,38,38,0.25)',
  dangerSolid: '#dc2626',
}

const PHASES = [
  { key: 'proposal', label: 'Proposal', dateField: 'phase_proposal_date' },
  { key: 'kickoff', label: 'Kickoff', dateField: 'phase_kickoff_date' },
  { key: 'design', label: 'Design', dateField: 'phase_design_date' },
  { key: 'development', label: 'Development', dateField: 'phase_development_date' },
  { key: 'review', label: 'Review', dateField: 'phase_review_date' },
  { key: 'launched', label: 'Launched', dateField: 'phase_launched_date' },
] as const

type Lifecycle = 'proposal' | 'signed' | 'active' | 'complete' | 'archived'
type ProjectFilter = 'all' | Lifecycle

interface Project {
  id: number
  name: string
  client_name: string
  client_id?: number | null
  lead_id?: number | null
  intake_id?: number | null
  status?: string | null
  signed_at?: string | null
  can_delete?: boolean
  current_phase: string
  phase_proposal_date: string | null
  phase_kickoff_date: string | null
  phase_design_date: string | null
  phase_development_date: string | null
  phase_review_date: string | null
  phase_launched_date: string | null
}

const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  proposal: 'Proposal',
  signed: 'Signed',
  active: 'Active',
  complete: 'Complete',
  archived: 'Archived',
}

const LIFECYCLE_COLORS: Record<Lifecycle, { background: string; color: string; border: string }> = {
  proposal: { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  signed: { background: 'rgba(167,139,250,0.1)', color: '#c4b5fd', border: 'rgba(167,139,250,0.25)' },
  active: { background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
  complete: { background: 'rgba(91,168,217,0.1)', color: '#7dd3fc', border: 'rgba(91,168,217,0.25)' },
  archived: { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.1)' },
}

function projectLifecycle(project: Project): Lifecycle {
  if (project.status === 'archived') return 'archived'
  if (project.status === 'complete' || project.status === 'completed') return 'complete'
  if (project.status === 'active') return 'active'
  if (project.status === 'signed' || project.signed_at) return 'signed'
  if (!project.status && project.current_phase !== 'proposal') return 'active'
  return 'proposal'
}

function toDateInput(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10) : ''
}

function toIso(date: string) {
  return date ? new Date(`${date}T12:00:00.000Z`).toISOString() : null
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [edits, setEdits] = useState<Record<number, Partial<Project>>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/projects')
      .then(response => {
        if (!response.ok) throw new Error('Unable to load projects')
        return response.json()
      })
      .then(data => setProjects(data.projects ?? []))
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Unable to load projects'))
      .finally(() => setLoading(false))
  }, [])

  function getField(project: Project, field: string): string {
    const override = edits[project.id]
    if (override && field in override) return (override as Record<string, string | null>)[field] ?? ''
    return (project as unknown as Record<string, string | null>)[field] ?? ''
  }

  function setField(projectId: number, field: string, value: string) {
    setEdits(current => ({ ...current, [projectId]: { ...current[projectId], [field]: value } }))
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    setError('')
    try {
      const response = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('The project could not be deleted')
      setProjects(current => current.filter(project => project.id !== id))
      setConfirmDelete(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The project could not be deleted')
    } finally {
      setDeleting(null)
    }
  }

  async function handleSave(project: Project) {
    const changes = edits[project.id]
    if (!changes || Object.keys(changes).length === 0) return

    setSaving(project.id)
    setError('')
    const patch: Record<string, string | number | null> = { id: project.id }
    for (const [key, value] of Object.entries(changes)) {
      patch[key] = key.startsWith('phase_') && key.endsWith('_date')
        ? toIso(value as string)
        : value as string
    }

    try {
      const response = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!response.ok) throw new Error('The project timeline could not be updated')
      setProjects(current => current.map(item => item.id === project.id
        ? { ...item, ...changes, ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, key.endsWith('_date') ? toIso(value as string) : value])) }
        : item))
      setEdits(current => {
        const next = { ...current }
        delete next[project.id]
        return next
      })
      setSaved(project.id)
      window.setTimeout(() => setSaved(null), 2000)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The project timeline could not be updated')
    } finally {
      setSaving(null)
    }
  }

  const visibleProjects = useMemo(
    () => filter === 'all' ? projects : projects.filter(project => projectLifecycle(project) === filter),
    [filter, projects],
  )

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${dark.border}`,
    borderRadius: '6px',
    boxSizing: 'border-box',
    color: dark.text,
    colorScheme: 'dark',
    fontSize: '13px',
    outline: 'none',
    padding: '7px 10px',
    width: '100%',
  }

  const labelStyle: React.CSSProperties = {
    color: dark.textDim,
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    textTransform: 'uppercase',
  }

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, margin: '0 0 5px' }}>Projects & Proposals</h1>
      <p style={{ color: dark.textMuted, margin: '0 0 24px', fontSize: '14px', maxWidth: '700px', lineHeight: 1.6 }}>
        Proposal records remain separate from signed and active work. Maintain delivery milestones here after the engagement begins.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
        {(['all', 'proposal', 'signed', 'active', 'complete', 'archived'] as ProjectFilter[]).map(value => (
          <button key={value} type="button" onClick={() => setFilter(value)} style={{ padding: '7px 11px', borderRadius: '999px', border: `1px solid ${filter === value ? 'rgba(91,168,217,0.35)' : dark.border}`, background: filter === value ? dark.activeNav : 'transparent', color: filter === value ? dark.blue : dark.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
            {value === 'all' ? `All ${projects.length}` : `${LIFECYCLE_LABELS[value]} ${projects.filter(project => projectLifecycle(project) === value).length}`}
          </button>
        ))}
      </div>

      {error && <div role="alert" style={{ color: dark.dangerText, background: dark.danger, border: `1px solid ${dark.dangerBorder}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      {loading ? <p style={{ color: dark.textMuted }}>Loading…</p> : visibleProjects.length === 0 ? (
        <div style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '26px', color: dark.textDim, fontSize: '14px' }}>No projects match this view.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {visibleProjects.map(project => {
            const lifecycle = projectLifecycle(project)
            return (
              <article id={`project-${project.id}`} key={project.id} style={{ scrollMarginTop: '120px', background: dark.surface, borderRadius: '12px', border: `1px solid ${dark.border}`, padding: '22px' }}>
                <div className="project-header">
                  <div>
                    <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '3px' }}>
                      <h2 style={{ fontWeight: '700', color: dark.text, margin: 0, fontSize: '16px' }}>{project.name}</h2>
                      <span style={{ ...LIFECYCLE_COLORS[lifecycle], borderStyle: 'solid', borderWidth: '1px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', padding: '3px 8px' }}>{LIFECYCLE_LABELS[lifecycle]}</span>
                    </div>
                    <p style={{ color: dark.textMuted, fontSize: '13px', margin: 0 }}>{project.client_name}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', fontSize: '12px' }}>
                      {project.lead_id && <Link href={`/admin/leads#lead-${project.lead_id}`} style={{ color: dark.blue }}>Lead #{project.lead_id}</Link>}
                      {project.intake_id && <Link href={`/admin/intake#intake-${project.intake_id}`} style={{ color: dark.blue }}>Intake #{project.intake_id}</Link>}
                      {project.client_id && <Link href={`/admin/clients#client-${project.client_id}`} style={{ color: dark.blue }}>{lifecycle === 'proposal' ? 'Prospect' : 'Client'} #{project.client_id}</Link>}
                      {project.signed_at && <span style={{ color: dark.textDim }}>Signed {new Date(project.signed_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {saved === project.id && <span style={{ color: dark.successText, fontSize: '12px' }}>Saved</span>}
                    <button type="button" onClick={() => handleSave(project)} disabled={saving === project.id || !edits[project.id]} style={{ padding: '8px 15px', borderRadius: '8px', background: saving === project.id || !edits[project.id] ? 'rgba(91,168,217,0.25)' : 'linear-gradient(135deg, #486890, #5BA8D9)', color: '#fff', fontWeight: '600', fontSize: '13px', border: 'none', cursor: saving === project.id || !edits[project.id] ? 'not-allowed' : 'pointer' }}>
                      {saving === project.id ? 'Saving…' : 'Save timeline'}
                    </button>
                    {project.can_delete && (confirmDelete === project.id ? (
                      <>
                        <span style={{ fontSize: '12px', color: dark.dangerText }}>Delete this unused proposal?</span>
                        <button type="button" onClick={() => handleDelete(project.id)} disabled={deleting === project.id} style={{ padding: '7px 11px', borderRadius: '7px', fontSize: '12px', fontWeight: '700', background: dark.dangerSolid, color: '#fff', border: 'none', cursor: 'pointer' }}>{deleting === project.id ? 'Deleting…' : 'Confirm'}</button>
                        <button type="button" onClick={() => setConfirmDelete(null)} style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '12px', color: dark.textMuted, background: 'transparent', border: `1px solid ${dark.border}`, cursor: 'pointer' }}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setConfirmDelete(project.id)} style={{ padding: '8px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', background: dark.danger, color: dark.dangerText, border: `1px solid ${dark.dangerBorder}`, cursor: 'pointer' }}>Delete unused proposal</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Current phase</label>
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    {PHASES.map(phase => {
                      const active = (getField(project, 'current_phase') || project.current_phase) === phase.key
                      return (
                        <button key={phase.key} type="button" onClick={() => setField(project.id, 'current_phase', phase.key)} style={{ padding: '6px 13px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: `1.5px solid ${active ? dark.blue : dark.border}`, background: active ? dark.activeNav : 'rgba(255,255,255,0.03)', color: active ? dark.blue : dark.textMuted, cursor: 'pointer' }}>
                          {phase.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Milestone dates</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '11px' }}>
                    {PHASES.map(phase => (
                      <div key={phase.key}>
                        <label style={{ display: 'block', fontSize: '12px', color: dark.textDim, marginBottom: '4px' }}>{phase.label}</label>
                        <input type="date" style={inputStyle} value={toDateInput(getField(project, phase.dateField))} onChange={event => setField(project.id, phase.dateField, event.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .project-header {
          align-items: flex-start;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        @media (max-width: 620px) {
          .project-header {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  )
}
