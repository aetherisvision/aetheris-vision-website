'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const dark = {
  surface: '#0d1b2e',
  surfaceAlt: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6',
  blueTag: 'rgba(59,130,246,0.15)',
  blueTagText: '#93c5fd',
  green: 'rgba(34,197,94,0.15)',
  greenText: '#86efac',
  greenBorder: 'rgba(34,197,94,0.25)',
  danger: 'rgba(220,38,38,0.12)',
  dangerText: '#f87171',
}

type ConnectionStatus = {
  biz: { connected: boolean; email: string | null }
  per: { connected: boolean; email: string | null }
}

function GmailPageInner() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  const justConnected = searchParams.get('connected')
  const connectError = searchParams.get('error')

  useEffect(() => {
    fetch('/api/auth/gmail/status').then(r => r.json()).then(setStatus)
  }, [justConnected])

  async function runNow() {
    setRunning(true)
    setRunResult(null)
    const res = await fetch('/api/cron/receipts', { credentials: 'include' })
    const data = await res.json()
    setRunResult(JSON.stringify(data, null, 2))
    setRunning(false)
  }

  return (
    <div style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, marginBottom: '8px' }}>
          Gmail Receipt Scanner
        </h1>
        <p style={{ color: dark.textMuted, fontSize: '13px', marginBottom: '32px' }}>
          Connect your Gmail accounts to automatically import receipts as expenses each morning.
        </p>

        {justConnected && (
          <div style={{ background: dark.green, border: `1px solid ${dark.greenBorder}`, borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', color: dark.greenText, fontSize: '14px' }}>
            Account connected successfully.
          </div>
        )}

        {connectError && (
          <div style={{ background: dark.danger, border: `1px solid rgba(220,38,38,0.25)`, borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', color: dark.dangerText, fontSize: '14px' }}>
            Connection error: {connectError === 'no_refresh_token'
              ? 'Google did not return a refresh token. Try connecting again.'
              : connectError}
          </div>
        )}

        {/* Business account */}
        <AccountCard
          label="Business"
          description="marston@aetherisvision.com"
          account="biz"
          connected={status?.biz.connected ?? false}
          email={status?.biz.email ?? null}
        />

        {/* Personal account */}
        <AccountCard
          label="Personal"
          description="marston.s.ward@gmail.com"
          account="per"
          connected={status?.per.connected ?? false}
          email={status?.per.email ?? null}
        />

        {/* Manual trigger */}
        <div style={{ marginTop: '32px', background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '20px' }}>
          <p style={{ color: dark.textMuted, fontSize: '13px', marginBottom: '14px' }}>
            The scanner runs automatically at 6 AM daily. You can also run it manually.
          </p>
          <button
            onClick={runNow}
            disabled={running}
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', padding: '9px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}
          >
            {running ? 'Running...' : 'Run scanner now'}
          </button>
          {runResult && (
            <pre style={{ marginTop: '16px', fontSize: '12px', color: dark.textMuted, background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '14px', overflowX: 'auto' }}>
              {runResult}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

function AccountCard({ label, description, account, connected, email }: {
  label: string
  description: string
  account: 'biz' | 'per'
  connected: boolean
  email: string | null
}) {
  return (
    <div style={{ background: dark.surface, border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : dark.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontWeight: '700', color: dark.text, fontSize: '15px' }}>{label} Gmail</span>
          {connected && (
            <span style={{ background: dark.green, color: dark.greenText, border: `1px solid ${dark.greenBorder}`, padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
              Connected
            </span>
          )}
        </div>
        <p style={{ color: dark.textMuted, fontSize: '13px', margin: 0 }}>
          {connected && email ? email : description}
        </p>
      </div>
      <a
        href={`/api/auth/gmail/start?account=${account}`}
        style={{ background: connected ? 'transparent' : 'linear-gradient(135deg, #2563eb, #3b82f6)', color: connected ? dark.textMuted : '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: connected ? `1px solid ${dark.border}` : 'none', textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        {connected ? 'Reconnect' : 'Connect'}
      </a>
    </div>
  )
}

export default function GmailPage() {
  return (
    <Suspense>
      <GmailPageInner />
    </Suspense>
  )
}
