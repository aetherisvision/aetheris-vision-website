import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Capabilities Statement | ${SITE.name}`,
  description:
    "Aetheris Vision capabilities statement — NAICS codes, contract vehicles, core competencies, and past performance for state and federal procurement.",
};

const naicsCodes = [
  { code: "541360", description: "Geophysical Surveying and Mapping Services" },
  { code: "541690", description: "Other Scientific and Technical Consulting Services" },
  { code: "541511", description: "Custom Computer Programming Services" },
  { code: "541715", description: "R&D in Physical, Engineering, and Life Sciences" },
];

const pscCodes = [
  { code: "T009", description: "Technical Representation Services — Meteorology" },
  { code: "B504", description: "Special Studies/Analysis — Meteorology and Climatology" },
  { code: "D307", description: "IT and Telecom — IT Strategy and Architecture" },
];

const competencies = [
  {
    title: "Atmospheric Dominance",
    items: [
      "AI-hybrid systems that outperform billion-dollar legacy NWP models (GraphCast, Pangu-Weather integration)",
      "Mesoscale prediction systems engineered for high-stakes military operations",
      "Arctic and complex terrain dynamics — mastered through combat deployments",
      "Real-time decision support for missions where atmospheric uncertainty kills",
    ],
  },
  {
    title: "AI Revolution Engine",
    items: [
      "Deep learning architectures that replace traditional ensemble forecasting systems",
      "Uncertainty quantification pipelines that transform chaos into actionable intelligence",
      "Massive-scale reanalysis processing (ERA5, MERRA-2) — optimized for mission-critical deployment",
      "Cloud-native solutions deployed on AWS GovCloud and Azure Government infrastructure",
    ],
  },
  {
    title: "Strategic Transformation",
    items: [
      "Legacy system assassination — identifying and obsoleting inefficient operational frameworks",
      "AI/ML validation protocols that eliminate deployment risk in high-consequence environments",
      "Workforce evolution strategies — transforming traditional meteorologists into AI-augmented operators",
      "Technology transition leadership — from concept to operational superiority",
    ],
  },
  {
    title: "Federal Penetration",
    items: [
      "SAM.gov federal registration — CAGE code and UEI pending final issuance",
      "SDVOSB / VOSB — Direct access to Veterans First Contracting Program set-asides",
      "8(a) Business Development Program — Accelerated pathway active",
      "Oklahoma Supplier Portal — State-level contracting access queued",
      "Active DoD Secret clearance (personal; facility clearance scalable for classified program support)",
    ],
  },
  {
    title: "Command Authority",
    items: [
      "Technical direction for defense and civil agency transformation programs",
      "Integrated product team (IPT) leadership across multi-agency coordination efforts",
      "Disruptive technology assessment and rapid deployment for competitive advantage scenarios",
      "Next-generation workforce development — elevating junior staff through revolutionary methodologies",
    ],
  },
  {
    title: "Digital Precision Weapons",
    items: [
      "Custom applications engineered to eliminate operational inefficiencies (Next.js, React, TypeScript)",
      "High-performance, mobile-first deployments that dominate user experience expectations",
      "API integration warfare — connecting and optimizing disparate business systems",
      "Continuous evolution model — sites that improve and adapt without constant reinvestment",
    ],
  },
];

export default function CapabilitiesPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-6">

          {/* Header */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">
              Contracting Reference
            </p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
              <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
                Capabilities Statement
              </h1>
              <a
                href={`mailto:${SITE.email}?subject=Capabilities Statement PDF Request`}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-5 text-sm text-gray-300 hover:bg-white/[0.07] transition shrink-0"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Request PDF
              </a>
            </div>
            <div className="h-px w-12 bg-blue-500/50 mt-6 mb-10" />
          </FadeIn>

          {/* Company snapshot */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
              {[
                { label: "Legal Name", value: SITE.legalName },
                { label: "Business Type", value: "Veteran-Owned Small Business (VOSB)" },
                { label: "SAM.gov", value: "Registration In Progress" },
                { label: "8(a) Status", value: "Eligibility Under Review" },
                { label: "Security Clearance", value: "Active DoD Secret (Personal)" },
                { label: "Primary Contact", value: SITE.email },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm text-white font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* NAICS Codes */}
          <div className="mb-14">
            <FadeIn>
              <h2 className="text-xl font-semibold text-white mb-6">NAICS Codes</h2>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {naicsCodes.map((n, i) => (
                <FadeIn key={n.code} delay={i * 0.04}>
                  <div className="flex items-start gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <span className="text-blue-400 font-mono text-sm font-semibold shrink-0">{n.code}</span>
                    <span className="text-sm text-gray-400">{n.description}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* PSC Codes */}
          <div className="mb-14">
            <FadeIn>
              <h2 className="text-xl font-semibold text-white mb-6">PSC / Product Service Codes</h2>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pscCodes.map((p, i) => (
                <FadeIn key={p.code} delay={i * 0.04}>
                  <div className="flex items-start gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <span className="text-blue-400 font-mono text-sm font-semibold shrink-0">{p.code}</span>
                    <span className="text-sm text-gray-400">{p.description}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Core Competencies */}
          <div className="mb-14">
            <FadeIn>
              <h2 className="text-xl font-semibold text-white mb-6">Core Competencies</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {competencies.map((section, i) => (
                <FadeIn key={section.title} delay={i * 0.05} direction="up" className={i === competencies.length - 1 && competencies.length % 2 !== 0 ? "md:col-span-2 md:max-w-[calc(50%-0.75rem)] md:mx-auto md:w-full" : undefined}>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 h-full">
                    <h3 className="text-white font-medium mb-4">{section.title}</h3>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-400 font-light leading-relaxed">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Revolutionary Differentiators */}
          <FadeIn>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-10 mb-10 relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-4">The Aetheris Advantage</p>
                <h2 className="text-2xl font-semibold text-white mb-6">Why Legacy Systems Fear Us</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Surgical Precision Over Generalist Noise",
                      body: "While others offer everything, we dominate three domains: atmospheric physics, AI transformation, and defense systems. This isn't consulting — it's specialized warfare against inefficiency.",
                    },
                    {
                      title: "Battle-Tested Disruption",
                      body: "35 years revolutionizing how humans understand the atmosphere. From obsoleting manual forecasting in the 90s to pioneering AI-NWP hybrid models today. We don't just adapt to change — we cause it.",
                    },
                    {
                      title: "Zero-Friction Deployment",
                      body: "Active Secret clearance, VOSB eligibility, and streamlined federal pathways eliminate bureaucratic obstacles. While competitors navigate red tape, we're already delivering transformational outcomes.",
                    },
                  ].map((d) => (
                    <div key={d.title}>
                      <p className="text-white font-medium text-sm mb-2">{d.title}</p>
                      <p className="text-gray-400 text-sm font-light leading-relaxed">{d.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* CTA */}
          <FadeIn delay={0.1}>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/book"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition"
              >
                Book a Consultation
              </a>
              <a
                href={`mailto:${SITE.email}?subject=Capabilities Statement PDF Request`}
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
              >
                Request Capabilities PDF
              </a>
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
}
