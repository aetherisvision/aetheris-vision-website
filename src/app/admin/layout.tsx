'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/admin/intake',    label: 'Intake' },
  { href: '/admin/clients',   label: 'Clients' },
  { href: '/admin/projects',  label: 'Projects' },
  { href: '/admin/documents', label: 'Documents' },
  { href: '/admin/invoices',  label: 'Invoices' },
  { href: '/admin/expenses',  label: 'Expenses' },
  { href: '/admin/gmail',     label: 'Gmail' },
]

const MORE_NAV = [
  { href: '/performance', label: 'Performance' },
  { href: '/api-docs',    label: 'API Docs' },
  { href: '/metrics',     label: 'Metrics' },
]

const dark = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  border: 'rgba(255,255,255,0.08)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6',
  activeNav: 'rgba(59,130,246,0.15)',
}

function useMoreDropdown() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])
  return { open, setOpen }
}

function useNewIntakeCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    fetch('/api/admin/intake')
      .then(r => r.json())
      .then(data => {
        const newCount = (data.submissions ?? []).filter((s: { status: string }) => s.status === 'new').length
        setCount(newCount)
      })
      .catch(() => {})
  }, [])
  return count
}

async function handleLogout() {
  await fetch('/api/admin/auth', { method: 'DELETE' })
  window.location.href = '/admin/login'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'
  const newIntakeCount = useNewIntakeCount()
  const { open: moreOpen, setOpen: setMoreOpen } = useMoreDropdown()

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div style={{ colorScheme: 'dark', backgroundColor: dark.bg, color: dark.text, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{
        background: dark.surface,
        borderBottom: `1px solid ${dark.border}`,
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 12px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          maxWidth: '960px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '56px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              }}>
                <span style={{ color: '#fff', fontSize: '11px', fontWeight: '800' }}>AV</span>
              </div>
              <span style={{ fontWeight: '700', fontSize: '14px', color: dark.text }}>Admin</span>
            </div>
            <nav style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              {NAV.map(n => {
                const active = pathname.startsWith(n.href)
                const showBadge = n.href === '/admin/intake' && newIntakeCount > 0
                return (
                  <Link key={n.href} href={n.href} style={{
                    padding: '6px 10px', borderRadius: '6px', fontSize: '13px',
                    fontWeight: active ? '600' : '500',
                    color: active ? dark.blue : dark.textMuted,
                    background: active ? dark.activeNav : 'transparent',
                    textDecoration: 'none', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    whiteSpace: 'nowrap',
                  }}>
                    {n.label}
                    {showBadge && (
                      <span style={{
                        background: '#3b82f6', color: '#fff',
                        borderRadius: '999px', fontSize: '10px', fontWeight: '800',
                        minWidth: '16px', height: '16px', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                      }}>
                        {newIntakeCount}
                      </span>
                    )}
                  </Link>
                )
              })}

              {/* More dropdown for utility pages */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMoreOpen(!moreOpen) }}
                  style={{
                    padding: '6px 10px', borderRadius: '6px', fontSize: '13px',
                    fontWeight: '500', color: dark.textMuted, background: 'transparent',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px',
                    transition: 'all 0.15s',
                  }}
                >
                  More
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>{moreOpen ? '▲' : '▾'}</span>
                </button>
                {moreOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                    background: dark.surface, border: `1px solid ${dark.border}`,
                    borderRadius: '8px', padding: '4px', zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '140px',
                  }}>
                    {MORE_NAV.map(n => (
                      <Link key={n.href} href={n.href} style={{
                        display: 'block', padding: '8px 12px', borderRadius: '5px',
                        fontSize: '13px', fontWeight: '500', color: dark.textMuted,
                        textDecoration: 'none', transition: 'all 0.1s',
                      }}
                        onClick={() => setMoreOpen(false)}
                      >
                        {n.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '7px 14px', borderRadius: '7px',
              border: `1px solid ${dark.border}`,
              background: 'rgba(255,255,255,0.04)',
              color: dark.textMuted, fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Log out
          </button>
        </div>
      </header>
      {children}
    </div>
  )
}
