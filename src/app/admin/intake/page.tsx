'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  warning: 'rgba(245,158,11,0.12)',
  warningBorder: 'rgba(245,158,11,0.25)',
  warningText: '#fcd34d',
  danger: 'rgba(220,38,38,0.12)',
  dangerText: '#f87171',
  dangerBorder: 'rgba(220,38,38,0.25)',
}

const PLATFORM_LABELS: Record<string, string> = {
  'nextjs': 'Next.js (Custom)',
  'headless-wp': 'Headless WordPress',
  'managed-wp': 'Managed WordPress',
  'decide': 'Help me decide',
}

const STATUS_OPTIONS = ['new', 'in_review', 'sow_sent', 'won', 'lost'] as const
type Status = typeof STATUS_OPTIONS[number]

const STATUS_LABELS: Record<Status, string> = {
  new: 'New',
  in_review: 'In Review',
  sow_sent: 'SOW Sent',
  won: 'Won',
  lost: 'Lost',
}

const STATUS_COLORS: Record<Status, { bg: string; border: string; color: string }> = {
  new: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', color: '#93c5fd' },
  in_review: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fcd34d' },
  sow_sent: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', color: '#c4b5fd' },
  won: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#6ee7b7' },
  lost: { bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.3)', color: '#f87171' },
}

interface Submission {
  id: number
  status: Status
  company_name: string
  industry: string | null
  location: string | null
  revenue: string | null
  contact_name: string
  contact_title: string | null
  contact_email: string
  contact_phone: string | null
  budget_range: string | null
  timeline: string | null
  objectives: string[] | null
  special_requirements: string | null
  questions_for_us: string | null
  client_id: number | null
  project_id: number | null
  pro_bono: boolean
  platform_preference: string | null
  submitted_at: string
}

export default function AdminIntakePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [generatingSow, setGeneratingSow] = useState<number | null>(null)
  const [sowDrafts, setSowDrafts] = useState<Record<number, { tier: string; content: string; title: string; documentId?: number }>>({})
  const [sowEdits, setSowEdits] = useState<Record<number, string>>({})
  const [savingDraft, setSavingDraft] = useState<number | null>(null)
  const [savedDraft, setSavedDraft] = useState<number | null>(null)
  const [copySuccess, setCopySuccess] = useState<number | null>(null)
  const [sowPreviewMode, setSowPreviewMode] = useState<Record<number, boolean>>({})
  const [sendingSignature, setSendingSignature] = useState<number | null>(null)
  const [signatureSent, setSignatureSent] = useState<Record<number, boolean>>({})
  const [togglingProBono, setTogglingProBono] = useState<number | null>(null)

  async function fetchSubmissions() {
    const r = await fetch('/api/admin/intake')
    const data = await r.json()
    setSubmissions(data.submissions ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchSubmissions() }, [])

  async function generateSow(id: number) {
    setGeneratingSow(id)
    try {
      const r = await fetch('/api/admin/intake/generate-sow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake_id: id }),
      })
      const data = await r.json()
      if (data.content) {
        setSowDrafts(prev => ({ ...prev, [id]: { tier: data.tier, content: data.content, title: data.title, documentId: data.document_id } }))
        setSowEdits(prev => ({ ...prev, [id]: data.content }))
        // Sync authoritative DB state back into local submissions — never lose pro_bono, platform, etc.
        setSubmissions(subs => subs.map(s => s.id === id ? {
          ...s,
          status: data.status ?? 'in_review',
          pro_bono: data.pro_bono ?? s.pro_bono,
          platform_preference: data.platform_preference ?? s.platform_preference,
        } : s))
      }
    } catch (e) {
      console.error('SOW generation failed:', e)
    }
    setGeneratingSow(null)
  }

  async function copySow(id: number) {
    const content = sowEdits[id] ?? sowDrafts[id]?.content
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopySuccess(id)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  async function saveDraft(id: number) {
    const draft = sowDrafts[id]
    const content = sowEdits[id]
    if (!draft || !content) return
    setSavingDraft(id)
    try {
      if (draft.documentId) {
        await fetch(`/api/admin/documents/${draft.documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
      }
      setSowDrafts(prev => ({ ...prev, [id]: { ...prev[id], content } }))
      setSavedDraft(id)
      setTimeout(() => setSavedDraft(null), 2000)
    } catch (e) {
      console.error('Save draft failed:', e)
    }
    setSavingDraft(null)
  }

  async function sendForSignature(id: number) {
    const draft = sowDrafts[id]
    if (!draft) return
    const content = sowEdits[id] ?? draft.content
    setSendingSignature(id)
    try {
      const r = await fetch('/api/admin/intake/send-for-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake_id: id, sow_content: content }),
      })
      const data = await r.json()
      if (data.success) {
        setSignatureSent(prev => ({ ...prev, [id]: true }))
        setSubmissions(subs => subs.map(s => s.id === id ? { ...s, status: 'sow_sent' } : s))
      } else {
        alert(`Failed: ${data.detail ?? data.error}`)
      }
    } catch (e) {
      console.error('Send for signature failed:', e)
      alert('Send for signature failed — check console')
    }
    setSendingSignature(null)
  }

  async function toggleProBono(id: number, current: boolean) {
    setTogglingProBono(id)
    await fetch('/api/admin/intake', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pro_bono: !current }),
    })
    setSubmissions(subs => subs.map(s => s.id === id ? { ...s, pro_bono: !current } : s))
    setTogglingProBono(null)
  }

  async function updateStatus(id: number, status: Status) {
    setUpdating(id)
    await fetch('/api/admin/intake', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setSubmissions(subs => subs.map(s => s.id === id ? { ...s, status } : s))
    setUpdating(null)
  }

  const newCount = submissions.filter(s => s.status === 'new').length

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, margin: 0 }}>
              Project Intakes
            </h1>
            {newCount > 0 && (
              <span style={{
                background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
                color: '#93c5fd', borderRadius: '999px', padding: '2px 10px',
                fontSize: '12px', fontWeight: '700',
              }}>
                {newCount} new
              </span>
            )}
          </div>
          <p style={{ color: dark.textMuted, fontSize: '14px', margin: 0 }}>
            All project intake submissions — newest first.
          </p>
        </div>
        <a
          href="/intake"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff',
            textDecoration: 'none', boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}
        >
          View intake form ↗
        </a>
      </div>

      {loading ? (
        <p style={{ color: dark.textMuted }}>Loading…</p>
      ) : submissions.length === 0 ? (
        <div style={{
          background: dark.surface, borderRadius: '12px', border: `1px solid ${dark.border}`,
          padding: '48px', textAlign: 'center',
        }}>
          <p style={{ color: dark.textDim, fontSize: '15px', margin: 0 }}>No intake submissions yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {submissions.map(sub => {
            const sc = STATUS_COLORS[sub.status] ?? STATUS_COLORS.new
            const isOpen = expanded === sub.id
            return (
              <div key={sub.id} style={{
                background: dark.surface, borderRadius: '12px',
                border: `1px solid ${dark.border}`, overflow: 'hidden',
              }}>
                {/* Card header */}
                <div
                  style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                  onClick={() => setExpanded(isOpen ? null : sub.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: dark.text }}>{sub.company_name}</span>
                      {sub.industry && (
                        <span style={{ fontSize: '12px', color: dark.textDim, background: 'rgba(255,255,255,0.04)', border: `1px solid ${dark.borderLight}`, borderRadius: '5px', padding: '2px 7px' }}>
                          {sub.industry}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, borderRadius: '999px', padding: '2px 9px', fontWeight: '600' }}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                      {sub.pro_bono && (
                        <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', borderRadius: '999px', padding: '2px 9px', fontWeight: '600' }}>
                          Pro Bono
                        </span>
                      )}
                    </div>
                    <p style={{ color: dark.textMuted, fontSize: '13px', margin: 0 }}>
                      {sub.contact_name}{sub.contact_title ? ` · ${sub.contact_title}` : ''} · {sub.contact_email}
                      {sub.contact_phone ? ` · ${sub.contact_phone}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      {sub.budget_range && <p style={{ fontSize: '13px', fontWeight: '600', color: dark.blue, margin: '0 0 2px' }}>{sub.budget_range}</p>}
                      <p style={{ fontSize: '12px', color: dark.textDim, margin: 0 }}>
                        {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span style={{ color: dark.textDim, fontSize: '18px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▾</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${dark.borderLight}`, padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      {[
                        { label: 'Location', value: sub.location },
                        { label: 'Revenue', value: sub.revenue },
                        { label: 'Timeline', value: sub.timeline },
                        { label: 'Budget', value: sub.budget_range },
                        { label: 'Stack Preference', value: sub.platform_preference ? (PLATFORM_LABELS[sub.platform_preference] ?? sub.platform_preference) : null },
                      ].map(({ label, value }) => value ? (
                        <div key={label}>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>{label}</p>
                          <p style={{ fontSize: '14px', color: dark.text, margin: 0 }}>{value}</p>
                        </div>
                      ) : null)}
                      {sub.objectives && sub.objectives.length > 0 && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Objectives</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {sub.objectives.map(obj => (
                              <span key={obj} style={{ fontSize: '12px', background: dark.blueGlow, border: `1px solid rgba(59,130,246,0.2)`, color: '#93c5fd', borderRadius: '5px', padding: '3px 8px' }}>{obj}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {sub.special_requirements && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Special Requirements</p>
                          <p style={{ fontSize: '14px', color: dark.text, margin: 0, lineHeight: '1.5' }}>{sub.special_requirements}</p>
                        </div>
                      )}
                      {sub.questions_for_us && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Questions for Us</p>
                          <p style={{ fontSize: '14px', color: dark.text, margin: 0, lineHeight: '1.5' }}>{sub.questions_for_us}</p>
                        </div>
                      )}
                    </div>

                    {/* SOW Draft */}
                    {sowDrafts[sub.id] && (
                      <div style={{ marginBottom: '20px', borderRadius: '10px', border: `1px solid rgba(16,185,129,0.25)`, background: 'rgba(16,185,129,0.05)', overflow: 'hidden' }}>
                        {/* SOW toolbar */}
                        <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(16,185,129,0.15)` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#6ee7b7' }}>✓ SOW Draft</span>
                            <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: '5px', padding: '2px 7px', fontWeight: '600' }}>
                              {sowDrafts[sub.id].tier} Tier
                            </span>
                            {/* Edit / Preview toggle */}
                            <div style={{ display: 'flex', borderRadius: '6px', border: `1px solid ${dark.border}`, overflow: 'hidden', marginLeft: '4px' }}>
                              {(['Edit', 'Preview'] as const).map(mode => {
                                const isActive = mode === 'Preview' ? !!sowPreviewMode[sub.id] : !sowPreviewMode[sub.id]
                                return (
                                  <button key={mode}
                                    onClick={() => setSowPreviewMode(prev => ({ ...prev, [sub.id]: mode === 'Preview' }))}
                                    style={{
                                      padding: '4px 10px', fontSize: '11px', fontWeight: '600', border: 'none',
                                      background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                      color: isActive ? dark.text : dark.textDim, cursor: 'pointer',
                                    }}
                                  >{mode}</button>
                                )
                              })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {!sowPreviewMode[sub.id] && (
                              <button
                                onClick={() => saveDraft(sub.id)}
                                disabled={savingDraft === sub.id}
                                style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: `1px solid rgba(16,185,129,0.3)`, background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer' }}
                              >
                                {savingDraft === sub.id ? 'Saving…' : savedDraft === sub.id ? '✓ Saved' : 'Save Draft'}
                              </button>
                            )}
                            <button
                              onClick={() => copySow(sub.id)}
                              style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: `1px solid rgba(16,185,129,0.3)`, background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', cursor: 'pointer' }}
                            >
                              {copySuccess === sub.id ? '✓ Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        {/* Edit mode — raw textarea */}
                        {!sowPreviewMode[sub.id] && (
                          <textarea
                            value={sowEdits[sub.id] ?? sowDrafts[sub.id].content}
                            onChange={e => setSowEdits(prev => ({ ...prev, [sub.id]: e.target.value }))}
                            style={{
                              display: 'block', width: '100%', boxSizing: 'border-box',
                              margin: 0, padding: '16px', minHeight: '360px', maxHeight: '560px',
                              fontSize: '12px', color: dark.text, background: 'transparent',
                              border: 'none', outline: 'none', resize: 'vertical',
                              fontFamily: 'ui-monospace, monospace', lineHeight: '1.7',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            }}
                            spellCheck={false}
                          />
                        )}

                        {/* Preview mode — rendered markdown */}
                        {sowPreviewMode[sub.id] && (
                          <div style={{
                            padding: '20px 24px', maxHeight: '560px', overflowY: 'auto',
                            fontSize: '13px', lineHeight: '1.7', color: dark.text,
                          }}>
                            <style>{`
                              .sow-preview h1 { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 20px 0 8px; }
                              .sow-preview h2 { font-size: 14px; font-weight: 700; color: #93c5fd; margin: 18px 0 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08); }
                              .sow-preview h3 { font-size: 13px; font-weight: 600; color: #f1f5f9; margin: 14px 0 4px; }
                              .sow-preview p { margin: 6px 0; color: rgba(255,255,255,0.75); }
                              .sow-preview ul, .sow-preview ol { margin: 6px 0 6px 20px; color: rgba(255,255,255,0.75); }
                              .sow-preview li { margin: 3px 0; }
                              .sow-preview strong { color: #f1f5f9; font-weight: 600; }
                              .sow-preview hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0; }
                              .sow-preview table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
                              .sow-preview th { background: rgba(59,130,246,0.12); color: #93c5fd; padding: 7px 10px; text-align: left; border: 1px solid rgba(255,255,255,0.08); font-weight: 600; }
                              .sow-preview td { padding: 6px 10px; border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
                              .sow-preview blockquote { border-left: 3px solid rgba(59,130,246,0.4); margin: 8px 0; padding: 6px 12px; background: rgba(59,130,246,0.05); color: rgba(255,255,255,0.6); font-style: italic; }
                              .sow-preview code { background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 3px; font-size: 11px; }
                            `}</style>
                            <div className="sow-preview">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {sowEdits[sub.id] ?? sowDrafts[sub.id].content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      {/* Status selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: dark.textDim, fontWeight: '600' }}>Status:</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {STATUS_OPTIONS.map(s => {
                            const c = STATUS_COLORS[s]
                            const active = sub.status === s
                            return (
                              <button
                                key={s}
                                onClick={() => updateStatus(sub.id, s)}
                                disabled={updating === sub.id}
                                style={{
                                  padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                  border: `1px solid ${active ? c.border : dark.borderLight}`,
                                  background: active ? c.bg : 'transparent',
                                  color: active ? c.color : dark.textDim,
                                  cursor: updating === sub.id ? 'not-allowed' : 'pointer',
                                  opacity: updating === sub.id ? 0.5 : 1,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {STATUS_LABELS[s]}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Links */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => toggleProBono(sub.id, sub.pro_bono)}
                          disabled={togglingProBono === sub.id}
                          style={{
                            padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '600',
                            border: sub.pro_bono ? '1px solid rgba(245,158,11,0.4)' : `1px solid ${dark.border}`,
                            background: sub.pro_bono ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                            color: sub.pro_bono ? '#fcd34d' : dark.textDim,
                            cursor: 'pointer',
                          }}
                        >
                          {togglingProBono === sub.id ? '…' : sub.pro_bono ? '★ Pro Bono' : '☆ Pro Bono'}
                        </button>
                        <button
                          onClick={() => generateSow(sub.id)}
                          disabled={generatingSow === sub.id}
                          style={{
                            padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '600',
                            border: '1px solid rgba(139,92,246,0.4)',
                            background: generatingSow === sub.id ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.15)',
                            color: generatingSow === sub.id ? 'rgba(196,181,253,0.5)' : '#c4b5fd',
                            cursor: generatingSow === sub.id ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          {generatingSow === sub.id ? (
                            <>
                              <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid rgba(196,181,253,0.3)', borderTopColor: '#c4b5fd', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                              Drafting SOW…
                            </>
                          ) : sowDrafts[sub.id] ? '↻ Regenerate SOW' : '✦ Generate SOW Draft'}
                        </button>
                        {sowDrafts[sub.id] && !signatureSent[sub.id] && (
                          <button
                            onClick={() => sendForSignature(sub.id)}
                            disabled={sendingSignature === sub.id}
                            style={{
                              padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '600',
                              border: '1px solid rgba(16,185,129,0.4)',
                              background: sendingSignature === sub.id ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.15)',
                              color: sendingSignature === sub.id ? 'rgba(110,231,183,0.5)' : '#6ee7b7',
                              cursor: sendingSignature === sub.id ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                          >
                            {sendingSignature === sub.id ? (
                              <>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid rgba(110,231,183,0.3)', borderTopColor: '#6ee7b7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                Sending…
                              </>
                            ) : '✉ Send for Signature'}
                          </button>
                        )}
                        {signatureSent[sub.id] && (
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#6ee7b7', padding: '7px 0' }}>
                            ✓ Sent to client
                          </span>
                        )}
                        {sub.client_id && (
                          <Link href="/admin/clients" style={{
                            padding: '7px 13px', borderRadius: '7px', fontSize: '13px', fontWeight: '500',
                            border: `1px solid ${dark.border}`, background: 'rgba(255,255,255,0.04)',
                            color: dark.textMuted, textDecoration: 'none',
                          }}>
                            View Client
                          </Link>
                        )}
                        {sub.project_id && (
                          <Link href="/admin/projects" style={{
                            padding: '7px 13px', borderRadius: '7px', fontSize: '13px', fontWeight: '500',
                            border: `1px solid ${dark.border}`, background: 'rgba(255,255,255,0.04)',
                            color: dark.textMuted, textDecoration: 'none',
                          }}>
                            View Project
                          </Link>
                        )}
                        <a
                          href={`mailto:${sub.contact_email}`}
                          style={{
                            padding: '7px 13px', borderRadius: '7px', fontSize: '13px', fontWeight: '600',
                            background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff',
                            textDecoration: 'none', boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                          }}
                        >
                          Email {sub.contact_name.split(' ')[0]}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
