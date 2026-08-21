'use client'

import { useEffect, useState } from 'react'

const dark = {
  bg: '#070f1e',
  surface: '#0d1b2e',
  surfaceHover: '#112338',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  text: '#f1f5f9',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.25)',
  blue: '#5BA8D9',
  blueGlow: 'rgba(91,168,217,0.15)',
  success: 'rgba(16,185,129,0.08)',
  successBorder: 'rgba(16,185,129,0.2)',
  successText: '#6ee7b7',
  warning: 'rgba(245,158,11,0.08)',
  warningBorder: 'rgba(245,158,11,0.25)',
  warningText: '#fcd34d',
  danger: 'rgba(220,38,38,0.12)',
  dangerText: '#f87171',
  dangerBorder: 'rgba(220,38,38,0.25)',
  dangerSolid: '#dc2626',
}

interface Review {
  id: number
  client_name: string
  client_role: string | null
  client_company: string | null
  rating: number
  body: string
  approved: boolean
  created_at: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: '15px', letterSpacing: '1px' }}>
      {'★'.repeat(rating)}
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)
  const [confirmReject, setConfirmReject] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [copied, setCopied] = useState(false)

  async function fetchReviews() {
    const r = await fetch('/api/admin/reviews')
    const data = await r.json()
    // Sort: pending first, then approved; within each group newest first
    const sorted = (data.reviews ?? []).sort((a: Review, b: Review) => {
      if (a.approved !== b.approved) return a.approved ? 1 : -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    setReviews(sorted)
    setLoading(false)
  }

  // Load once on mount; fetchReviews is stable for this page's lifetime.
  useEffect(() => { void fetchReviews() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleAction(id: number, action: 'approve' | 'reject') {
    setActionInProgress(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Request failed')

      if (action === 'approve') {
        setReviews((rs) =>
          rs.map((r) => (r.id === id ? { ...r, approved: true } : r))
            .sort((a, b) => {
              if (a.approved !== b.approved) return a.approved ? 1 : -1
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })
        )
        showToast('Review approved and is now live.')
      } else {
        setReviews((rs) => rs.filter((r) => r.id !== id))
        showToast('Review rejected and deleted.')
      }
    } catch {
      showToast('Something went wrong. Please try again.')
    } finally {
      setActionInProgress(null)
      setConfirmReject(null)
    }
  }

  async function copyReviewLink() {
    const url = 'https://aetherisvision.com/review'
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const pending = reviews.filter((r) => !r.approved)
  const approved = reviews.filter((r) => r.approved)

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: dark.text, marginBottom: '6px' }}>
            Client Reviews
          </h1>
          <p style={{ color: dark.textMuted, fontSize: '14px' }}>
            Approve reviews to make them visible on the homepage.
          </p>
        </div>
        <button
          onClick={copyReviewLink}
          style={{
            padding: '9px 16px',
            borderRadius: '8px',
            border: `1px solid ${dark.border}`,
            background: 'rgba(91,168,217,0.1)',
            color: dark.blue,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? '✓ Copied!' : '🔗 Copy Review Link'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: dark.success,
          color: dark.successText,
          border: `1px solid ${dark.successBorder}`,
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          {toast}
        </div>
      )}

      {loading ? (
        <p style={{ color: dark.textMuted }}>Loading…</p>
      ) : reviews.length === 0 ? (
        <div style={{
          background: dark.surface,
          border: `1px solid ${dark.border}`,
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p style={{ color: dark.textDim, fontSize: '15px' }}>No reviews yet.</p>
          <p style={{ color: dark.textDim, fontSize: '13px', marginTop: '8px' }}>
            Share the review link with clients to start collecting feedback.
          </p>
        </div>
      ) : (
        <>
          {/* Pending section */}
          {pending.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '700', color: dark.warningText, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Pending Approval ({pending.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pending.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    actionInProgress={actionInProgress}
                    confirmReject={confirmReject}
                    setConfirmReject={setConfirmReject}
                    onApprove={() => handleAction(r.id, 'approve')}
                    onReject={() => handleAction(r.id, 'reject')}
                    isPending
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved section */}
          {approved.length > 0 && (
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: '700', color: dark.successText, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Live ({approved.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {approved.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    actionInProgress={actionInProgress}
                    confirmReject={confirmReject}
                    setConfirmReject={setConfirmReject}
                    onApprove={() => handleAction(r.id, 'approve')}
                    onReject={() => handleAction(r.id, 'reject')}
                    isPending={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReviewCard({
  review: r,
  actionInProgress,
  confirmReject,
  setConfirmReject,
  onApprove,
  onReject,
  isPending,
}: {
  review: Review
  actionInProgress: number | null
  confirmReject: number | null
  setConfirmReject: (id: number | null) => void
  onApprove: () => void
  onReject: () => void
  isPending: boolean
}) {
  const busy = actionInProgress === r.id

  return (
    <div
      style={{
        background: dark.surface,
        border: `1px solid ${isPending ? dark.warningBorder : dark.successBorder}`,
        borderRadius: '12px',
        padding: '20px 22px',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: dark.text, fontSize: '15px' }}>{r.client_name}</span>
            {(r.client_role || r.client_company) && (
              <span style={{ color: dark.textMuted, fontSize: '13px' }}>
                {[r.client_role, r.client_company].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stars rating={r.rating} />
            <span style={{ color: dark.textDim, fontSize: '12px' }}>
              {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span style={{
          padding: '3px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: isPending ? dark.warning : dark.success,
          color: isPending ? dark.warningText : dark.successText,
          border: `1px solid ${isPending ? dark.warningBorder : dark.successBorder}`,
          whiteSpace: 'nowrap',
        }}>
          {isPending ? 'Pending' : 'Approved'}
        </span>
      </div>

      {/* Body */}
      <p style={{ color: dark.textMuted, fontSize: '14px', lineHeight: '1.65', margin: '0 0 16px' }}>
        {r.body.length > 300 ? r.body.slice(0, 300) + '…' : r.body}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {!r.approved && (
          <button
            onClick={onApprove}
            disabled={busy}
            style={{
              padding: '8px 16px',
              borderRadius: '7px',
              border: `1px solid ${dark.successBorder}`,
              background: dark.success,
              color: dark.successText,
              fontSize: '13px',
              fontWeight: '600',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? '…' : '✓ Approve'}
          </button>
        )}

        {confirmReject === r.id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: dark.dangerText }}>Delete this review?</span>
            <button
              onClick={onReject}
              disabled={busy}
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: '700',
                background: dark.dangerSolid,
                color: '#fff',
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? '…' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmReject(null)}
              style={{
                padding: '7px 10px',
                borderRadius: '7px',
                fontSize: '12px',
                color: dark.textMuted,
                background: 'transparent',
                border: `1px solid ${dark.border}`,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReject(r.id)}
            disabled={busy}
            style={{
              padding: '8px 14px',
              borderRadius: '7px',
              border: `1px solid ${dark.dangerBorder}`,
              background: dark.danger,
              color: dark.dangerText,
              fontSize: '13px',
              fontWeight: '500',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            {r.approved ? 'Delete' : 'Reject'}
          </button>
        )}
      </div>
    </div>
  )
}
