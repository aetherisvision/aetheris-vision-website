'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const PRIMARY_NAV = [
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/intake', label: 'Intake & SOWs' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/documents', label: 'Documents' },
]

const MORE_NAV = [
  { href: '/admin/invoices', label: 'Invoices' },
  { href: '/admin/expenses', label: 'Expenses' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/gmail', label: 'Gmail' },
  { href: '/admin/omni-gridder', label: 'Omni-Gridder' },
  { href: '/performance', label: 'Performance' },
]

const dark = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  border: 'rgba(255,255,255,0.08)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  blue: '#5BA8D9',
  activeNav: 'rgba(91,168,217,0.15)',
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

function useAdminCounts(enabled: boolean) {
  const [counts, setCounts] = useState({ leads: 0, intake: 0 })

  useEffect(() => {
    if (!enabled) return

    Promise.allSettled([
      fetch('/api/admin/leads').then(response => response.ok ? response.json() : Promise.reject()),
      fetch('/api/admin/intake').then(response => response.ok ? response.json() : Promise.reject()),
    ]).then(([leadsResult, intakeResult]) => {
      const leads = leadsResult.status === 'fulfilled' ? leadsResult.value.leads ?? [] : []
      const submissions = intakeResult.status === 'fulfilled' ? intakeResult.value.submissions ?? [] : []
      setCounts({
        leads: leads.filter((lead: { stage?: string }) => lead.stage === 'new').length,
        intake: submissions.filter((submission: { status?: string }) => submission.status === 'new').length,
      })
    })
  }, [enabled])

  return counts
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/admin/login'
  const counts = useAdminCounts(!isLoginPage)
  const { open: moreOpen, setOpen: setMoreOpen } = useMoreDropdown()
  const moreActive = MORE_NAV.some(item => pathname.startsWith(item.href))
  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.replace('/admin/login')
    router.refresh()
  }

  if (isLoginPage) return <>{children}</>

  return (
    <div style={{ colorScheme: 'dark', backgroundColor: dark.bg, color: dark.text, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link href="/admin/leads" className="admin-brand" aria-label="Aetheris Vision admin home">
            <span className="admin-mark">AV</span>
            <span>Admin</span>
          </Link>

          <nav className="admin-nav" aria-label="Admin navigation">
            {PRIMARY_NAV.map(item => {
              const active = pathname.startsWith(item.href)
              const count = item.href === '/admin/leads'
                ? counts.leads
                : item.href === '/admin/intake'
                  ? counts.intake
                  : 0

              return (
                <Link key={item.href} href={item.href} className={`admin-nav-link${active ? ' active' : ''}`}>
                  {item.label}
                  {count > 0 && <span className="admin-count">{count}</span>}
                </Link>
              )
            })}

            <div className="admin-more">
              <button
                type="button"
                className={`admin-nav-link admin-more-button${moreActive ? ' active' : ''}`}
                onClick={event => {
                  event.stopPropagation()
                  setMoreOpen(!moreOpen)
                }}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                More <span aria-hidden="true">{moreOpen ? '▲' : '▾'}</span>
              </button>
              {moreOpen && (
                <div className="admin-more-menu" role="menu">
                  {MORE_NAV.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`admin-more-link${pathname.startsWith(item.href) ? ' active' : ''}`}
                      onClick={() => setMoreOpen(false)}
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <button type="button" onClick={handleLogout} className="admin-logout">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </header>

      {children}

      <style jsx>{`
        .admin-header {
          background: ${dark.surface};
          border-bottom: 1px solid ${dark.border};
          box-shadow: 0 1px 12px rgba(0, 0, 0, 0.3);
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .admin-header-inner {
          align-items: center;
          display: grid;
          gap: 20px;
          grid-template-columns: auto minmax(0, 1fr) auto;
          margin: 0 auto;
          max-width: 1080px;
          min-height: 56px;
        }
        .admin-brand {
          align-items: center;
          color: ${dark.text};
          display: flex;
          font-size: 14px;
          font-weight: 700;
          gap: 8px;
          text-decoration: none;
          white-space: nowrap;
        }
        .admin-mark {
          align-items: center;
          background: linear-gradient(135deg, #29426c, #5ba8d9);
          border-radius: 7px;
          box-shadow: 0 2px 8px rgba(91, 168, 217, 0.3);
          color: #fff;
          display: inline-flex;
          font-size: 11px;
          font-weight: 800;
          height: 28px;
          justify-content: center;
          width: 28px;
        }
        .admin-nav {
          align-items: center;
          display: flex;
          gap: 2px;
          min-width: 0;
        }
        .admin-nav-link {
          align-items: center;
          background: transparent;
          border: 0;
          border-radius: 6px;
          color: ${dark.textMuted};
          display: inline-flex;
          font: inherit;
          font-size: 13px;
          font-weight: 500;
          gap: 4px;
          padding: 6px 9px;
          text-decoration: none;
          white-space: nowrap;
        }
        .admin-nav-link.active {
          background: ${dark.activeNav};
          color: ${dark.blue};
          font-weight: 600;
        }
        .admin-count {
          align-items: center;
          background: ${dark.blue};
          border-radius: 999px;
          color: #fff;
          display: inline-flex;
          font-size: 10px;
          font-weight: 800;
          height: 16px;
          justify-content: center;
          min-width: 16px;
          padding: 0 4px;
        }
        .admin-more {
          position: relative;
        }
        .admin-more-button {
          cursor: pointer;
        }
        .admin-more-button span {
          font-size: 9px;
          opacity: 0.6;
        }
        .admin-more-menu {
          background: ${dark.surface};
          border: 1px solid ${dark.border};
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          left: 0;
          min-width: 150px;
          padding: 4px;
          position: absolute;
          top: calc(100% + 4px);
          z-index: 100;
        }
        .admin-more-link {
          border-radius: 5px;
          color: ${dark.textMuted};
          display: block;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 12px;
          text-decoration: none;
        }
        .admin-more-link.active {
          background: ${dark.activeNav};
          color: ${dark.blue};
        }
        .admin-logout {
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid ${dark.border};
          border-radius: 7px;
          color: ${dark.textMuted};
          cursor: pointer;
          display: flex;
          font-size: 13px;
          font-weight: 500;
          gap: 6px;
          padding: 7px 12px;
          white-space: nowrap;
        }
        @media (max-width: 840px) {
          .admin-header {
            padding: 0 14px;
          }
          .admin-header-inner {
            gap: 10px;
            grid-template-columns: 1fr auto;
            padding: 8px 0;
          }
          .admin-nav {
            flex-wrap: wrap;
            grid-column: 1 / -1;
            grid-row: 2;
          }
          .admin-logout span {
            display: none;
          }
          .admin-logout {
            padding: 8px;
          }
        }
        @media (max-width: 480px) {
          .admin-nav-link {
            font-size: 12px;
            padding: 6px 7px;
          }
          .admin-more-menu {
            left: auto;
            right: 0;
          }
        }
      `}</style>
    </div>
  )
}
