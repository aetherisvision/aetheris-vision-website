import type { Metadata } from 'next'
import { sanitizePreviewReturnPath } from '@/lib/preview-auth'

export const metadata: Metadata = {
  title: 'Private Preview | Aetheris Vision',
  robots: { index: false, follow: false },
}

type PreviewPageProps = {
  searchParams: Promise<{
    error?: string
    next?: string
  }>
}

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const params = await searchParams
  const next = sanitizePreviewReturnPath(params.next)
  const hasError = params.error === 'incorrect'

  return (
    <main
      id="main"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070f1e] px-6 py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(30,58,95,0.55)_0%,transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-sm">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#29426C] to-[#5BA8D9] text-lg font-extrabold text-white shadow-[0_4px_18px_rgba(91,168,217,0.3)]">
            AV
          </div>
          <h1 className="text-lg font-bold text-slate-100">Aetheris Vision</h1>
          <p className="mt-1 text-sm text-white/40">Private working preview</p>
        </header>

        <section className="rounded-2xl border border-white/[0.08] bg-[#0d1b2e] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-semibold text-slate-100">Preview access</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">
            This site remains private while Agentic OG is being prepared for reliable demonstrations and published results.
          </p>

          <form action="/api/preview/auth" method="post" className="mt-6">
            <input type="hidden" name="next" value={next} />
            <label
              htmlFor="preview-password"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/35"
            >
              Preview password
            </label>
            <input
              id="preview-password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              aria-invalid={hasError}
              aria-describedby={hasError ? 'preview-error' : undefined}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-slate-100 outline-none transition placeholder:text-white/20 focus:border-[#5BA8D9] focus:ring-4 focus:ring-[#5BA8D9]/15"
            />

            {hasError && (
              <p id="preview-error" role="alert" className="mt-3 text-sm font-medium text-red-400">
                That preview password is not correct.
              </p>
            )}

            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-gradient-to-br from-[#486890] to-[#5BA8D9] px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(91,168,217,0.3)] transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#5BA8D9]/25"
            >
              Enter preview →
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
