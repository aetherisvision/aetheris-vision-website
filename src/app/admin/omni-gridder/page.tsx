'use client'

import OmniGridderShowcase from '@/components/OmniGridderShowcase'

export default function OmniGridderDemoPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <OmniGridderShowcase mode="admin" />
      </div>
    </div>
  )
}
