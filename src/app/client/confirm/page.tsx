'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConfirmForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const callbackUrl = `/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent('/client/dashboard')}`

  if (!token || !email) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>Invalid login link. Please request a new one.</p>
        <a href="/client/login" style={{ color: '#1e3a5f', fontSize: '14px' }}>Back to login</a>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔐</div>
      <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
        Confirm your login
      </h2>
      <p style={{ color: '#475569', fontSize: '15px', marginBottom: '24px' }}>
        Logging in as <strong>{email}</strong>
      </p>
      <a
        href={callbackUrl}
        style={{
          display: 'inline-block', background: '#1e3a5f', color: '#fff',
          textDecoration: 'none', padding: '14px 28px', borderRadius: '6px',
          fontSize: '16px', fontWeight: '600',
        }}
      >
        Log in to Client Portal
      </a>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '24px' }}>
        Didn&apos;t request this?{' '}
        <a href="/client/login" style={{ color: '#1e3a5f' }}>Go back</a>
      </p>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 4px' }}>
            Aetheris Vision LLC
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>Client Portal</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <Suspense fallback={null}>
            <ConfirmForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
