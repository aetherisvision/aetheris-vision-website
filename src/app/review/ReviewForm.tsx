'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import TurnstileWidget from '@/components/TurnstileWidget'

function StarSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-av-accent rounded"
          style={{
            color: star <= (hovered || value) ? '#f59e0b' : 'rgba(255,255,255,0.15)',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '2px',
          }}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-400 self-center">
          {value === 1 ? 'Poor' : value === 2 ? 'Fair' : value === 3 ? 'Good' : value === 4 ? 'Great' : 'Excellent'}
        </span>
      )}
    </div>
  )
}

export default function ReviewForm() {
  const searchParams = useSearchParams()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [form, setForm] = useState({
    client_name: '',
    client_role: '',
    client_company: '',
    rating: 0,
    body: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)
  const [website, setWebsite] = useState('')
  const requiresTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

  // Pre-fill from query params
  useEffect(() => {
    const name = searchParams.get('name')
    const company = searchParams.get('company')
    const role = searchParams.get('role')
    setForm((f) => ({
      ...f,
      client_name: name?.slice(0, 200) ?? f.client_name,
      client_company: company?.slice(0, 200) ?? f.client_company,
      client_role: role?.slice(0, 200) ?? f.client_role,
    }))
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.client_name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (form.rating === 0) {
      setError('Please select a star rating.')
      return
    }
    if (form.body.trim().length < 20) {
      setError('Review must be at least 20 characters.')
      return
    }
    if (requiresTurnstile && !turnstileToken) {
      setError('Please complete the human verification before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: form.client_name.trim(),
          client_role: form.client_role.trim() || null,
          client_company: form.client_company.trim() || null,
          rating: form.rating,
          body: form.body.trim(),
          turnstileToken,
          _gotcha: website,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setTurnstileToken(null)
        setTurnstileResetKey((key) => key + 1)
        return
      }
      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setTurnstileToken(null)
      setTurnstileResetKey((key) => key + 1)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div
        style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: '12px',
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
        <h2 style={{ color: '#6ee7b7', fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
          Thank you for your review!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: '1.6' }}>
          Your review has been submitted and will appear on our site after approval.
          We appreciate you taking the time to share your experience.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    fontSize: '16px',
    color: '#f1f5f9',
    background: 'rgba(255,255,255,0.04)',
    outline: 'none',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    marginBottom: '7px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Name */}
      <div>
        <label htmlFor="client_name" style={labelStyle}>Your name *</label>
        <input
          id="client_name"
          type="text"
          required
          autoComplete="name"
          placeholder="e.g., Jane Smith"
          value={form.client_name}
          onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
          maxLength={200}
          style={inputStyle}
        />
      </div>

      {/* Role + Company side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label htmlFor="client_role" style={labelStyle}>Your title / role</label>
          <input
            id="client_role"
            type="text"
            autoComplete="organization-title"
            placeholder="e.g., Owner, Marketing Director"
            value={form.client_role}
            onChange={(e) => setForm((f) => ({ ...f, client_role: e.target.value }))}
            maxLength={200}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="client_company" style={labelStyle}>Company</label>
          <input
            id="client_company"
            type="text"
            autoComplete="organization"
            placeholder="e.g., Tropical Hut OKC"
            value={form.client_company}
            onChange={(e) => setForm((f) => ({ ...f, client_company: e.target.value }))}
            maxLength={200}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Star rating */}
      <div>
        <label style={labelStyle}>Rating *</label>
        <StarSelector
          value={form.rating}
          onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
        />
      </div>

      {/* Review body */}
      <div>
        <label htmlFor="review_body" style={labelStyle}>Your review *</label>
        <textarea
          id="review_body"
          ref={textareaRef}
          required
          rows={5}
          placeholder="Tell us about your experience working with Aetheris Vision. What did we build for you? What made the difference?"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          maxLength={5000}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '120px', lineHeight: '1.6' }}
        />
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
          {form.body.trim().length}/5000 characters (minimum 20)
        </p>
      </div>

      {/* Automated form fillers commonly populate this off-screen field. */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        <label htmlFor="review_website">Website</label>
        <input
          id="review_website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <TurnstileWidget
        action="review"
        onTokenChange={setTurnstileToken}
        resetKey={turnstileResetKey}
      />

      {/* Error message */}
      {error && (
        <div
          style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '14px',
          }}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || (requiresTurnstile && !turnstileToken)}
        style={{
          padding: '13px 28px',
          borderRadius: '8px',
          background: submitting || (requiresTurnstile && !turnstileToken)
            ? 'rgba(91,168,217,0.4)'
            : 'linear-gradient(135deg, #486890, #5BA8D9)',
          color: '#fff',
          fontWeight: '600',
          fontSize: '15px',
          border: 'none',
          cursor: submitting || (requiresTurnstile && !turnstileToken) ? 'not-allowed' : 'pointer',
          boxShadow: submitting || (requiresTurnstile && !turnstileToken) ? 'none' : '0 4px 14px rgba(91,168,217,0.3)',
          transition: 'all 0.15s',
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  )
}
