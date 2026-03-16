'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  {
    key: 'kickoff',
    label: 'Kickoff',
    dateField: 'phase_kickoff_date' as const,
    description: 'Project scope, goals, and timeline confirmed.',
  },
  {
    key: 'design',
    label: 'Design',
    dateField: 'phase_design_date' as const,
    description: 'Visual direction, mockups, and brand alignment.',
  },
  {
    key: 'development',
    label: 'Development',
    dateField: 'phase_development_date' as const,
    description: 'Building and integrating all site functionality.',
  },
  {
    key: 'review',
    label: 'Review',
    dateField: 'phase_review_date' as const,
    description: 'Testing, feedback rounds, and final adjustments.',
  },
  {
    key: 'launched',
    label: 'Launched',
    dateField: 'phase_launched_date' as const,
    description: 'Site is live and handed off.',
  },
]

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProjectTimeline({ project }: { project: Project }) {
  const currentIdx = PHASES.findIndex(p => p.key === project.current_phase)
  const progressPct = currentIdx < 0 ? 0 : Math.round((currentIdx / (PHASES.length - 1)) * 100)

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          Project Roadmap
        </p>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
          {progressPct}% complete
        </p>
      </div>

      {/* Top progress bar */}
      <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '999px', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: 'linear-gradient(90deg, #1e3a5f, #3b82f6)',
          borderRadius: '999px',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Vertical phase list */}
      <div style={{ position: 'relative' }}>
        {/* Vertical connector line */}
        <div style={{
          position: 'absolute',
          left: '11px',
          top: '12px',
          bottom: '12px',
          width: '2px',
          background: '#e2e8f0',
          zIndex: 0,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {PHASES.map((phase, idx) => {
            const done = idx < currentIdx
            const active = idx === currentIdx
            const upcoming = idx > currentIdx
            const date = formatDate(project[phase.dateField])

            const dotColor = done ? '#1e3a5f' : active ? '#3b82f6' : '#cbd5e1'
            const labelColor = active ? '#0f172a' : done ? '#334155' : '#94a3b8'
            const descColor = active ? '#475569' : done ? '#64748b' : '#b0bdc9'

            return (
              <div key={phase.key} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, paddingBottom: idx < PHASES.length - 1 ? '20px' : '0' }}>
                {/* Dot */}
                <div style={{ flexShrink: 0, width: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: dotColor,
                    border: `2px solid ${active ? '#3b82f6' : done ? '#1e3a5f' : '#e2e8f0'}`,
                    boxShadow: active ? '0 0 0 4px #dbeafe' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {done && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {active && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
                    {upcoming && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e2e8f0' }} />}
                  </div>
                </div>

                {/* Content */}
                <div style={{ paddingTop: '2px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: active ? '700' : done ? '600' : '500', color: labelColor }}>
                      {phase.label}
                    </span>
                    {active && (
                      <span style={{
                        fontSize: '10px', fontWeight: '600', padding: '2px 7px',
                        borderRadius: '999px', background: '#dbeafe', color: '#1d4ed8',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        In progress
                      </span>
                    )}
                    {done && date && (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{date}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: descColor, margin: 0, lineHeight: '1.4' }}>
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

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  active:  { label: 'In Progress',        color: '#1d4ed8', bg: '#dbeafe' },
  signed:  { label: 'Signed',             color: '#065f46', bg: '#d1fae5' },
  pending: { label: 'Awaiting Signature', color: '#92400e', bg: '#fef3c7' },
  closed:  { label: 'Closed',             color: '#374151', bg: '#f3f4f6' },
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#64748b' }}>Loading…</p>
      </div>
    )
  }

  const clientName = session?.user?.name ?? 'Client'

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e3a5f', margin: '0 0 4px' }}>
            Aetheris Vision LLC
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>Welcome, {clientName}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/client/login' })}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}
        >
          Log out
        </button>
      </div>

      {/* Projects */}
      <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>
        Your Projects
      </h2>

      {projects.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', margin: 0 }}>No projects yet. Your documents will appear here once they&apos;re ready.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projects.map(p => {
            const s = STATUS_LABEL[p.status] ?? STATUS_LABEL.active
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: '12px', padding: '24px 28px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {/* Project header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <p style={{ fontWeight: '700', color: '#0f172a', margin: '0 0 4px', fontSize: '18px' }}>{p.name}</p>
                    {p.start_date && (
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                        Started {new Date(p.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', color: s.color, background: s.bg }}>
                      {s.label}
                    </span>
                    {p.docuseal_submission_id && p.status !== 'signed' && (
                      <a
                        href={`https://docuseal.com/s/${p.docuseal_submission_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '8px 16px', borderRadius: '6px', background: '#1e3a5f', color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
                      >
                        Sign document →
                      </a>
                    )}
                  </div>
                </div>

                {/* Divider */}
                {p.current_phase && (
                  <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '20px' }} />
                )}

                {/* Timeline */}
                {p.current_phase && <ProjectTimeline project={p} />}
              </div>
            )
          })}
        </div>
      )}

      <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '48px', textAlign: 'center' }}>
        Questions? Contact{' '}
        <a href="mailto:marston@aetherisvision.com" style={{ color: '#1e3a5f' }}>marston@aetherisvision.com</a>
      </p>
    </div>
  )
}
