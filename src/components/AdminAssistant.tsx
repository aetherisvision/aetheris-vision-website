'use client'

/**
 * Floating "Ask Claude" panel for the admin CRM: a small chat window that
 * discusses what to do next, answered by /api/admin/assistant with a live
 * pipeline snapshot. History is kept in sessionStorage only (per browser
 * tab), so nothing conversational is persisted server-side.
 */
import { useEffect, useRef, useState } from 'react'

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'av-admin-assistant'

const palette = {
  surface: '#0d1b2e',
  border: 'rgba(255,255,255,0.1)',
  text: '#f1f5f9',
  muted: 'rgba(255,255,255,0.55)',
  blue: '#5BA8D9',
  userBubble: 'rgba(91,168,217,0.16)',
  assistantBubble: 'rgba(255,255,255,0.05)',
  red: '#f87171',
}

function loadStoredTurns(): Turn[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Turn[]
    return Array.isArray(parsed) ? parsed.slice(-32) : []
  } catch {
    return []
  }
}

export default function AdminAssistant() {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTurns(loadStoredTurns())
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-32)))
    } catch {
      // Storage unavailable: the panel still works for this page view.
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [turns])

  async function send() {
    const question = input.trim()
    if (!question || busy) return
    const nextTurns: Turn[] = [...turns, { role: 'user', content: question }]
    setTurns(nextTurns)
    setInput('')
    setBusy(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextTurns.slice(-16) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Claude could not answer')
      setTurns(current => [...current, { role: 'assistant', content: data.reply }])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Claude could not answer')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask Claude what to do next"
        style={{
          position: 'fixed', right: '22px', bottom: '22px', zIndex: 90,
          padding: '11px 16px', borderRadius: '999px', border: `1px solid rgba(91,168,217,0.45)`,
          background: 'linear-gradient(135deg, #29426c, #17497a)', color: palette.text,
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
        }}
      >
        Ask Claude
      </button>
    )
  }

  return (
    <section
      aria-label="Claude assistant"
      style={{
        position: 'fixed', right: '22px', bottom: '22px', zIndex: 90,
        width: 'min(380px, calc(100vw - 44px))', display: 'flex', flexDirection: 'column',
        maxHeight: 'min(560px, calc(100vh - 90px))',
        background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: '14px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.55)', overflow: 'hidden',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${palette.border}`, background: 'rgba(91,168,217,0.08)' }}>
        <div>
          <strong style={{ color: palette.text, fontSize: '13px' }}>Claude</strong>
          <span style={{ color: palette.muted, fontSize: '12px', marginLeft: '8px' }}>next moves on the pipeline</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => { setTurns([]); setError(null) }}
            title="Clear the conversation"
            style={{ background: 'transparent', border: 0, color: palette.muted, cursor: 'pointer', fontSize: '12px' }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close the assistant"
            style={{ background: 'transparent', border: 0, color: palette.muted, cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      </header>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '160px' }}>
        {turns.length === 0 && (
          <p style={{ color: palette.muted, fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
            Ask about the pipeline: what to work on today, which review leads deserve a pursue, or what is at risk this week. Claude answers from the live lead list.
          </p>
        )}
        {turns.map((turn, index) => (
          <div
            key={index}
            style={{
              alignSelf: turn.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%', padding: '9px 12px', borderRadius: '12px',
              background: turn.role === 'user' ? palette.userBubble : palette.assistantBubble,
              border: `1px solid ${palette.border}`,
              color: palette.text, fontSize: '13px', lineHeight: 1.55, whiteSpace: 'pre-wrap',
            }}
          >
            {turn.content}
          </div>
        ))}
        {busy && <p style={{ color: palette.blue, fontSize: '12px', margin: 0 }}>Claude is thinking…</p>}
        {error && <p role="alert" style={{ color: palette.red, fontSize: '12px', margin: 0 }}>{error}</p>}
      </div>

      <form
        onSubmit={event => { event.preventDefault(); void send() }}
        style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: `1px solid ${palette.border}` }}
      >
        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void send()
            }
          }}
          rows={2}
          placeholder="What should I do next?"
          aria-label="Message for Claude"
          style={{
            flex: 1, resize: 'none', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${palette.border}`, borderRadius: '9px',
            color: palette.text, fontSize: '13px', padding: '9px 11px', fontFamily: 'inherit', colorScheme: 'dark',
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          style={{
            alignSelf: 'end', padding: '9px 14px', borderRadius: '9px', border: 'none',
            background: busy || !input.trim() ? 'rgba(91,168,217,0.35)' : palette.blue,
            color: '#07121f', fontWeight: 800, fontSize: '12px',
            cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </section>
  )
}
