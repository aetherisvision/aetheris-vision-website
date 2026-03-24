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
    title: "Operational Meteorology",
    items: [
      "Global atmospheric modeling and synoptic-scale forecasting",
      "Mesoscale convective analysis and prediction",
      "Arctic and complex terrain boundary layer dynamics",
      "Tactical weather support for high-consequence operations",
    ],
  },
  {
    title: "AI / ML Integration",
    items: [
      "Deep learning models for atmospheric prediction (GraphCast, Pangu-Weather architectures)",
      "Ensemble uncertainty quantification pipelines",
      "Large-scale reanalysis data processing (ERA5, MERRA-2)",
      "Cloud-native deployment on AWS GovCloud and Azure Government",
    ],
  },
  {
    title: "Technical Advisory",
    items: [
      "Architecture assessment for weather data ingestion and processing systems",
      "AI/ML model validation frameworks for operational deployment",
      "Workforce training and capability development",
      "Transition planning from legacy NWP to AI-augmented workflows",
    ],
  },
  {
    title: "State & Federal Contracting",
    items: [
      "SAM.gov federal registration — CAGE code and UEI pending issuance",
      "SDVOSB / VOSB — Veterans First Contracting Program eligible",
      "8(a) Business Development Program pathway active",
      "Oklahoma Supplier Portal — registration pending for state solicitations",
      "Active DoD Secret clearance (personal; facility clearance obtainable for sensitive program support)",
    ],
  },
  {
    title: "Technical Leadership",
    items: [
      "Program and project technical direction for defense and civil agency missions",
      "Integrated product team (IPT) leadership and cross-functional coordination",
      "Emerging technology assessment and adoption roadmaps for operational environments",
      "Mentorship and capability development for junior technical staff",
    ],
  },
  {
    title: "Web & Digital Solutions",
    items: [
      "Custom website design and development (Next.js, React, TypeScript)",
      "Performance-optimized, mobile-first deployments on Vercel and cloud platforms",
      "API integration, serverless back-end architecture, and database design",
      "Ongoing maintenance, analytics, and iterative feature development",
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
                { label: "Security Clearance", value: "Prior DoD Secret" },
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

          {/* Differentiators */}
          <FadeIn>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-10 mb-10 relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-4">Why Aetheris Vision</p>
                <h2 className="text-2xl font-semibold text-white mb-6">Unique Differentiators</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Narrow Depth Over Broad Coverage",
                      body: "We specialize in atmospheric science, AI/ML integration, and defense systems — not general IT consulting. Deep expertise produces better outcomes for specialized missions.",
                    },
                    {
                      title: "Operational Credibility",
                      body: "35 years of field-validated meteorology expertise alongside academic research partnerships. We have operated in the environments we advise on.",
                    },
                    {
                      title: "Streamlined Acquisition",
                      body: "VOSB set-aside eligibility and active DoD Secret clearance reduce acquisition complexity. SAM.gov registration in progress; SDVOSB/VetCert and 8(a) pathways queued.",
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
