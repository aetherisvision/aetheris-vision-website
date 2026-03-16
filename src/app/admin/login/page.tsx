'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin/clients'
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase, next }),
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
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
        Passphrase
      </label>
      <input
        type="password"
        required
        autoFocus
        value={passphrase}
        onChange={e => setPassphrase(e.target.value)}
        style={{
          display: 'block', width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', borderRadius: '6px',
          border: `1px solid ${error ? '#fca5a5' : '#d1d5db'}`,
          fontSize: '15px', color: '#111827', marginBottom: '12px',
        }}
      />
      {error && (
        <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '12px', borderRadius: '6px',
          background: loading ? '#93c5fd' : '#1e3a5f',
          color: '#fff', fontWeight: '600', fontSize: '15px',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Verifying…' : 'Log in'}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 4px' }}>
            Aetheris Vision
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Admin access</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
