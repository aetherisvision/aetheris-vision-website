import {
  ArrowRightIcon,
  CpuChipIcon,
  BeakerIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { SITE, SAM } from "@/lib/constants";

const DOC_REFERENCE = "AV-SVC-2026";

export const metadata = {
  title: `Services | ${SITE.name}`,
  description:
    "Two co-equal disciplines: Agentic OG, an expert-in-the-loop regridding-as-a-service engine, and scientific software & Earth-data consulting — both deliverable through federal, cleared, and commercial channels.",
};

const ogWorkflow = [
  { num: "1", title: "Describe", body: "Tell us the source data, the destination grid, and what the output needs to support — plain language, not a job spec." },
  { num: "2", title: "Assisted Request", body: "The request is formulated into a typed regrid job — method, projection, and diagnostics selected against the actual data, not guessed." },
  { num: "3", title: "Expert Review", body: "A human — an AMS Certified Consulting Meteorologist — checks the job before it runs. Every job has a person accountable for it." },
  { num: "4", title: "Verified Execution", body: "The job runs on the Rust/Julia compute stack. Mass-conservation residual, NaN fraction, and artifact flags are computed alongside the result, not left to the requester to discover." },
  { num: "5", title: "Delivery", body: "Output and diagnostics ship together, behind a short-lived signed URL — a defensible answer, not a raw file." },
];

const consultingAreas = [
  {
    icon: BeakerIcon,
    title: "Atmospheric-Science SME",
    body: "AMS Certified Consulting Meteorologist judgment applied to model output, grid interpolation, and forecast verification — the domain expertise that makes an automated pipeline trustworthy.",
  },
  {
    icon: CpuChipIcon,
    title: "AI/ML Weather Systems",
    body: "AI-hybrid systems built on modern NWP foundations (GraphCast, Pangu-Weather), uncertainty quantification, and large-scale reanalysis (ERA5, MERRA-2) tuned for production.",
  },
  {
    icon: ArrowPathIcon,
    title: "Data-Pipeline Modernization",
    body: "Assessment of existing operational frameworks and a practical path off them — legacy interpolation code, brittle ingest jobs, and undocumented grid assumptions replaced with something verifiable.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Technical Program Leadership",
    body: "Integrated product team direction for defense and civil-agency modernization efforts — technology assessment, risk-managed deployment, and workforce enablement.",
  },
];

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-24">
        <div className="mx-auto max-w-6xl px-6">

          {/* ── Document header ── */}
          <header className="mb-16">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3 mb-8 font-mono text-[11px] uppercase tracking-wider text-gray-500">
              <span>{SITE.legalName} · Services Overview</span>
              <span>{DOC_REFERENCE}</span>
            </div>
            <FadeIn>
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tight mb-6 leading-[1.1]">
                  Two disciplines. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
                    One standard of verification.
                  </span>
                </h1>
                <p className="text-lg text-gray-400 font-light leading-relaxed">
                  {SITE.name} runs on two co-equal disciplines: a regridding
                  engine that puts an expert in the loop on every job, and a
                  consulting practice in atmospheric science and applied AI. Both
                  are available through commercial, federal, and cleared delivery
                  channels — and neither is a discount version of the other.
                </p>
              </div>
            </FadeIn>
          </header>

          {/* ── 1.0 Agentic OG ── */}
          <FadeIn delay={0.05}>
            <section className="mb-8" aria-labelledby="sec-og">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-8 md:p-12">
                <div className="flex items-baseline gap-4 border-b border-white/15 pb-3 mb-6">
                  <span className="font-mono text-sm text-blue-400">1.0</span>
                  <h2 id="sec-og" className="text-lg font-semibold text-white tracking-tight uppercase">
                    Agentic OG — Regridding as a Service
                  </h2>
                </div>
                <p className="max-w-2xl text-gray-400 font-light leading-relaxed mb-10">
                  Moving satellite and NWP data onto whatever grid a downstream
                  system needs — with an expert in the loop at every job, not a
                  black-box handoff. Every job carries diagnostics, not just output.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                  {ogWorkflow.map((stage) => (
                    <div key={stage.num}>
                      <h3 className="flex items-baseline gap-3 text-white font-medium mb-2">
                        <span className="font-mono text-xs text-blue-400">{stage.num}</span>
                        {stage.title}
                      </h3>
                      <p className="text-sm text-gray-400 font-light leading-relaxed">{stage.body}</p>
                    </div>
                  ))}
                </div>
                <a
                  href="/agentic-og"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  Read the full technical brief <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>
          </FadeIn>

          {/* ── 2.0 Scientific Software & Earth-Data Consulting ── */}
          <FadeIn delay={0.1}>
            <section className="mb-8" aria-labelledby="sec-consulting">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-12">
                <div className="flex items-baseline gap-4 border-b border-white/15 pb-3 mb-6">
                  <span className="font-mono text-sm text-blue-400">2.0</span>
                  <h2 id="sec-consulting" className="text-lg font-semibold text-white tracking-tight uppercase">
                    Scientific Software &amp; Earth-Data Consulting
                  </h2>
                </div>
                <p className="max-w-2xl text-gray-400 font-light leading-relaxed mb-10">
                  The consultancy that builds its own verification-gated engine.
                  Direct engagement on atmospheric science, AI/ML weather systems,
                  and the pipeline work that keeps them honest in production.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {consultingAreas.map((area) => (
                    <div key={area.title} className="flex gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center">
                        <area.icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1.5">{area.title}</h3>
                        <p className="text-sm text-gray-400 font-light leading-relaxed">{area.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href="/contact?topic=Consulting%20Inquiry"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition mt-10"
                >
                  Start a conversation <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>
          </FadeIn>

          {/* ── 3.0 Federal & cleared delivery (channel layer, not a third service) ── */}
          <FadeIn delay={0.15}>
            <section className="mb-8" aria-labelledby="sec-federal">
              <div className="rounded-2xl border border-white/5 bg-black p-8 md:p-12">
                <div className="flex items-baseline gap-4 border-b border-white/15 pb-3 mb-6">
                  <span className="font-mono text-sm text-blue-400">3.0</span>
                  <h2 id="sec-federal" className="text-lg font-semibold text-white tracking-tight uppercase">
                    Federal &amp; Cleared Delivery
                  </h2>
                </div>
                <p className="max-w-2xl text-gray-400 font-light leading-relaxed mb-8">
                  Both disciplines above are deliverable through federal, prime-teaming,
                  and cleared channels — this is how we deliver, not a separate offering.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    `${SAM.setAside} Eligible`,
                    "HUBZone Eligible",
                    `CAGE ${SAM.cage}`,
                    `UEI ${SAM.uei}`,
                    "U.S. Government Secret Clearance",
                    "Prime Teaming",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-mono text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href="/capabilities"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  View the full capabilities statement <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>
          </FadeIn>

          {/* ── 4.0 Custom software & web (quiet final tier) ── */}
          <FadeIn delay={0.2}>
            <section className="mb-16" aria-labelledby="sec-web">
              <div className="flex items-baseline gap-4 border-b border-white/15 pb-3 mb-4">
                <span className="font-mono text-sm text-gray-500">4.0</span>
                <h2 id="sec-web" className="text-sm font-semibold text-gray-400 tracking-tight uppercase">
                  Custom Software &amp; Web
                </h2>
              </div>
              <p className="text-sm text-gray-500 font-light leading-relaxed max-w-2xl">
                We also build and maintain custom web applications — including this
                site — for select clients.{" "}
                <a href="/services/web" className="text-gray-400 hover:text-white underline underline-offset-2 transition">
                  Web development services
                </a>{" "}
                ·{" "}
                <a href="/portfolio" className="text-gray-400 hover:text-white underline underline-offset-2 transition inline-flex items-center gap-1">
                  Portfolio <CodeBracketIcon className="h-3.5 w-3.5" />
                </a>
              </p>
            </section>
          </FadeIn>

          {/* ── Document footer / CTA ── */}
          <footer className="border-t border-white/15 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
              {DOC_REFERENCE} · No pricing published — every engagement starts with a conversation
            </p>
            <a
              href="/contact"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition"
            >
              Start a Conversation
            </a>
          </footer>

        </div>
      </main>

      <Footer />
    </div>
  );
}
