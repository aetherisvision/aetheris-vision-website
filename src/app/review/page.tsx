import { Suspense } from 'react'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ReviewForm from './ReviewForm'

export const metadata: Metadata = {
  title: 'Leave a Review | Aetheris Vision',
  description: 'Share your experience working with Aetheris Vision. Your feedback helps us improve and helps other clients find the right partner.',
}

export default function ReviewPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#101820]">
      <Navbar />

      <main id="main" className="flex-1 py-24 px-6">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#5BA8D9',
                marginBottom: '12px',
              }}
            >
              Client Review
            </p>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '600',
                color: '#f1f5f9',
                marginBottom: '12px',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
              }}
            >
              Share your experience
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: '1.6', fontWeight: '300' }}>
              Your honest feedback means a lot. It helps us improve and helps other business owners and organizations know what to expect when they work with us.
            </p>
          </div>

          {/* Form card */}
          <div
            style={{
              background: '#111014',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading form…</div>}>
              <ReviewForm />
            </Suspense>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
