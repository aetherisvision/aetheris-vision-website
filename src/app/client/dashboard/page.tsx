'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const brand = {
  navy: '#0f2240',
  navyMid: '#1e3a5f',
  blue: '#3b82f6',
}

interface Project {
  id: number
  name: string
  status: string
  start_date: string | null
  signed_at: string | null
  docuseal_submission_id: string | null
  current_phase: string | null
  phase_kickoff_date: string | null
  phase_design_date: string | null
  phase_development_date: string | null
  phase_review_date: string | null
  phase_launched_date: string | null
}

const PHASES = [
  { key: 'kickoff',     label: 'Kickoff',      dateField: 'phase_kickoff_date' as const,     description: 'Project scope, goals, and timeline confirmed.' },
  { key: 'design',      label: 'Design',        dateField: 'phase_design_date' as const,      description: 'Visual direction, mockups, and brand alignment.' },
  { key: 'development', label: 'Development',   dateField: 'phase_development_date' as const, description: 'Building and integrating all site functionality.' },
  { key: 'review',      label: 'Review',        dateField: 'phase_review_date' as const,      description: 'Testing, feedback rounds, and final refinements.' },
  { key: 'launched',    label: 'Launched',      dateField: 'phase_launched_date' as const,    description: 'Your site is live.' },
]

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProjectTimeline({ project }: { project: Project }) {
  const currentIdx = PHASES.findIndex(p => p.key === project.current_phase)
  const progressPct = currentIdx < 0 ? 0 : Math.round((currentIdx / (PHASES.length - 1)) * 100)

  return (
    <div>
      {/* Progress header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Project Roadmap
        </span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: brand.blue }}>
          {progressPct}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '999px', marginBottom: '28px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: `linear-gradient(90deg, ${brand.navyMid}, ${brand.blue})`,
          borderRadius: '999px',
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Phases */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: '11px', top: '12px', bottom: '12px',
          width: '2px', background: '#e2e8f0', zIndex: 0,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PHASES.map((phase, idx) => {
            const done    = idx < currentIdx
            const active  = idx === currentIdx
            const upcoming = idx > currentIdx
            const date    = formatDate(project[phase.dateField])

            return (
              <div key={phase.key} style={{
                display: 'flex', gap: '16px', position: 'relative', zIndex: 1,
                paddingBottom: idx < PHASES.length - 1 ? '22px' : '0',
              }}>
                {/* Dot */}
                <div style={{ flexShrink: 0, width: '24px', paddingTop: '1px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: done ? brand.navyMid : active ? brand.blue : '#fff',
                    border: `2px solid ${done ? brand.navyMid : active ? brand.blue : '#d1d5db'}`,
                    boxShadow: active ? `0 0 0 4px #dbeafe` : done ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {done && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {active && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                    {upcoming && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d1d5db' }} />}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingTop: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: active ? '700' : done ? '600' : '500',
                      color: active ? '#0f172a' : done ? '#334155' : '#94a3b8',
                    }}>
                      {phase.label}
                    </span>
                    {active && (
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                        borderRadius: '999px', background: '#dbeafe', color: '#1d4ed8',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        In progress
                      </span>
                    )}
                    {done && date && (
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>{date}</span>
                    )}
                  </div>
                  <p style={{
                    fontSize: '13px', margin: 0, lineHeight: '1.5',
                    color: active ? '#475569' : done ? '#64748b' : '#b0bdc9',
                  }}>
                    {phase.description}
                  </p>
                  {active && date && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Started {date}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const STATUS = {
  active:  { label: 'In Progress',        color: '#1d4ed8', bg: '#eff6ff',  dot: '#3b82f6' },
  signed:  { label: 'Signed',             color: '#065f46', bg: '#f0fdf4',  dot: '#22c55e' },
  pending: { label: 'Awaiting Signature', color: '#92400e', bg: '#fffbeb',  dot: '#f59e0b' },
  closed:  { label: 'Closed',             color: '#374151', bg: '#f9fafb',  dot: '#9ca3af' },
}

export default function ClientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.replace('/client/login'); return }
    fetch('/api/client/projects')
      .then(r => r.json())
      .then(data => { setProjects(data.projects ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px', border: `3px solid ${brand.blue}`,
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Loading your portal…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const clientName = session?.user?.name ?? 'there'
  const firstName = clientName.split(' ')[0]

  return (
    <div style={{
      minHeight: '100vh', background: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Top nav */}
      <header style={{
        background: `linear-gradient(135deg, ${brand.navy} 0%, ${brand.navyMid} 100%)`,
        padding: '0 24px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          maxWidth: '760px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          height: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '7px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: '800' }}>AV</span>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: '700', fontSize: '15px', margin: 0, lineHeight: '1.2' }}>
                Aetheris Vision
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>Client Portal</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/client/login' })}
            style={{
              padding: '7px 14px', borderRadius: '7px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)', fontSize: '13px',
              cursor: 'pointer', fontWeight: '500',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Log out
          </button>
        </div>
      </header>

      {/* Hero welcome band */}
      <div style={{
        background: `linear-gradient(135deg, ${brand.navy} 0%, ${brand.navyMid} 100%)`,
        padding: '0 24px 32px',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '800', margin: '0 0 4px' }}>
            Welcome back, {firstName}.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
            Here&apos;s the latest on your project.
          </p>
        </div>
      </div>

      {/* Main content — overlaps the header */}
      <main style={{ maxWidth: '760px', margin: '-8px auto 0', padding: '0 24px 60px' }}>
        {projects.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '56px 40px',
            textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#f1f5f9', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 style={{ color: '#334155', fontWeight: '700', fontSize: '16px', margin: '0 0 6px' }}>No projects yet</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              Your project documents and timeline will appear here once they&apos;re ready.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {projects.map(p => {
              const s = STATUS[p.status as keyof typeof STATUS] ?? STATUS.active
              return (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: '16px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
                  border: '1px solid #e8eef5',
                  overflow: 'hidden',
                }}>
                  {/* Card header accent */}
                  <div style={{ height: '4px', background: `linear-gradient(90deg, ${brand.navyMid}, ${brand.blue})` }} />

                  <div style={{ padding: '28px 32px' }}>
                    {/* Project title row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                          {p.name}
                        </h2>
                        {p.start_date && (
                          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                            Started {new Date(p.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                        <span style={{
                          padding: '5px 12px', borderRadius: '999px',
                          fontSize: '12px', fontWeight: '600',
                          color: s.color, background: s.bg,
                          display: 'flex', alignItems: 'center', gap: '5px',
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                          {s.label}
                        </span>
                        {p.docuseal_submission_id && p.status !== 'signed' && (
                          <a
                            href={`https://docuseal.com/s/${p.docuseal_submission_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '9px 18px', borderRadius: '8px',
                              background: `linear-gradient(135deg, ${brand.navyMid}, ${brand.navy})`,
                              color: '#fff', textDecoration: 'none',
                              fontSize: '13px', fontWeight: '700',
                              boxShadow: '0 2px 8px rgba(30,58,95,0.25)',
                              letterSpacing: '0.02em',
                            }}
                          >
                            Sign document →
                          </a>
                        )}
                      </div>
                    </div>

                    {p.current_phase && (
                      <>
                        <div style={{ borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />
                        <ProjectTimeline project={p} />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
            Questions about your project?{' '}
            <a href="mailto:marston@aetherisvision.com" style={{ color: brand.navyMid, fontWeight: '600', textDecoration: 'none' }}>
              marston@aetherisvision.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
