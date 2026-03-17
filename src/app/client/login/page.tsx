'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

const dark = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  surfaceHover: '#112338',
  border: 'rgba(255,255,255,0.08)',
  borderFocus: '#3b82f6',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6',
  blueGlow: 'rgba(59,130,246,0.15)',
  navy: '#1e3a5f',
}

function LoginForm() {
  const params = useSearchParams()
  const sent = params.get('sent') === '1'
  const error = params.get('error') === '1'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/send-magic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    window.location.href = '/client/login?sent=1'
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: dark.blueGlow, border: `1px solid rgba(59,130,246,0.3)`,
          margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke={dark.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: dark.text, margin: '0 0 10px' }}>
          Check your inbox
        </h2>
        <p style={{ color: dark.textMuted, lineHeight: '1.7', margin: '0 0 8px', fontSize: '15px' }}>
          We sent a secure login link to<br />
          <strong style={{ color: dark.text }}>{email || 'your email'}</strong>
        </p>
        <p style={{ color: dark.textDim, fontSize: '13px', margin: '16px 0 0' }}>
          Link expires in 24 hours · Check your spam folder if needed
        </p>
      </div>
    )
  }

  return (
    <>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, margin: '0 0 6px' }}>
        Welcome back
      </h2>
      <p style={{ color: dark.textMuted, fontSize: '14px', lineHeight: '1.6', margin: '0 0 28px' }}>
        Enter your email to receive a secure, passwordless login link.
      </p>

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
        }}>
          <p style={{ color: '#f87171', fontSize: '13px', margin: 0, fontWeight: '500' }}>
            That link has expired or already been used. Request a new one below.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: dark.textDim, marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Email Address
        </label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="you@company.com"
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            padding: '13px 16px', borderRadius: '10px',
            border: `1.5px solid ${focused ? dark.borderFocus : dark.border}`,
            fontSize: '15px', color: dark.text,
            background: 'rgba(255,255,255,0.04)',
            marginBottom: '16px', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: focused ? `0 0 0 3px ${dark.blueGlow}` : 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            background: loading
              ? 'rgba(59,130,246,0.4)'
              : 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#fff', fontWeight: '700', fontSize: '15px',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',
            transition: 'all 0.2s', letterSpacing: '0.02em',
          }}
        >
          {loading ? 'Sending link…' : 'Send login link →'}
        </button>
      </form>
    </>
  )
}

export default function ClientLoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: dark.bg,
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute', top: '-200px', left: '-200px',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,58,95,0.4) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-200px', right: '-200px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Left brand panel */}
      <div style={{
        width: '440px', flexShrink: 0,
        padding: '48px 44px',
        display: 'none',
        flexDirection: 'column', justifyContent: 'space-between',
        borderRight: `1px solid ${dark.border}`,
        position: 'relative',
      }} className="portal-left-panel">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '60px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>AV</span>
            </div>
            <span style={{ color: dark.text, fontWeight: '700', fontSize: '15px' }}>Aetheris Vision</span>
          </div>

          <h2 style={{ color: dark.text, fontSize: '32px', fontWeight: '800', lineHeight: '1.25', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Your project,<br />fully visible.
          </h2>
          <p style={{ color: dark.textMuted, fontSize: '15px', lineHeight: '1.8', margin: '0 0 40px' }}>
            Track progress, view milestones, and sign documents — all in one place.
          </p>

          {/* Feature list */}
          {['Real-time project roadmap', 'Milestone tracking with dates', 'Secure document signing'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: dark.blueGlow, border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke={dark.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ color: dark.textMuted, fontSize: '14px' }}>{f}</span>
            </div>
          ))}
        </div>
        <p style={{ color: dark.textDim, fontSize: '12px', margin: 0 }}>
          © {new Date().getFullYear()} Aetheris Vision LLC
        </p>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile brand */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
              margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            }}>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: '800' }}>AV</span>
            </div>
            <h1 style={{ fontSize: '17px', fontWeight: '700', color: dark.text, margin: '0 0 3px' }}>
              Aetheris Vision
            </h1>
            <p style={{ color: dark.textDim, fontSize: '13px', margin: 0 }}>Client Portal</p>
          </div>

          <div style={{
            background: dark.surface,
            borderRadius: '20px', padding: '36px 32px',
            border: `1px solid ${dark.border}`,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
          }}>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <p style={{ textAlign: 'center', color: dark.textDim, fontSize: '12px', marginTop: '20px' }}>
            Need help?{' '}
            <a href="mailto:marston@aetherisvision.com" style={{ color: dark.blue, textDecoration: 'none', fontWeight: '500' }}>
              marston@aetherisvision.com
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .portal-left-panel { display: flex !important; } }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}
