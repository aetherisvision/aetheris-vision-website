import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OmniGridderComparison from "@/components/OmniGridderComparison";
import { SITE } from "@/lib/constants";

const CONSULTATION_HREF = "/book";

export const metadata = {
  title: `Agentic OG — Regridding as a Service | ${SITE.name}`,
  description:
    "Agentic OG transforms Earth-observation and model data onto the grid your downstream work requires, with the method matched to the geometry and data meaning.",
};

export default function AgenticOgPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pb-16 pt-24 sm:pb-24 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Hero */}
          <header className="mb-14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
                  Earth-Data Transformation
                </p>
                <h1 className="mb-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Agentic OG
                </h1>
                <p className="text-gray-400 font-light leading-relaxed mb-4">
                  An agentic, cloud-native regridding engine for Earth-observation and
                  model data — built to move raw satellite and NWP grids onto whatever
                  grid a downstream system needs, without every team reimplementing
                  interpolation math.
                </p>
                <div className="inline-flex max-w-full items-start gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs leading-relaxed text-blue-300 sm:rounded-full">
                  <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Reviewed by an AMS Certified Consulting Meteorologist (CCM) with an MSc in Applied AI</span>
                </div>
              </div>
              <a
                href={CONSULTATION_HREF}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-medium text-black transition hover:bg-gray-200 sm:w-auto"
              >
                Discuss Your Data
              </a>
            </div>
          </header>

          {/* Results comparison */}
          <section className="mb-14" aria-labelledby="sec-proof">
            <div className="mb-6 border-b border-white/15 pb-3">
              <h2 id="sec-proof" className="text-lg font-semibold text-white tracking-tight uppercase">
                Before &amp; After: Coordinate Geometry
              </h2>
            </div>
            <p className="mb-7 max-w-3xl text-sm font-light leading-relaxed text-gray-400">
              A controlled comparison makes the transformation visible without changing the underlying data. The source view uses geographic latitude–longitude coordinates; the result uses the Lambert Conformal geometry common in operational meteorology.
            </p>
            <OmniGridderComparison />
          </section>

          {/* Buyer CTA */}
          <section className="mb-16 rounded-xl border border-blue-500/25 bg-blue-500/[0.06] p-6 sm:p-8" aria-labelledby="sec-next-step">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Avoid the toolchain detour
            </p>
            <h2 id="sec-next-step" className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Get the transformation your work needs without spending months finding, installing, and validating the tools.
            </h2>
            <p className="mt-4 max-w-3xl text-sm font-light leading-relaxed text-gray-400">
              Tell us what data you have, what the destination requires, and how the result will be used. We&apos;ll identify the right approach and handle the specialized transformation work.
            </p>
            <a
              href={CONSULTATION_HREF}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black transition hover:bg-gray-200"
            >
              Discuss Your Data
            </a>
          </section>

          {/* Footer CTA */}
          <footer className="border-t border-white/15 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="max-w-2xl text-sm font-light leading-relaxed text-gray-500">
              Private demonstrations are available for teams with a specific transformation need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={CONSULTATION_HREF}
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition"
              >
                Discuss Your Data
              </a>
            </div>
          </footer>
        </div>
      </main>

      <Footer />
    </div>
  );
}
