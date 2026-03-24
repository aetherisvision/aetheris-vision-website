'use client'

import { useEffect, useState } from 'react'

const dark = {
  surface: '#0d1b2e',
  border: 'rgba(255,255,255,0.08)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6',
  activeNav: 'rgba(59,130,246,0.15)',
  successText: '#6ee7b7',
  success: 'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.25)',
  warn: 'rgba(245,158,11,0.12)',
  warnText: '#fbbf24',
  warnBorder: 'rgba(245,158,11,0.25)',
  danger: 'rgba(220,38,38,0.12)',
  dangerText: '#f87171',
  dangerBorder: 'rgba(220,38,38,0.25)',
  dangerSolid: '#dc2626',
}

interface Client { id: number; name: string; email: string }
interface Project { id: number; name: string; client_id: number }

interface Invoice {
  id: number
  number: string
  client_name: string
  client_email: string
  project_name: string | null
  description: string
  amount_cents: number
  status: string
  stripe_invoice_url: string | null
  due_date: string | null
  paid_at: string | null
  created_at: string
}

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  draft:   { color: dark.textMuted,  bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  sent:    { color: dark.warnText,   bg: dark.warn,   border: dark.warnBorder   },
  paid:    { color: dark.successText, bg: dark.success, border: dark.successBorder },
  overdue: { color: dark.dangerText, bg: dark.danger,  border: dark.dangerBorder  },
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [sending, setSending] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // New invoice form
  const [form, setForm] = useState({
    client_id: '',
    project_id: '',
    description: '',
    amount: '',
    due_date: '',
  })
  const [creating, setCreating] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/invoices').then(r => r.json()),
      fetch('/api/admin/clients').then(r => r.json()),
      fetch('/api/admin/projects').then(r => r.json()),
    ]).then(([invData, clientData, projData]) => {
      setInvoices(invData.invoices ?? [])
      setClients(clientData.clients ?? [])
      setProjects(projData.projects ?? [])
      setLoading(false)
    })
  }, [])

  async function handleCreate() {
    if (!form.client_id || !form.description || !form.amount) return
    setCreating(true)
    const amount_cents = Math.round(parseFloat(form.amount) * 100)
    const res = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Number(form.client_id),
        project_id: form.project_id ? Number(form.project_id) : null,
        description: form.description,
        amount_cents,
        due_date: form.due_date || null,
      }),
    })
    const data = await res.json()
    if (data.invoice) {
      // Re-fetch to get joined client_name etc.
      const fresh = await fetch('/api/admin/invoices').then(r => r.json())
      setInvoices(fresh.invoices ?? [])
      setForm({ client_id: '', project_id: '', description: '', amount: '', due_date: '' })
      setShowNew(false)
      showToast('Invoice created')
    }
    setCreating(false)
  }

  async function handleSend(id: number) {
    setSending(id)
    const res = await fetch(`/api/admin/invoices/${id}/send`, { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      setInvoices(inv => inv.map(i => i.id === id ? { ...i, status: 'sent', stripe_invoice_url: data.invoice_url ?? i.stripe_invoice_url } : i))
      showToast('Invoice sent to client')
    } else {
      showToast(data.error ?? 'Failed to send')
    }
    setSending(null)
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    await fetch(`/api/admin/invoices/${id}`, { method: 'DELETE' })
    setInvoices(inv => inv.filter(i => i.id !== id))
    setDeleting(null)
    setConfirmDelete(null)
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '7px',
    border: `1px solid ${dark.border}`,
    fontSize: '14px', color: dark.text,
    background: 'rgba(255,255,255,0.04)',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    colorScheme: 'dark',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: '600',
    color: dark.textDim, marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  }

  const clientProjects = projects.filter(p => String(p.client_id) === form.client_id)

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#1e3a5f', border: `1px solid ${dark.blue}`, color: dark.text, padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '500', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, margin: '0 0 4px' }}>Invoices</h1>
          <p style={{ color: dark.textMuted, fontSize: '14px', margin: 0 }}>Create and send invoices to clients via Stripe.</p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
        >
          + New Invoice
        </button>
      </div>

      {/* New invoice form */}
      {showNew && (
        <div style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
          <h2 style={{ color: dark.text, fontSize: '16px', fontWeight: '700', margin: '0 0 20px' }}>New Invoice</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Client *</label>
              <select style={inputStyle} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Project (optional)</label>
              <select style={inputStyle} value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} disabled={!form.client_id}>
                <option value="">None</option>
                {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount (USD) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" style={inputStyle} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" style={inputStyle} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Description *</label>
            <input type="text" placeholder="e.g. Website development — Phase 1" style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreate}
              disabled={creating || !form.client_id || !form.description || !form.amount}
              style={{ padding: '9px 22px', borderRadius: '8px', background: creating ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer' }}
            >
              {creating ? 'Creating…' : 'Create Invoice'}
            </button>
            <button onClick={() => setShowNew(false)} style={{ padding: '9px 16px', borderRadius: '8px', background: 'transparent', color: dark.textMuted, fontSize: '14px', border: `1px solid ${dark.border}`, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <p style={{ color: dark.textMuted }}>Loading…</p>
      ) : invoices.length === 0 ? (
        <div style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: dark.textDim, fontSize: '15px', margin: 0 }}>No invoices yet. Create one above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {invoices.map(inv => {
            const s = STATUS_STYLE[inv.status] ?? STATUS_STYLE.draft
            return (
              <div key={inv.id} style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: dark.text }}>{inv.number}</span>
                    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', color: s.color, background: s.bg, border: `1px solid ${s.border}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {inv.status}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: dark.blue }}>{fmt(inv.amount_cents)}</span>
                  </div>
                  <p style={{ color: dark.textMuted, fontSize: '13px', margin: '0 0 2px' }}>{inv.client_name}{inv.project_name ? ` · ${inv.project_name}` : ''}</p>
                  <p style={{ color: dark.textDim, fontSize: '12px', margin: 0 }}>
                    {inv.description}
                    {inv.due_date && <> · Due {fmtDate(inv.due_date)}</>}
                    {inv.paid_at && <> · Paid {fmtDate(inv.paid_at)}</>}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {inv.stripe_invoice_url && (
                    <a href={inv.stripe_invoice_url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '500', color: dark.blue, background: dark.activeNav, border: `1px solid rgba(59,130,246,0.25)`, textDecoration: 'none' }}>
                      View →
                    </a>
                  )}

                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => handleSend(inv.id)}
                      disabled={sending === inv.id}
                      style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '600', background: sending === inv.id ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      {sending === inv.id ? 'Sending…' : inv.status === 'draft' ? 'Send to Client' : 'Resend'}
                    </button>
                  )}

                  {confirmDelete === inv.id ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: dark.dangerText }}>Delete?</span>
                      <button onClick={() => handleDelete(inv.id)} disabled={deleting === inv.id}
                        style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', background: dark.dangerSolid, color: '#fff', border: 'none', cursor: 'pointer' }}>
                        {deleting === inv.id ? '…' : 'Yes'}
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', color: dark.textMuted, background: 'transparent', border: `1px solid ${dark.border}`, cursor: 'pointer' }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(inv.id)}
                      style={{ padding: '7px 12px', borderRadius: '7px', fontSize: '13px', background: dark.danger, color: dark.dangerText, border: `1px solid ${dark.dangerBorder}`, cursor: 'pointer', fontWeight: '500' }}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
