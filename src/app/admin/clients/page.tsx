'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const dark = {
  surface: '#0d1b2e',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.3)',
  blue: '#5BA8D9',
  success: 'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.25)',
  successText: '#6ee7b7',
  danger: 'rgba(220,38,38,0.12)',
  dangerText: '#f87171',
  dangerBorder: 'rgba(220,38,38,0.25)',
  dangerSolid: '#dc2626',
}

type RelationshipStatus = 'prospect' | 'active' | 'on_hold' | 'complete' | 'archived'
type Filter = 'all' | RelationshipStatus

interface Client {
  id: number
  name: string
  contact_name: string
  email: string
  phone: string | null
  relationship_status?: RelationshipStatus | null
  next_touch?: string | null
  notes?: string | null
  lead_id?: number | null
  intake_id?: number | null
  project_id?: number | null
  project_status?: string | null
  created_at: string
}

interface ClientDraft {
  relationship_status: RelationshipStatus
  next_touch: string
  notes: string
}

const RELATIONSHIP_OPTIONS: Array<{ value: RelationshipStatus; label: string }> = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'complete', label: 'Complete' },
  { value: 'archived', label: 'Archived' },
]

const STATUS_COLORS: Record<RelationshipStatus, { background: string; color: string; border: string }> = {
  prospect: { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  active: { background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
  on_hold: { background: 'rgba(91,168,217,0.1)', color: '#7dd3fc', border: 'rgba(91,168,217,0.25)' },
  complete: { background: 'rgba(167,139,250,0.1)', color: '#c4b5fd', border: 'rgba(167,139,250,0.25)' },
  archived: { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.1)' },
}

function relationshipStatus(client: Client): RelationshipStatus {
  return client.relationship_status ?? 'prospect'
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string' &&
      body.error.trim()
    ) {
      return body.error
    }
  } catch {
    // The fallback remains safe when an upstream returns an empty or non-JSON response.
  }
  return fallback
}

function projectLinkLabel(status: string | null | undefined): string {
  switch (status) {
    case 'proposal': return 'Proposal'
    case 'signed': return 'Signed project'
    case 'active': return 'Active project'
    case 'canceled': return 'Canceled project'
    default: return 'Project'
  }
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [editingClient, setEditingClient] = useState<number | null>(null)
  const [updatingClient, setUpdatingClient] = useState<number | null>(null)
  const [clientDraft, setClientDraft] = useState<ClientDraft | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '' })

  async function fetchClients() {
    try {
      const response = await fetch('/api/admin/clients')
      if (!response.ok) throw new Error(await readApiError(response, 'Unable to load client relationships'))
      const data = await response.json()
      const nextClients: Client[] = data.clients ?? []
      setClients(nextClients)
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load client relationships' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error(await readApiError(response, 'The prospect could not be added'))
      setForm({ name: '', contact_name: '', email: '', phone: '' })
      setNotice({ type: 'success', text: 'Prospect added' })
      await fetchClients()
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'The prospect could not be added' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(clientId: number) {
    setDeleting(clientId)
    setNotice(null)
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await readApiError(response, 'The prospect could not be deleted'))
      setClients(current => current.filter(client => client.id !== clientId))
      setConfirmDelete(null)
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'The prospect could not be deleted' })
    } finally {
      setDeleting(null)
    }
  }

  async function handleInvite(clientId: number, email: string) {
    setInviting(clientId)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/clients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error(await readApiError(response, 'The portal invitation could not be sent'))
      setNotice({ type: 'success', text: `Login link sent to ${email}` })
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'The portal invitation could not be sent' })
    } finally {
      setInviting(null)
    }
  }

  async function handleViewAs(clientId: number) {
    setNotice(null)
    const response = await fetch('/api/admin/clients/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    if (response.ok) window.open('/client/dashboard', '_blank', 'noopener,noreferrer')
    else setNotice({ type: 'error', text: await readApiError(response, 'The client portal could not be opened') })
  }

  function startEditing(client: Client) {
    setEditingClient(client.id)
    setConfirmDelete(null)
    setClientDraft({
      relationship_status: relationshipStatus(client),
      next_touch: client.next_touch?.slice(0, 10) ?? '',
      notes: client.notes ?? '',
    })
  }

  function stopEditing() {
    setEditingClient(null)
    setClientDraft(null)
  }

  async function handleUpdate(clientId: number) {
    if (!clientDraft) return

    setUpdatingClient(clientId)
    setNotice(null)
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship_status: clientDraft.relationship_status,
          next_touch: clientDraft.next_touch || null,
          notes: clientDraft.notes || null,
        }),
      })
      if (!response.ok) throw new Error(await readApiError(response, 'The relationship could not be updated'))

      const body: { client?: Partial<Client> } = await response.json()
      if (!body.client) throw new Error('The server returned an incomplete client record')
      setClients(current => current.map(client => (
        client.id === clientId ? { ...client, ...body.client } : client
      )))
      setNotice({ type: 'success', text: 'Relationship updated' })
      stopEditing()
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'The relationship could not be updated' })
    } finally {
      setUpdatingClient(null)
    }
  }

  const visibleClients = useMemo(
    () => filter === 'all' ? clients : clients.filter(client => relationshipStatus(client) === filter),
    [clients, filter],
  )

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${dark.border}`,
    borderRadius: '8px',
    boxSizing: 'border-box',
    color: dark.text,
    display: 'block',
    fontSize: '16px',
    outline: 'none',
    padding: '10px 13px',
    width: '100%',
  }

  const labelStyle: React.CSSProperties = {
    color: dark.textDim,
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    textTransform: 'uppercase',
  }

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, margin: '0 0 6px' }}>Client Relationships</h1>
      <p style={{ color: dark.textMuted, margin: '0 0 30px', fontSize: '14px', maxWidth: '680px', lineHeight: 1.6 }}>
        Prospects created while preparing a proposal remain distinct from active clients. Portal access is intended for signed engagements.
      </p>

      <section style={{ background: dark.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${dark.border}`, marginBottom: '28px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: dark.text, margin: '0 0 18px' }}>Add a prospect directly</h2>
        <form onSubmit={handleAdd} className="client-form">
          <div>
            <label style={labelStyle}>Business name</label>
            <input required style={inputStyle} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Contact name</label>
            <input required style={inputStyle} value={form.contact_name} onChange={event => setForm(current => ({ ...current, contact_name: event.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Email address</label>
            <input required type="email" style={inputStyle} value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" style={inputStyle} value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} />
          </div>
          <div className="client-form-submit">
            <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', background: saving ? 'rgba(91,168,217,0.4)' : 'linear-gradient(135deg, #486890, #5BA8D9)', color: '#fff', fontWeight: '600', fontSize: '14px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Add prospect'}
            </button>
          </div>
        </form>
      </section>

      {notice && (
        <div role="status" style={{ background: notice.type === 'success' ? dark.success : dark.danger, color: notice.type === 'success' ? dark.successText : dark.dangerText, border: `1px solid ${notice.type === 'success' ? dark.successBorder : dark.dangerBorder}`, padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {notice.text}
        </div>
      )}

      <div className="client-list-heading">
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: dark.text, margin: 0 }}>Relationships</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(['all', 'prospect', 'active', 'on_hold', 'complete', 'archived'] as Filter[]).map(value => (
            <button key={value} type="button" onClick={() => setFilter(value)} style={{ padding: '6px 10px', borderRadius: '999px', border: `1px solid ${filter === value ? 'rgba(91,168,217,0.35)' : dark.border}`, background: filter === value ? 'rgba(91,168,217,0.12)' : 'transparent', color: filter === value ? dark.blue : dark.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              {value === 'all' ? 'All' : RELATIONSHIP_OPTIONS.find(option => option.value === value)?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: dark.textMuted }}>Loading…</p>
      ) : visibleClients.length === 0 ? (
        <div style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '26px', color: dark.textDim, fontSize: '14px' }}>
          No relationships match this view.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {visibleClients.map(client => {
            const status = relationshipStatus(client)
            const portalAvailable = status !== 'prospect' && status !== 'archived'
            const canDelete = status === 'prospect' && !client.lead_id && !client.intake_id && !client.project_id
            const isEditing = editingClient === client.id && clientDraft !== null
            return (
              <article id={`client-${client.id}`} key={client.id} style={{ scrollMarginTop: '120px', background: dark.surface, borderRadius: '12px', border: `1px solid ${dark.border}`, padding: '20px' }}>
                <div className="client-card-header">
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                      <h3 style={{ fontWeight: '650', color: dark.text, margin: 0, fontSize: '16px' }}>{client.name}</h3>
                      <span style={{ ...STATUS_COLORS[status], borderWidth: '1px', borderStyle: 'solid', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', fontWeight: '700' }}>
                        {RELATIONSHIP_OPTIONS.find(option => option.value === status)?.label}
                      </span>
                    </div>
                    <p style={{ color: dark.textMuted, fontSize: '13px', margin: 0, lineHeight: 1.55 }}>
                      {client.contact_name} · {client.email}{client.phone ? ` · ${client.phone}` : ''}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', fontSize: '12px' }}>
                      {client.lead_id && <Link href={`/admin/leads#lead-${client.lead_id}`} style={{ color: dark.blue }}>Lead #{client.lead_id}</Link>}
                      {client.intake_id && <Link href={`/admin/intake#intake-${client.intake_id}`} style={{ color: dark.blue }}>Intake #{client.intake_id}</Link>}
                      {client.project_id && <Link href={`/admin/projects#project-${client.project_id}`} style={{ color: dark.blue }}>{projectLinkLabel(client.project_status)} #{client.project_id}</Link>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {portalAvailable ? (
                      <>
                        <button type="button" onClick={() => handleViewAs(client.id)} style={{ padding: '8px 12px', borderRadius: '7px', border: `1px solid ${dark.border}`, background: 'rgba(255,255,255,0.04)', color: dark.textMuted, fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>View portal</button>
                        <button type="button" onClick={() => handleInvite(client.id, client.email)} disabled={inviting === client.id} style={{ padding: '8px 12px', borderRadius: '7px', border: `1px solid rgba(91,168,217,0.25)`, background: 'rgba(91,168,217,0.1)', color: dark.blue, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                          {inviting === client.id ? 'Sending…' : 'Send login link'}
                        </button>
                      </>
                    ) : status === 'prospect' ? (
                      <span style={{ color: dark.textDim, fontSize: '12px' }}>Portal pending signed SOW</span>
                    ) : null}
                    <button type="button" onClick={() => isEditing ? stopEditing() : startEditing(client)} style={{ padding: '8px 12px', borderRadius: '7px', border: `1px solid ${dark.border}`, background: isEditing ? 'rgba(91,168,217,0.12)' : 'rgba(255,255,255,0.04)', color: isEditing ? dark.blue : dark.textMuted, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                      {isEditing ? 'Close' : 'Manage'}
                    </button>
                  </div>
                </div>

                <div className="client-details">
                  {isEditing ? (
                    <div className="client-edit-form">
                      <div>
                        <label style={labelStyle}>Relationship stage</label>
                        <select style={inputStyle} value={clientDraft.relationship_status} onChange={event => setClientDraft(current => current ? { ...current, relationship_status: event.target.value as RelationshipStatus } : current)}>
                          {RELATIONSHIP_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Next follow-up</label>
                        <input type="date" style={inputStyle} value={clientDraft.next_touch} onChange={event => setClientDraft(current => current ? { ...current, next_touch: event.target.value } : current)} />
                      </div>
                      <div className="client-edit-notes">
                        <label style={labelStyle}>Internal notes</label>
                        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={clientDraft.notes} onChange={event => setClientDraft(current => current ? { ...current, notes: event.target.value } : current)} />
                      </div>
                      <div className="client-edit-actions">
                        <button type="button" onClick={() => handleUpdate(client.id)} disabled={updatingClient === client.id} style={{ padding: '9px 14px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg, #486890, #5BA8D9)', color: '#fff', fontSize: '13px', cursor: updatingClient === client.id ? 'not-allowed' : 'pointer', fontWeight: '700' }}>{updatingClient === client.id ? 'Saving…' : 'Save changes'}</button>
                        <button type="button" onClick={stopEditing} style={{ padding: '9px 12px', borderRadius: '7px', border: `1px solid ${dark.border}`, background: 'transparent', color: dark.textMuted, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="client-summary">
                        {client.next_touch && (
                          <span>
                            <strong>Next follow-up</strong>{' '}
                            {new Date(`${client.next_touch.slice(0, 10)}T12:00:00`).toLocaleDateString()}
                          </span>
                        )}
                        {client.notes && <span><strong>Notes</strong> {client.notes}</span>}
                        {!client.next_touch && !client.notes && (
                          <span>{status === 'prospect' ? 'Relationship activates after the SOW is signed' : 'No relationship notes recorded'}</span>
                        )}
                      </div>
                      {canDelete && (
                        <div className="client-actions">
                          {confirmDelete === client.id ? (
                            <>
                              <span style={{ fontSize: '12px', color: dark.dangerText }}>Delete this unused prospect?</span>
                              <button type="button" onClick={() => handleDelete(client.id)} disabled={deleting === client.id} style={{ padding: '7px 11px', borderRadius: '7px', fontSize: '12px', fontWeight: '700', background: dark.dangerSolid, color: '#fff', border: 'none', cursor: 'pointer' }}>{deleting === client.id ? 'Deleting…' : 'Confirm'}</button>
                              <button type="button" onClick={() => setConfirmDelete(null)} style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '12px', color: dark.textMuted, background: 'transparent', border: `1px solid ${dark.border}`, cursor: 'pointer' }}>Cancel</button>
                            </>
                          ) : (
                            <button type="button" onClick={() => setConfirmDelete(client.id)} style={{ padding: '8px 12px', borderRadius: '7px', border: `1px solid ${dark.dangerBorder}`, background: dark.danger, color: dark.dangerText, fontSize: '12px', cursor: 'pointer', fontWeight: '500', marginLeft: 'auto' }}>Delete unused prospect</button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .client-form {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .client-form-submit {
          grid-column: 1 / -1;
        }
        .client-list-heading,
        .client-card-header {
          align-items: center;
          display: flex;
          gap: 14px;
          justify-content: space-between;
        }
        .client-list-heading {
          margin-bottom: 12px;
        }
        .client-details {
          border-top: 1px solid ${dark.borderLight};
          align-items: center;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 16px;
        }
        .client-summary {
          color: ${dark.textDim};
          display: flex;
          flex-direction: column;
          font-size: 12px;
          gap: 5px;
          line-height: 1.5;
        }
        .client-summary strong {
          color: ${dark.textMuted};
        }
        .client-edit-form {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
        }
        .client-edit-notes,
        .client-edit-actions {
          grid-column: 1 / -1;
        }
        .client-edit-actions {
          display: flex;
          gap: 8px;
        }
        .client-actions {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        @media (max-width: 700px) {
          .client-form {
            grid-template-columns: 1fr;
          }
          .client-form-submit {
            grid-column: 1;
          }
          .client-list-heading,
          .client-card-header,
          .client-details {
            align-items: flex-start;
            flex-direction: column;
          }
          .client-edit-form {
            grid-template-columns: 1fr;
          }
          .client-edit-notes,
          .client-edit-actions {
            grid-column: 1;
          }
        }
      `}</style>
    </main>
  )
}
