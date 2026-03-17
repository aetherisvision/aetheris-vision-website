'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const dark = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  border: 'rgba(255,255,255,0.08)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.2)',
  blue: '#3b82f6',
  blueGlow: 'rgba(59,130,246,0.15)',
}

function ConfirmForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  if (!token || !email) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)',
          margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.8"/>
            <path d="M12 8v4m0 4h.01" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: dark.text, margin: '0 0 8px' }}>Invalid link</h2>
        <p style={{ color: dark.textMuted, fontSize: '14px', margin: '0 0 24px' }}>
          This link is missing required parameters.
        </p>
        <a href="/client/login" style={{
          display: 'inline-block', padding: '11px 24px', borderRadius: '9px',
          background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
          color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '600',
          boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
        }}>
          Back to login
        </a>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '60px', height: '60px', borderRadius: '50%',
        background: dark.blueGlow, border: '1px solid rgba(59,130,246,0.25)',
        margin: '0 auto 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke={dark.blue} strokeWidth="1.8"/>
          <path d="M7 11V7a5 5 0 0110 0v4" stroke={dark.blue} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: '700', color: dark.text, margin: '0 0 6px' }}>
        Ready to log in
      </h2>
      <p style={{ color: dark.textMuted, fontSize: '14px', margin: '0 0 16px' }}>
        Signing in as
      </p>
      <div style={{
        display: 'inline-block', padding: '8px 18px', borderRadius: '8px',
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${dark.border}`,
        marginBottom: '28px',
      }}>
        <span style={{ color: dark.text, fontSize: '14px', fontWeight: '600' }}>{email}</span>
      </div>
      <br />
      <form action="/api/auth/magic" method="POST" style={{ display: 'inline' }}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <button type="submit" style={{
          padding: '13px 36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: '15px', fontWeight: '700',
          boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          letterSpacing: '0.02em', transition: 'all 0.2s',
        }}>
          Access my portal →
        </button>
      </form>
      <p style={{ color: dark.textDim, fontSize: '12px', marginTop: '20px' }}>
        Didn&apos;t request this?{' '}
        <a href="/client/login" style={{ color: dark.blue, textDecoration: 'none', fontWeight: '500' }}>
          Go back
        </a>
      </p>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <div style={{
      minHeight: '100vh', background: dark.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(30,58,95,0.5) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '50%', transform: 'translateX(-50%)',
        width: '400px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
            margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: '800' }}>AV</span>
          </div>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: dark.text, margin: '0 0 2px' }}>
            Aetheris Vision
          </h1>
          <p style={{ color: dark.textDim, fontSize: '13px', margin: 0 }}>Client Portal</p>
        </div>

        <div style={{
          background: dark.surface, borderRadius: '20px', padding: '40px 32px',
          border: `1px solid ${dark.border}`,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <Suspense fallback={null}>
            <ConfirmForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
