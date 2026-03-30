'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const dark = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  surfaceAlt: '#112238',
  sidebar: '#0a1628',
  border: 'rgba(255,255,255,0.07)',
  borderLight: 'rgba(255,255,255,0.04)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6',
  blueGlow: 'rgba(59,130,246,0.15)',
  navy: '#1e3a5f',
}

interface Project {
  id: number
  name: string
  status: string
  start_date: string | null
  signed_at: string | null
  docuseal_submission_id: string | null
  current_phase: string | null
  phase_proposal_date: string | null
  phase_kickoff_date: string | null
  phase_design_date: string | null
  phase_development_date: string | null
  phase_review_date: string | null
  phase_launched_date: string | null
  preview_url: string | null
}

interface Doc { id: number; title: string; updated_at: string }
interface FullDoc extends Doc { content: string }

interface Invoice {
  id: number
  number: string
  description: string
  amount_cents: number
  status: string
  stripe_invoice_url: string | null
  due_date: string | null
  paid_at: string | null
  project_name: string | null
}

const PHASES = [
  { key: 'proposal',    label: 'Proposal',    dateField: 'phase_proposal_date' as const,    description: 'Project proposal and scope of work delivered.' },
  { key: 'kickoff',     label: 'Kickoff',     dateField: 'phase_kickoff_date' as const,     description: 'Project scope, goals, and timeline confirmed.' },
  { key: 'design',      label: 'Design',       dateField: 'phase_design_date' as const,      description: 'Visual direction, mockups, and brand alignment.' },
  { key: 'development', label: 'Development',  dateField: 'phase_development_date' as const, description: 'Building and integrating all site functionality.' },
  { key: 'review',      label: 'Review',       dateField: 'phase_review_date' as const,      description: 'Testing, feedback rounds, and final refinements.' },
  { key: 'launched',    label: 'Launched',     dateField: 'phase_launched_date' as const,    description: 'Your site is live.' },
]

const STATUS = {
  active:  { label: 'In Progress',        color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  dot: '#3b82f6' },
  signed:  { label: 'Signed',             color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)', dot: '#10b981' },
  pending: { label: 'Awaiting Signature', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',  dot: '#f59e0b' },
  closed:  { label: 'Closed',             color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', dot: 'rgba(255,255,255,0.25)' },
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProjectTimeline({ project }: { project: Project }) {
  const currentIdx = PHASES.findIndex(p => p.key === project.current_phase)
  const progressPct = currentIdx < 0 ? 0 : Math.round((currentIdx / (PHASES.length - 1)) * 100)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Project Roadmap
        </span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: dark.blue }}>{progressPct}% complete</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', marginBottom: '28px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #1e3a5f, #3b82f6)', borderRadius: '999px', transition: 'width 0.6s ease', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '11px', top: '12px', bottom: '12px', width: '2px', background: 'rgba(255,255,255,0.06)', zIndex: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PHASES.map((phase, idx) => {
            const done = idx < currentIdx
            const active = idx === currentIdx
            const date = formatDate(project[phase.dateField])
            return (
              <div key={phase.key} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, paddingBottom: idx < PHASES.length - 1 ? '22px' : '0' }}>
                <div style={{ flexShrink: 0, width: '24px', paddingTop: '1px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: done ? dark.navy : active ? dark.blue : 'rgba(255,255,255,0.04)', border: `2px solid ${done ? '#2563eb' : active ? dark.blue : 'rgba(255,255,255,0.12)'}`, boxShadow: active ? `0 0 0 4px ${dark.blueGlow}, 0 0 12px rgba(59,130,246,0.3)` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {active && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                    {!done && !active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />}
                  </div>
                </div>
                <div style={{ flex: 1, paddingTop: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: active ? '700' : done ? '600' : '500', color: active ? dark.text : done ? 'rgba(255,255,255,0.7)' : dark.textDim }}>
                      {phase.label}
                    </span>
                    {active && <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', background: dark.blueGlow, border: '1px solid rgba(59,130,246,0.3)', color: dark.blue, textTransform: 'uppercase', letterSpacing: '0.06em' }}>In progress</span>}
                    {done && date && <span style={{ fontSize: '12px', color: dark.textDim }}>{date}</span>}
                  </div>
                  <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5', color: active ? dark.textMuted : done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)' }}>
                    {phase.description}
                  </p>
                  {active && date && <p style={{ fontSize: '12px', color: dark.textDim, margin: '4px 0 0' }}>Started {date}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ClientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activeDoc, setActiveDoc] = useState<FullDoc | null>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [view, setView] = useState<'overview' | 'document'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.replace('/client/login'); return }
    Promise.allSettled([
      fetch('/api/client/projects').then(r => r.json()).catch(() => ({})),
      fetch('/api/client/documents').then(r => r.json()).catch(() => ({})),
      fetch('/api/client/invoices').then(r => r.json()).catch(() => ({})),
    ]).then(([projResult, docResult, invResult]) => {
      const projData = projResult.status === 'fulfilled' ? projResult.value : {}
      const docData  = docResult.status  === 'fulfilled' ? docResult.value  : {}
      const invData  = invResult.status  === 'fulfilled' ? invResult.value  : {}
      setProjects(projData.projects ?? [])
      setDocs(docData.documents ?? [])
      setInvoices(invData.invoices ?? [])
      setLoading(false)
    })
  }, [session, status, router])

  async function selectDoc(doc: Doc) {
    setDocLoading(true)
    setView('document')
    setActiveDoc(null)
    const res = await fetch(`/api/client/documents/${doc.id}`)
    const data = await res.json()
    setActiveDoc(data.document)
    setDocLoading(false)
  }

  function goOverview() {
    setView('overview')
    setActiveDoc(null)
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: dark.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: `2px solid rgba(59,130,246,0.3)`, borderTopColor: dark.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: dark.textDim, fontSize: '14px', margin: 0 }}>Loading your portal…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const firstName = (session?.user?.name ?? 'there').split(' ')[0]
  const hasDocs = docs.length > 0

  return (
    <div style={{ minHeight: '100vh', background: dark.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Background glows */}
      <div style={{ position: 'fixed', top: '-200px', left: '-200px', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,58,95,0.35) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7,15,30,0.9)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${dark.border}`, padding: '0 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '800' }}>AV</span>
            </div>
            <div>
              <p style={{ color: dark.text, fontWeight: '700', fontSize: '14px', margin: 0, lineHeight: '1.1' }}>Aetheris Vision</p>
              <p style={{ color: dark.textDim, fontSize: '10px', margin: 0, letterSpacing: '0.04em' }}>CLIENT PORTAL</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/client/login' })} style={{ padding: '7px 12px', borderRadius: '7px', border: `1px solid ${dark.border}`, background: 'rgba(255,255,255,0.04)', color: dark.textMuted, fontSize: '13px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Log out
          </button>
        </div>
      </header>

      {/* Body: sidebar + canvas */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1280px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Sidebar */}
        {hasDocs && (
          <aside style={{ width: '260px', flexShrink: 0, borderRight: `1px solid ${dark.border}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: '60px', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
            {/* Client greeting */}
            <div style={{ padding: '28px 20px 20px' }}>
              <p style={{ color: dark.textDim, fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Client Dashboard</p>
              <p style={{ color: dark.text, fontWeight: '700', fontSize: '17px', margin: 0 }}>Hey, {firstName}.</p>
            </div>

            {/* Overview link */}
            <div style={{ padding: '0 12px 8px' }}>
              <button
                onClick={goOverview}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: view === 'overview' ? 'rgba(59,130,246,0.12)' : 'transparent', transition: 'background 0.15s', textAlign: 'left' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke={view === 'overview' ? dark.blue : dark.textDim} strokeWidth="1.8"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke={view === 'overview' ? dark.blue : dark.textDim} strokeWidth="1.8"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke={view === 'overview' ? dark.blue : dark.textDim} strokeWidth="1.8"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke={view === 'overview' ? dark.blue : dark.textDim} strokeWidth="1.8"/>
                </svg>
                <span style={{ fontSize: '13px', fontWeight: '600', color: view === 'overview' ? dark.blue : dark.textMuted }}>Overview</span>
              </button>
            </div>

            {/* Documents section */}
            <div style={{ padding: '0 12px', flex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '12px 12px 8px' }}>Documents</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {docs.map(doc => {
                  const isActive = activeDoc?.id === doc.id && view === 'document'
                  return (
                    <button
                      key={doc.id}
                      onClick={() => selectDoc(doc)}
                      style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent', transition: 'background 0.15s', textAlign: 'left' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={isActive ? dark.blue : dark.textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="14 2 14 8 20 8" stroke={isActive ? dark.blue : dark.textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: isActive ? '600' : '500', color: isActive ? dark.text : dark.textMuted, margin: '0 0 2px', lineHeight: '1.35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title}
                        </p>
                        <p style={{ fontSize: '11px', color: dark.textDim, margin: 0 }}>
                          {new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '20px', borderTop: `1px solid ${dark.border}` }}>
              <p style={{ color: dark.textDim, fontSize: '11px', margin: 0, textAlign: 'center' }}>
                <a href="mailto:contact@aetherisvision.com" style={{ color: dark.blue, textDecoration: 'none', fontWeight: '500' }}>contact@aetherisvision.com</a>
              </p>
            </div>
          </aside>
        )}

        {/* Main canvas */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>

          {/* Overview */}
          {view === 'overview' && (
            <div style={{ padding: hasDocs ? '40px 48px 80px' : '48px 24px 80px', maxWidth: hasDocs ? 'none' : '760px', margin: hasDocs ? '0' : '0 auto' }}>
              {!hasDocs && (
                <div style={{ marginBottom: '40px' }}>
                  <p style={{ color: dark.textDim, fontSize: '13px', margin: '0 0 6px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '600' }}>Client Dashboard</p>
                  <h1 style={{ color: dark.text, fontSize: '30px', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Welcome back, {firstName}.</h1>
                  <p style={{ color: dark.textMuted, fontSize: '15px', margin: 0 }}>Here&apos;s the latest on your project.</p>
                </div>
              )}

              {hasDocs && (
                <div style={{ marginBottom: '32px' }}>
                  <h1 style={{ color: dark.text, fontSize: '26px', fontWeight: '800', margin: '0 0 4px', letterSpacing: '-0.01em' }}>Welcome back, {firstName}.</h1>
                  <p style={{ color: dark.textMuted, fontSize: '14px', margin: 0 }}>Here&apos;s the latest on your project.</p>
                </div>
              )}

              {projects.length === 0 ? (
                <div style={{ background: dark.surface, borderRadius: '16px', padding: '56px 40px', textAlign: 'center', border: `1px solid ${dark.border}` }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <h3 style={{ color: dark.textMuted, fontWeight: '600', fontSize: '16px', margin: '0 0 6px' }}>No projects yet</h3>
                  <p style={{ color: dark.textDim, fontSize: '14px', margin: 0 }}>Your project timeline will appear here once it&apos;s ready.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {projects.map(p => {
                    const s = STATUS[p.status as keyof typeof STATUS] ?? STATUS.active
                    return (
                      <div key={p.id} style={{ background: dark.surface, borderRadius: '16px', border: `1px solid ${dark.border}`, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <div style={{ height: '3px', background: 'linear-gradient(90deg, #1e3a5f, #3b82f6, #60a5fa)' }} />
                        <div style={{ padding: '28px 32px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '8px' }}>
                            <div>
                              <h2 style={{ fontSize: '20px', fontWeight: '800', color: dark.text, margin: '0 0 5px', letterSpacing: '-0.01em' }}>{p.name}</h2>
                              {p.start_date && <p style={{ color: dark.textDim, fontSize: '13px', margin: 0 }}>Started {new Date(p.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                              <span style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', color: s.color, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot, display: 'inline-block', boxShadow: `0 0 5px ${s.dot}` }} />
                                {s.label}
                              </span>
                              {p.docuseal_submission_id && !p.signed_at && (
                                <a href={`https://docuseal.com/s/${p.docuseal_submission_id}`} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 18px', borderRadius: '8px', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 16px rgba(59,130,246,0.3)', letterSpacing: '0.02em' }}>
                                  Sign document →
                                </a>
                              )}
                              {p.signed_at && (
                                <span style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  Signed
                                </span>
                              )}
                            </div>
                          </div>
                          {p.current_phase && (
                            <>
                              <div style={{ borderTop: `1px solid ${dark.border}`, margin: '24px 0' }} />
                              <ProjectTimeline project={p} />
                            </>
                          )}
                          {p.preview_url && (
                            <>
                              <div style={{ borderTop: `1px solid ${dark.border}`, margin: '24px 0' }} />
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                  <p style={{ fontSize: '11px', fontWeight: '700', color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Site Preview</p>
                                  <p style={{ fontSize: '13px', color: dark.textMuted, margin: 0 }}>View the current state of your website in development.</p>
                                </div>
                                <a href={p.preview_url} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 18px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: dark.blue, textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  View Site →
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Invoices */}
              {invoices.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h2 style={{ color: dark.text, fontSize: '18px', fontWeight: '700', margin: '0 0 16px', letterSpacing: '-0.01em' }}>Invoices</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {invoices.map(inv => {
                      const isPaid = inv.status === 'paid'
                      const isOverdue = inv.status === 'overdue'
                      const statusColor = isPaid ? '#34d399' : isOverdue ? '#f87171' : '#fbbf24'
                      const statusBg = isPaid ? 'rgba(52,211,153,0.1)' : isOverdue ? 'rgba(220,38,38,0.1)' : 'rgba(251,191,36,0.1)'
                      const statusBorder = isPaid ? 'rgba(52,211,153,0.25)' : isOverdue ? 'rgba(220,38,38,0.25)' : 'rgba(251,191,36,0.25)'
                      const statusLabel = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Due'
                      const amount = (inv.amount_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

                      return (
                        <div key={inv.id} style={{ background: dark.surface, border: `1px solid ${dark.border}`, borderRadius: '12px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: dark.text }}>{inv.number}</span>
                              <span style={{ padding: '2px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', color: statusColor, background: statusBg, border: `1px solid ${statusBorder}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {statusLabel}
                              </span>
                            </div>
                            <p style={{ color: dark.textMuted, fontSize: '13px', margin: '0 0 2px' }}>{inv.description}</p>
                            <p style={{ color: dark.textDim, fontSize: '12px', margin: 0 }}>
                              {inv.due_date && !isPaid && <>Due {new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>}
                              {isPaid && inv.paid_at && <>Paid {new Date(inv.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '20px', fontWeight: '800', color: isPaid ? '#34d399' : dark.text }}>{amount}</span>
                            {!isPaid && inv.stripe_invoice_url && (
                              <a href={inv.stripe_invoice_url} target="_blank" rel="noopener noreferrer"
                                style={{ padding: '9px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 16px rgba(59,130,246,0.3)', whiteSpace: 'nowrap' }}>
                                Pay Now →
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!hasDocs && (
                <div style={{ textAlign: 'center', marginTop: '48px' }}>
                  <p style={{ color: dark.textDim, fontSize: '13px', margin: 0 }}>
                    Questions?{' '}
                    <a href="mailto:contact@aetherisvision.com" style={{ color: dark.blue, fontWeight: '500', textDecoration: 'none' }}>contact@aetherisvision.com</a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Document canvas */}
          {view === 'document' && (
            <div style={{ padding: '40px 48px 80px', maxWidth: '820px' }}>
              {docLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: dark.textDim, fontSize: '14px', marginTop: '40px' }}>
                  <div style={{ width: '18px', height: '18px', border: `2px solid rgba(59,130,246,0.3)`, borderTopColor: dark.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Loading document…
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              ) : activeDoc ? (
                <>
                  {/* Document header */}
                  <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: `1px solid ${dark.border}` }}>
                    <p style={{ color: dark.textDim, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
                      Document
                    </p>
                    <h1 style={{ color: dark.text, fontSize: '28px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                      {activeDoc.title}
                    </h1>
                    <p style={{ color: dark.textDim, fontSize: '12px', margin: 0 }}>
                      Updated {new Date(activeDoc.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Rendered markdown */}
                  <div className="doc-viewer">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeDoc.content}
                    </ReactMarkdown>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @media (max-width: 640px) {
          aside { display: none !important; }
        }
      `}</style>
    </div>
  )
}
