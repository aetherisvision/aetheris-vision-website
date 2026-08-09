import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OmniGridderComparison from "@/components/OmniGridderComparison";
import { SITE } from "@/lib/constants";

const CONSULTATION_HREF = "/book";
const DOC_REFERENCE = "AV-OG-2026";

export const metadata = {
  title: `Agentic OG — Regridding as a Service | ${SITE.name}`,
  description:
    "Agentic OG: an agentic regridding engine for Earth-observation data — conservative/bilinear/nearest weight computation, cloud-native job pipeline, deployed and validated on Google Cloud.",
};

const pipelineStages = [
  {
    num: "1",
    title: "Submit",
    body: "A typed job spec (source URI, destination grid, interpolation method) enters og-server through an authenticated submission service. Per-customer concurrency limits enforce tenant fairness before a job is ever queued.",
  },
  {
    num: "2",
    title: "Queue",
    body: "og-server writes job state to Firestore and publishes to a Pub/Sub topic. Submission and execution are decoupled — a slow or bursty client never blocks the worker fleet.",
  },
  {
    num: "3",
    title: "Compute",
    body: "og-worker pulls the job and dispatches to a Rust regrid engine backed by a persistent Julia process (spawned once per worker, reused across every job) computing conservative, bilinear, or nearest-neighbor weights — eliminating the 2-5s cold-start/JIT tax a fresh Julia process pays on every call.",
  },
  {
    num: "4",
    title: "Render & Deliver",
    body: "Regridded output is optionally rendered to a publication-quality map (Python/cartopy) and written to Cloud Storage behind a short-lived V4 signed URL — the job record never exposes a raw bucket path.",
  },
];

const engineeringFacts = [
  "Rust core (axum submission service + Pub/Sub worker) with a Julia numerical kernel bridge for weight computation — not a Python monolith.",
  "Per-customer concurrency limiting (tenant fairness) enforced at the service boundary before a job reaches the queue.",
  "V4 signed GCS URLs for result delivery — generated with short-lived machine credentials, not long-lived bucket ACLs.",
  "Quality diagnostics computed for every job: mass-conservation residual, NaN fraction, artifact flags — surfaced alongside the result, not buried in logs.",
  "Deployed on Google Cloud (Cloud Run Service + Cloud Run Job + Pub/Sub + Firestore), validated end-to-end against real jobs, not just unit tests.",
];

export default function AgenticOgPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          {/* ── Document header ── */}
          <header className="mb-14">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3 mb-8 font-mono text-[11px] uppercase tracking-wider text-gray-500">
              <span>{SITE.legalName} · Product Brief</span>
              <span>{DOC_REFERENCE} · Status: Private Staging Deployment</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                  Agentic OG
                </h1>
                <p className="text-gray-400 font-light leading-relaxed mb-4">
                  An agentic, cloud-native regridding engine for Earth-observation and
                  model data — built to move raw satellite and NWP grids onto whatever
                  grid a downstream system needs, without every team reimplementing
                  interpolation math.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-300">
                  <ShieldCheckIcon className="h-4 w-4" />
                  Reviewed by an AMS Certified Consulting Meteorologist (CCM) with an MSc in Applied AI
                </div>
              </div>
              <a
                href={CONSULTATION_HREF}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition shrink-0"
              >
                Schedule a Conversation
              </a>
            </div>
          </header>

          {/* ── 1.0 Pipeline ── */}
          <section className="mb-14" aria-labelledby="sec-pipeline">
            <div className="flex items-baseline gap-4 border-b border-white/15 pb-3 mb-6">
              <span className="font-mono text-sm text-blue-400">1.0</span>
              <h2 id="sec-pipeline" className="text-lg font-semibold text-white tracking-tight uppercase">
                How a Job Runs
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {pipelineStages.map((stage) => (
                <div key={stage.num}>
                  <h3 className="flex items-baseline gap-3 text-white font-medium mb-3">
                    <span className="font-mono text-xs text-gray-500">{stage.num}</span>
                    {stage.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-light leading-relaxed">{stage.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 2.0 Live proof ── */}
          <section className="mb-14" aria-labelledby="sec-proof">
            <div className="flex items-baseline gap-4 border-b border-white/15 pb-3 mb-6">
              <span className="font-mono text-sm text-blue-400">2.0</span>
              <h2 id="sec-proof" className="text-lg font-semibold text-white tracking-tight uppercase">
                Before &amp; After: Coordinate Geometry
              </h2>
            </div>
            <p className="mb-7 max-w-3xl text-sm font-light leading-relaxed text-gray-400">
              A controlled comparison makes the transformation visible without changing the underlying data. The source view uses geographic latitude–longitude coordinates; the result uses the Lambert Conformal geometry common in operational meteorology.
            </p>
            <OmniGridderComparison />
          </section>

          {/* ── 3.0 Engineering facts ── */}
          <section className="mb-16" aria-labelledby="sec-engineering">
            <div className="flex items-baseline gap-4 border-b border-white/15 pb-3 mb-6">
              <span className="font-mono text-sm text-blue-400">3.0</span>
              <h2 id="sec-engineering" className="text-lg font-semibold text-white tracking-tight uppercase">
                Engineering Notes
              </h2>
            </div>
            <ul className="space-y-2 border-l border-white/10 pl-5 ml-1">
              {engineeringFacts.map((item) => (
                <li key={item} className="text-sm text-gray-400 font-light leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* ── Document footer / CTA ── */}
          <footer className="border-t border-white/15 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
              {DOC_REFERENCE} · Deployed on Google Cloud · Private demonstrations by consultation
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={CONSULTATION_HREF}
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition"
              >
                Schedule a Conversation
              </a>
            </div>
          </footer>
        </div>
      </main>

      <Footer />
    </div>
  );
}
