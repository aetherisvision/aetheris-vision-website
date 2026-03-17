'use client'

import { useEffect, useState } from 'react'

const dark = {
  surface: '#0d1b2e',
  surfaceAlt: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6',
  blueTag: 'rgba(59,130,246,0.15)',
  blueTagText: '#93c5fd',
  danger: 'rgba(220,38,38,0.15)',
  dangerText: '#f87171',
  dangerBorder: 'rgba(220,38,38,0.25)',
  successText: '#6ee7b7',
}

interface Client { id: number; name: string }
interface Doc { id: number; client_id: number; client_name: string; title: string; updated_at: string }
interface FullDoc extends Doc { content: string }

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<FullDoc | null>(null)
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState({ client_id: '', title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/documents').then(r => r.json()),
      fetch('/api/admin/clients').then(r => r.json()),
    ]).then(([docsData, clientsData]) => {
      setDocs(docsData.documents ?? [])
      setClients(clientsData.clients ?? [])
      setLoading(false)
    })
  }, [])

  async function openEdit(doc: Doc) {
    const res = await fetch(`/api/admin/documents/${doc.id}`)
    const data = await res.json()
    setEditing(data.document)
    setCreating(false)
  }

  async function handleSaveEdit() {
    if (!editing) return
    setSaving(true)
    await fetch(`/api/admin/documents/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editing.title, content: editing.content }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setDocs(d => d.map(doc => doc.id === editing.id ? { ...doc, title: editing.title, updated_at: new Date().toISOString() } : doc))
  }

  async function handleCreate() {
    if (!newForm.client_id || !newForm.title) return
    setSaving(true)
    const res = await fetch('/api/admin/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    const data = await res.json()
    const clientName = clients.find(c => c.id === Number(newForm.client_id))?.name ?? ''
    setDocs(d => [{ ...data.document, client_name: clientName }, ...d])
    setNewForm({ client_id: '', title: '', content: '' })
    setCreating(false)
    setSaving(false)
    setEditing({ ...data.document, client_name: clientName })
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' })
    setDocs(d => d.filter(doc => doc.id !== id))
    if (editing?.id === id) setEditing(null)
    setDeleting(null)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: `1px solid ${dark.border}`, borderRadius: '8px',
    padding: '10px 13px', fontSize: '14px',
    color: dark.text, background: 'rgba(255,255,255,0.04)', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: '700',
    color: dark.textDim, marginBottom: '6px',
    letterSpacing: '0.08em', textTransform: 'uppercase',
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

      {/* Left: doc list */}
      <div style={{ width: '300px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: dark.text, margin: 0 }}>Documents</h1>
          <button
            onClick={() => { setCreating(true); setEditing(null) }}
            style={{
              padding: '7px 13px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}
          >
            + New
          </button>
        </div>

        {loading ? (
          <p style={{ color: dark.textMuted, fontSize: '14px' }}>Loading…</p>
        ) : docs.length === 0 ? (
          <p style={{ color: dark.textDim, fontSize: '14px' }}>No documents yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {docs.map(doc => (
              <div
                key={doc.id}
                onClick={() => openEdit(doc)}
                style={{
                  padding: '12px 14px', borderRadius: '9px', cursor: 'pointer',
                  border: `1px solid ${editing?.id === doc.id ? dark.blue : dark.border}`,
                  background: editing?.id === doc.id ? 'rgba(59,130,246,0.08)' : dark.surface,
                  transition: 'all 0.15s',
                }}
              >
                <p style={{ color: dark.text, fontWeight: '600', fontSize: '14px', margin: '0 0 4px', lineHeight: '1.3' }}>{doc.title}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px', background: dark.blueTag, color: dark.blueTagText,
                    padding: '2px 8px', borderRadius: '20px',
                  }}>{doc.client_name}</span>
                  <span style={{ fontSize: '11px', color: dark.textDim }}>
                    {new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: editor / create form */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {creating && (
          <div style={{ background: dark.surface, borderRadius: '12px', border: `1px solid ${dark.border}`, padding: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: dark.text, margin: '0 0 20px' }}>New Document</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Client</label>
                <select
                  value={newForm.client_id}
                  onChange={e => setNewForm(f => ({ ...f, client_id: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                >
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Statement of Work — Phase 1"
                  value={newForm.title}
                  onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Content (Markdown)</label>
                <textarea
                  rows={12}
                  placeholder="# Document Title&#10;&#10;Write your markdown here…"
                  value={newForm.content}
                  onChange={e => setNewForm(f => ({ ...f, content: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: '13px', lineHeight: '1.6' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCreate}
                  disabled={saving || !newForm.client_id || !newForm.title}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                    background: saving ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: !newForm.client_id || !newForm.title ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Creating…' : 'Create Document'}
                </button>
                <button
                  onClick={() => setCreating(false)}
                  style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', color: dark.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {editing && !creating && (
          <div style={{ background: dark.surface, borderRadius: '12px', border: `1px solid ${dark.border}`, padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  value={editing.title}
                  onChange={e => setEditing(d => d ? { ...d, title: e.target.value } : d)}
                  style={{ ...inputStyle, fontSize: '18px', fontWeight: '700', padding: '8px 12px' }}
                />
                <p style={{ color: dark.textDim, fontSize: '12px', margin: '6px 0 0' }}>
                  {editing.client_name}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {saved && <span style={{ color: dark.successText, fontSize: '13px' }}>Saved ✓</span>}
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{
                    padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    background: saving ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving ? 'none' : '0 4px 12px rgba(59,130,246,0.25)',
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => handleDelete(editing.id)}
                  disabled={deleting === editing.id}
                  style={{
                    padding: '9px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    background: dark.danger, color: dark.dangerText,
                    border: `1px solid ${dark.dangerBorder}`,
                    cursor: 'pointer',
                  }}
                >
                  {deleting === editing.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Tabs: edit / preview */}
            <EditPreview
              content={editing.content}
              onChange={c => setEditing(d => d ? { ...d, content: c } : d)}
            />
          </div>
        )}

        {!editing && !creating && (
          <div style={{ background: dark.surface, borderRadius: '12px', border: `1px solid ${dark.border}`, padding: '56px 40px', textAlign: 'center' }}>
            <p style={{ color: dark.textDim, fontSize: '14px', margin: 0 }}>
              Select a document to edit, or create a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function EditPreview({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
    border: 'none',
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    color: active ? '#3b82f6' : 'rgba(255,255,255,0.4)',
    transition: 'all 0.15s',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button style={tabStyle(tab === 'edit')} onClick={() => setTab('edit')}>Edit</button>
        <button style={tabStyle(tab === 'preview')} onClick={() => setTab('preview')}>Preview</button>
      </div>

      {tab === 'edit' ? (
        <textarea
          rows={28}
          value={content}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
            padding: '14px 16px', fontSize: '13px',
            color: '#f1f5f9', background: 'rgba(255,255,255,0.03)',
            outline: 'none', resize: 'vertical',
            fontFamily: 'ui-monospace, "Cascadia Code", monospace',
            lineHeight: '1.7',
          }}
        />
      ) : (
        <MarkdownPreview content={content} />
      )}
    </div>
  )
}

function MarkdownPreview({ content }: { content: string }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    import('marked').then(({ marked }) => {
      setHtml(marked(content) as string)
    })
  }, [content])

  return (
    <div
      style={{
        minHeight: '400px', padding: '20px 24px',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
        background: 'rgba(255,255,255,0.02)',
        color: '#e2e8f0', lineHeight: '1.8', fontSize: '14px',
        overflowY: 'auto',
      }}
      className="md-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
