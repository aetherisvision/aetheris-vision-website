'use client'

import { useEffect, useState } from 'react'

const dark = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  surfaceHover: '#112338',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6',
  blueGlow: 'rgba(59,130,246,0.15)',
  success: 'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.25)',
  successText: '#6ee7b7',
  danger: 'rgba(220,38,38,0.12)',
  dangerText: '#f87171',
  dangerBorder: 'rgba(220,38,38,0.25)',
  dangerSolid: '#dc2626',
}

interface Client {
  id: number
  name: string
  contact_name: string
  email: string
  phone: string | null
  created_at: string
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '' })

  async function fetchClients() {
    const r = await fetch('/api/admin/clients')
    const data = await r.json()
    setClients(data.clients ?? [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchClients() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ name: '', contact_name: '', email: '', phone: '' })
    setSaving(false)
    fetchClients()
  }

  async function handleDelete(clientId: number) {
    setDeleting(clientId)
    await fetch(`/api/admin/clients/${clientId}`, { method: 'DELETE' })
    setClients(cs => cs.filter(c => c.id !== clientId))
    setDeleting(null)
    setConfirmDelete(null)
  }

  async function handleInvite(clientId: number, email: string) {
    setInviting(clientId)
    await fetch('/api/admin/clients/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setInviting(null)
    setSuccessMsg(`Login link sent to ${email}`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  async function handleViewAs(clientId: number) {
    await fetch('/api/admin/clients/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    window.open('/client/dashboard', '_blank')
  }

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '10px 13px', borderRadius: '8px',
    border: `1px solid ${dark.border}`, fontSize: '14px',
    color: dark.text, background: 'rgba(255,255,255,0.04)',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: '700',
    color: dark.textDim, marginBottom: '6px',
    letterSpacing: '0.08em', textTransform: 'uppercase',
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, marginBottom: '6px' }}>
        Client Management
      </h1>
      <p style={{ color: dark.textMuted, marginBottom: '32px', fontSize: '14px' }}>
        Add clients here to give them access to the client portal.
        Use &quot;Send invite&quot; to email them a login link.
      </p>

      {/* Add client form */}
      <div style={{ background: dark.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${dark.border}`, marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: dark.text, marginBottom: '18px' }}>Add New Client</h2>
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Business name *</label>
            <input required style={inputStyle} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Contact name *</label>
            <input required style={inputStyle} value={form.contact_name}
              onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Email address *</label>
            <input required type="email" style={inputStyle} value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" style={inputStyle} value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                background: saving ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: '#fff', fontWeight: '600', fontSize: '14px',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
              }}
            >
              {saving ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>

      {successMsg && (
        <div style={{
          background: dark.success, color: dark.successText,
          border: `1px solid ${dark.successBorder}`,
          padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
        }}>
          {successMsg}
        </div>
      )}

      {/* Client list */}
      <h2 style={{ fontSize: '14px', fontWeight: '600', color: dark.text, marginBottom: '12px' }}>Clients</h2>
      {loading ? (
        <p style={{ color: dark.textMuted }}>Loading…</p>
      ) : clients.length === 0 ? (
        <p style={{ color: dark.textDim }}>No clients yet. Add one above.</p>
      ) : (
        <div style={{ background: dark.surface, borderRadius: '12px', border: `1px solid ${dark.border}`, overflow: 'hidden' }}>
          {clients.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', flexWrap: 'wrap', gap: '8px',
              borderTop: i === 0 ? 'none' : `1px solid ${dark.borderLight}`,
            }}>
              <div>
                <p style={{ fontWeight: '600', color: dark.text, margin: '0 0 2px', fontSize: '15px' }}>{c.name}</p>
                <p style={{ color: dark.textMuted, fontSize: '13px', margin: 0 }}>{c.contact_name} · {c.email}{c.phone ? ` · ${c.phone}` : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleViewAs(c.id)}
                  style={{ padding: '8px 14px', borderRadius: '7px', border: `1px solid ${dark.border}`, background: 'rgba(255,255,255,0.04)', color: dark.textMuted, fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                >
                  View as client
                </button>
                <button
                  onClick={() => handleInvite(c.id, c.email)}
                  disabled={inviting === c.id}
                  style={{ padding: '8px 14px', borderRadius: '7px', border: `1px solid ${dark.border}`, background: 'rgba(59,130,246,0.1)', color: dark.blue, fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                >
                  {inviting === c.id ? 'Sending…' : 'Send invite'}
                </button>
                {confirmDelete === c.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: dark.dangerText }}>Delete client?</span>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                      style={{ padding: '7px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '700', background: dark.dangerSolid, color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      {deleting === c.id ? '…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '12px', color: dark.textMuted, background: 'transparent', border: `1px solid ${dark.border}`, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(c.id)}
                    style={{ padding: '8px 12px', borderRadius: '7px', border: `1px solid ${dark.dangerBorder}`, background: dark.danger, color: dark.dangerText, fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
