import type { Metadata } from 'next'
import { sanitizePreviewReturnPath } from '@/lib/preview-auth'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Coming Soon | ${SITE.name}`,
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
      className="flex min-h-screen flex-col items-center justify-center bg-[#f4f1ea] px-6 py-16 text-[#17252f]"
    >
      <div className="w-full max-w-2xl">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">
            Aetheris Vision LLC
          </p>
          <h1 className="mt-6 font-serif text-[clamp(3.4rem,9vw,6.4rem)] leading-[0.95] tracking-[-0.04em] text-[#0a1628]">
            Coming in 2026
          </h1>
          <p className="mt-7 text-base font-semibold uppercase leading-7 tracking-[0.08em] text-[#344852]">
            Consultancy in Applied Meteorology
          </p>
          <p className="mx-auto mt-6 max-w-md text-base leading-8 text-[#4b5d64]">
            Our new site is being finalized. For consulting inquiries, use the{' '}
            <a
              href="/contact"
              className="font-semibold text-[#29426c] underline decoration-[#29426c]/30 underline-offset-4 hover:decoration-[#29426c]"
            >
              project inquiry form
            </a>
            .
          </p>
        </header>

        <section className="mx-auto mt-16 w-full max-w-sm border-t border-[#17252f]/15 pt-10">
          <h2 className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">
            Client &amp; partner preview
          </h2>

          <form action="/api/preview/auth" method="post" className="mt-6">
            <input type="hidden" name="next" value={next} />
            <label
              htmlFor="preview-password"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#5b6c72]"
            >
              Preview password
            </label>
            <input
              id="preview-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-invalid={hasError}
              aria-describedby={hasError ? 'preview-error' : undefined}
              className="block w-full border border-[#17252f]/25 bg-white px-4 py-3.5 text-[15px] text-[#0a1628] outline-none transition focus:border-[#29426c] focus:ring-4 focus:ring-[#29426c]/10"
            />

            {hasError && (
              <p id="preview-error" role="alert" className="mt-3 text-sm font-medium text-[#a03123]">
                That preview password is not correct.
              </p>
            )}

            <button
              type="submit"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-3 bg-[#0a1628] px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#29426c]"
            >
              Enter preview →
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
