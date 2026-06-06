import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { SITE, SAM } from "@/lib/constants";
import EmailLink from "@/components/EmailLink";

export const metadata = {
  title: `Capabilities Statement | ${SITE.name}`,
  description:
    "Aetheris Vision capabilities statement: NAICS codes, contract vehicles, core competencies, and past performance for state and federal procurement.",
};

const naicsCodes = [
  { code: "541690", description: "Other Scientific and Technical Consulting Services", primary: true },
  { code: "541511", description: "Custom Computer Programming Services", primary: false },
  { code: "541512", description: "Computer Systems Design Services", primary: false },
  { code: "541519", description: "Other Computer Related Services", primary: false },
  { code: "541360", description: "Geophysical Surveying and Mapping Services", primary: false },
  { code: "541618", description: "Other Management Consulting Services", primary: false },
  { code: "541620", description: "Environmental Consulting Services", primary: false },
];

const pscCodes = [
  { code: "R427", description: "Support, Professional: Weather Reporting/Observation" },
  { code: "R425", description: "Support, Professional: Engineering/Technical" },
  { code: "R408", description: "Support, Professional: Program Management/Support" },
  { code: "R405", description: "Support, Professional: Operations Research/Quantitative Analysis" },
  { code: "DA01", description: "IT and Telecom, Business Application/Application Development Support Services (Labor)" },
  { code: "DA10", description: "IT and Telecom, Business Application/Application Development Software as a Service" },
  { code: "DB02", description: "IT and Telecom, Compute Support Services, Non-HPC (Labor)" },
  { code: "B510", description: "Special Studies/Analysis, Environmental Assessments" },
  { code: "B524", description: "Special Studies/Analysis, Mathematical/Statistical" },
  { code: "B526", description: "Special Studies/Analysis, Oceanological" },
  { code: "B529", description: "Special Studies/Analysis, Scientific Data" },
  { code: "B544", description: "Special Studies/Analysis, Technology" },
];

const competencies = [
  {
    title: "Atmospheric Science & Forecasting",
    items: [
      "AI-hybrid systems built on modern NWP models (GraphCast, Pangu-Weather integration)",
      "Mesoscale prediction systems for demanding operational environments",
      "Arctic and complex terrain dynamics, informed by years of field forecasting",
      "Real-time decision support for time-sensitive, high-consequence operations",
    ],
  },
  {
    title: "Applied AI & Machine Learning",
    items: [
      "Deep learning architectures that complement and modernize ensemble forecasting",
      "Uncertainty quantification pipelines that turn complex data into clear, actionable output",
      "Large-scale reanalysis processing (ERA5, MERRA-2) tuned for production deployment",
      "Cloud-native solutions deployed on AWS GovCloud and Azure Government infrastructure",
    ],
  },
  {
    title: "Modernization & Transition",
    items: [
      "Assessment of existing operational frameworks and practical paths to improve them",
      "AI/ML validation protocols that reduce deployment risk in high-consequence environments",
      "Workforce enablement: helping meteorologists work effectively alongside AI tools",
      "Technology transition support, from concept through operational use",
    ],
  },
  {
    title: "Federal Registrations",
    items: [
      `SAM.gov registered: UEI ${SAM.uei}, CAGE ${SAM.cage}`,
      `${SAM.setAside} eligible, with access to Veterans First Contracting Program set-asides`,
      "Oklahoma Supplier Portal: state-level contracting access (registration in progress)",
      "DoD Secret clearance (held; facility clearance scalable for classified program support)",
    ],
  },
  {
    title: "Program Leadership",
    items: [
      "Technical direction for defense and civil agency modernization programs",
      "Integrated product team (IPT) leadership across multi-agency coordination efforts",
      "Technology assessment and rapid, responsible deployment",
      "Workforce development: mentoring junior staff and building team capability",
    ],
  },
  {
    title: "Custom Software & Web",
    items: [
      "Custom applications built to streamline real operational workflows (Next.js, React, TypeScript)",
      "High-performance, mobile-first sites with a strong focus on user experience",
      "API integration: connecting and optimizing disparate business systems",
      "Ongoing maintenance model: sites that improve and adapt over time without constant rebuilds",
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
              <EmailLink
                subject="Capabilities Statement PDF Request"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-5 text-sm text-gray-300 hover:bg-white/[0.07] transition shrink-0"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Request PDF
              </EmailLink>
            </div>
            <div className="h-px w-12 bg-blue-500/50 mt-6 mb-10" />
          </FadeIn>

          {/* Company snapshot */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
              {([
                { label: "Legal Name", value: SITE.legalName },
                { label: "Business Type", value: "Veteran-Owned Small Business (SDVOSB / VOSB, certification in process)" },
                { label: "UEI", value: SAM.uei },
                { label: "CAGE", value: SAM.cage },
                { label: "SAM.gov", value: "Active" },
                { label: "Primary NAICS", value: `${SAM.naicsPrimary}: Scientific & Technical Consulting` },
                { label: "8(a) Status", value: "Eligible, application planned for 2027" },
                { label: "Security Clearance", value: "DoD Secret (held)" },
                {
                  label: "Primary Contact",
                  value: (
                    <EmailLink
                      account="marston"
                      className="text-blue-400 hover:text-blue-300 transition underline underline-offset-2"
                    >
                      Email
                    </EmailLink>
                  ),
                },
              ] as { label: string; value: React.ReactNode }[]).map((item) => (
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
                    <span className="text-sm text-gray-400 flex-1">{n.description}</span>
                    {n.primary && (
                      <span className="text-[10px] font-semibold tracking-wider text-blue-400 border border-blue-500/30 bg-blue-500/10 rounded px-1.5 py-0.5 shrink-0">PRIMARY</span>
                    )}
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
                <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-4">The Aetheris Advantage</p>
                <h2 className="text-2xl font-semibold text-white mb-6">Why Agencies Work With Us</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Focused, Not Generalist",
                      body: "Rather than claiming to do everything, we concentrate on three areas we know deeply: atmospheric physics, applied AI, and defense and government systems. You get specialists, not a catch-all consultancy.",
                    },
                    {
                      title: "Decades of Operational Experience",
                      body: "More than 35 years working with the atmosphere, from forecasting in the Air Force in the 1990s to building AI and NWP hybrid models today. That experience informs every system we deliver.",
                    },
                    {
                      title: "Ready for Federal Work",
                      body: "An active Secret clearance, VOSB eligibility, and an active SAM.gov registration mean we can engage on government work without long onboarding delays.",
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
              <EmailLink
                subject="Capabilities Statement PDF Request"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
              >
                Request Capabilities PDF
              </EmailLink>
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
}
