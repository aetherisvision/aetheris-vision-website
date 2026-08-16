'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const dark = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  border: 'rgba(255,255,255,0.08)',
  borderFocus: '#5BA8D9',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#5BA8D9',
  blueGlow: 'rgba(91,168,217,0.15)',
}

function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin/leads'
  const [passphrase, setPassphrase] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase, next, rememberMe }),
    })

    if (res.ok) {
      const { redirectTo } = await res.json()
      window.location.href = redirectTo
    } else {
      setError('Incorrect passphrase.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: dark.textDim, marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Passphrase
      </label>
      <input
        type="password"
        required
        autoFocus
        value={passphrase}
        onChange={e => setPassphrase(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: 'block', width: '100%', boxSizing: 'border-box',
          padding: '13px 16px', borderRadius: '10px',
          border: `1.5px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? dark.borderFocus : dark.border}`,
          fontSize: '15px', color: dark.text,
          background: 'rgba(255,255,255,0.04)',
          marginBottom: '14px', outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? `0 0 0 3px ${dark.blueGlow}` : 'none',
        }}
      />
      {error && (
        <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '14px', fontWeight: '500' }}>{error}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}
        onClick={() => setRememberMe(r => !r)}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
          border: `1.5px solid ${rememberMe ? dark.blue : dark.border}`,
          background: rememberMe ? dark.blue : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {rememberMe && (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span style={{ fontSize: '13px', color: dark.textMuted, userSelect: 'none' }}>Remember me for 30 days</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: '10px',
          background: loading ? 'rgba(91,168,217,0.4)' : 'linear-gradient(135deg, #486890, #5BA8D9)',
          color: '#fff', fontWeight: '700', fontSize: '15px',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(91,168,217,0.35)',
          transition: 'all 0.2s', letterSpacing: '0.02em',
        }}
      >
        {loading ? 'Verifying…' : 'Log in →'}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: '100vh', background: dark.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(30,58,95,0.5) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #29426C, #5BA8D9)',
            margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(91,168,217,0.3)',
          }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: '800' }}>AV</span>
          </div>
          <h1 style={{ fontSize: '17px', fontWeight: '700', color: dark.text, margin: '0 0 3px' }}>
            Aetheris Vision
          </h1>
          <p style={{ color: dark.textDim, fontSize: '13px', margin: 0 }}>Admin access</p>
        </div>

        <div style={{
          background: dark.surface, borderRadius: '20px', padding: '36px 32px',
          border: `1px solid ${dark.border}`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
