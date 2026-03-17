'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const brand = {
  navy: '#0f2240',
  navyMid: '#1e3a5f',
  blue: '#3b82f6',
}

function ConfirmForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  if (!token || !email) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#fef2f2', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.8"/>
            <path d="M12 8v4m0 4h.01" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' }}>Invalid link</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>This link is missing required parameters.</p>
        <a href="/client/login" style={{
          display: 'inline-block', padding: '10px 20px', borderRadius: '8px',
          background: brand.navyMid, color: '#fff', textDecoration: 'none',
          fontSize: '14px', fontWeight: '600',
        }}>
          Back to login
        </a>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        background: '#dbeafe', margin: '0 auto 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke={brand.blue} strokeWidth="1.8"/>
          <path d="M7 11V7a5 5 0 0110 0v4" stroke={brand.blue} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px' }}>
        Ready to log in
      </h2>
      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: '0 0 6px' }}>
        Signing in as
      </p>
      <p style={{ color: '#0f172a', fontSize: '15px', fontWeight: '600', margin: '0 0 28px', background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', display: 'inline-block' }}>
        {email}
      </p>
      <br />
      <form action="/api/auth/magic" method="POST" style={{ display: 'inline' }}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          style={{
            padding: '13px 32px', borderRadius: '8px',
            background: `linear-gradient(135deg, ${brand.navyMid}, ${brand.navy})`,
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: '15px', fontWeight: '700',
            boxShadow: '0 2px 8px rgba(30,58,95,0.3)',
            letterSpacing: '0.02em',
          }}
        >
          Access my portal →
        </button>
      </form>
      <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '20px' }}>
        Didn&apos;t request this?{' '}
        <a href="/client/login" style={{ color: brand.navyMid, textDecoration: 'none', fontWeight: '500' }}>Go back</a>
      </p>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px',
      background: 'linear-gradient(160deg, #0f2240 0%, #1e3a5f 40%, #f8fafc 40%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.15)', margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: '800' }}>AV</span>
          </div>
          <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: '0 0 2px' }}>
            Aetheris Vision
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Client Portal</p>
        </div>

        <div style={{
          background: '#fff', borderRadius: '20px', padding: '40px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <Suspense fallback={null}>
            <ConfirmForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
