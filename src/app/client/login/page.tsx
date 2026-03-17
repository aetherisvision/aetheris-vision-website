'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

const brand = {
  navy: '#0f2240',
  navyMid: '#1e3a5f',
  blue: '#3b82f6',
  lightBlue: '#dbeafe',
}

function LoginForm() {
  const params = useSearchParams()
  const sent = params.get('sent') === '1'
  const error = params.get('error') === '1'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

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
          width: '56px', height: '56px', borderRadius: '50%',
          background: brand.lightBlue, margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke={brand.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px' }}>
          Check your inbox
        </h2>
        <p style={{ color: '#475569', lineHeight: '1.7', margin: '0 0 8px', fontSize: '15px' }}>
          We sent a secure login link to<br />
          <strong style={{ color: '#0f172a' }}>{email || 'your email'}</strong>
        </p>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '16px 0 0' }}>
          Link expires in 24 hours · Check your spam folder if needed
        </p>
      </div>
    )
  }

  return (
    <>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>
        Welcome back
      </h2>
      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: '0 0 28px' }}>
        Enter your email to receive a secure, passwordless login link.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
          <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, fontWeight: '500' }}>
            That link has expired or already been used. Request a new one below.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', letterSpacing: '0.02em' }}>
          EMAIL ADDRESS
        </label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            padding: '12px 14px', borderRadius: '8px',
            border: '1.5px solid #e2e8f0', fontSize: '15px',
            color: '#0f172a', background: '#fff', marginBottom: '16px',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = brand.blue }}
          onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px', borderRadius: '8px',
            background: loading ? '#93c5fd' : `linear-gradient(135deg, ${brand.navyMid}, ${brand.navy})`,
            color: '#fff', fontWeight: '700', fontSize: '15px',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em', boxShadow: loading ? 'none' : '0 2px 8px rgba(30,58,95,0.3)',
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
      display: 'flex', minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Left panel — brand */}
      <div style={{
        display: 'none',
        width: '420px', flexShrink: 0,
        background: `linear-gradient(160deg, ${brand.navy} 0%, #162d4a 60%, #0c1e33 100%)`,
        padding: '48px 40px',
        flexDirection: 'column', justifyContent: 'space-between',
      }}
        className="portal-left-panel"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: '800' }}>AV</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: '15px' }}>Aetheris Vision</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', lineHeight: '1.3', margin: '0 0 16px' }}>
            Your project,<br />fully visible.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
            Track progress, view milestones, and sign documents — all in one place.
          </p>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
            © {new Date().getFullYear()} Aetheris Vision LLC · Secure client portal
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile brand header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: brand.navyMid, margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: '800' }}>AV</span>
            </div>
            <h1 style={{ fontSize: '17px', fontWeight: '700', color: brand.navyMid, margin: '0 0 2px' }}>
              Aetheris Vision
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Client Portal</p>
          </div>

          <div style={{
            background: '#fff', borderRadius: '16px', padding: '36px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9',
          }}>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '20px' }}>
            Need help?{' '}
            <a href="mailto:marston@aetherisvision.com" style={{ color: brand.navyMid, fontWeight: '500', textDecoration: 'none' }}>
              marston@aetherisvision.com
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .portal-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
