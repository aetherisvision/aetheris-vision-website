import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE, SAM } from "@/lib/constants";

const PDF_REQUEST_HREF = "/contact?topic=Capabilities%20Statement%20PDF%20Request";
const DOC_REFERENCE = "AV-CS-2026";
const DOC_REVISION = "Rev. June 2026";

export const metadata = {
  title: `Capabilities Statement | ${SITE.name}`,
  description:
    "Aetheris Vision capabilities statement: NAICS codes, contract vehicles, core competencies, and past performance for state and federal procurement.",
};

const companyData: { label: string; value: React.ReactNode }[] = [
  { label: "Legal Name", value: SITE.legalName },
  { label: "Business Type", value: "Veteran-Owned Small Business (SDVOSB / VOSB, certification in process)" },
  { label: "UEI", value: <span className="font-mono">{SAM.uei}</span> },
  { label: "CAGE", value: <span className="font-mono">{SAM.cage}</span> },
  { label: "SAM.gov", value: "Active" },
  { label: "Primary NAICS", value: `${SAM.naicsPrimary}: Scientific & Technical Consulting` },
  { label: "8(a) Status", value: "Eligible, application planned for 2027" },
  { label: "Security Clearance", value: "U.S. Government Secret (held)" },
  {
    label: "Primary Contact",
    value: (
      <a
        href="/contact"
        className="text-blue-400 hover:text-blue-300 transition underline underline-offset-2"
      >
        Contact form
      </a>
    ),
  },
];

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
      "U.S. Government Secret clearance (held across military and civilian assignments; facility clearance scalable for classified program support)",
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

const differentiators = [
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
    body: "A U.S. Government Secret clearance held across multiple assignments, VOSB eligibility, and an active SAM.gov registration mean we can engage on government work without long onboarding delays.",
  },
];

/** Numbered section heading in the document register. */
function SectionHeading({ id, num, title }: { id: string; num: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-white/15 pb-3 mb-6">
      <span className="font-mono text-sm text-blue-400">{num}</span>
      <h2 id={id} className="text-lg font-semibold text-white tracking-tight uppercase">
        {title}
      </h2>
    </div>
  );
}

/** Two-column code/description reference table. */
function CodeTable({
  caption,
  rows,
}: {
  caption: string;
  rows: { code: string; description: string; primary?: boolean }[];
}) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Code</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.code} className="border-b border-white/[0.07]">
            <td className="py-2.5 pr-6 align-top font-mono text-blue-400 whitespace-nowrap w-px">
              {row.code}
            </td>
            <td className="py-2.5 text-gray-300 font-light">
              {row.description}
              {row.primary && (
                <span className="ml-3 font-mono text-[10px] tracking-wider text-blue-400 border border-blue-500/40 rounded-sm px-1.5 py-0.5 align-middle">
                  PRIMARY
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CapabilitiesPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-24">
        <div className="mx-auto max-w-6xl px-6">

          {/* ── Document header ── */}
          <header className="mb-14">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3 mb-8 font-mono text-[11px] uppercase tracking-wider text-gray-500">
              <span>{SITE.legalName} · Contracting Reference</span>
              <span>
                {DOC_REFERENCE} · {DOC_REVISION}
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                  Capabilities Statement
                </h1>
                <p className="text-gray-400 font-light leading-relaxed">
                  Applied meteorology, AI/ML integration, and custom software engineering for
                  state and federal agencies. This page mirrors our official capabilities
                  statement; a signed PDF is available on request.
                </p>
              </div>
              <a
                href={PDF_REQUEST_HREF}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition shrink-0"
              >
                Request Statement (PDF)
              </a>
            </div>
          </header>

          {/* ── 1.0 Company data ── */}
          <section className="mb-14" aria-labelledby="sec-company">
            <SectionHeading id="sec-company" num="1.0" title="Company Data" />
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {companyData.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[11rem_1fr] gap-4 border-b border-white/[0.07] py-2.5"
                >
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-gray-500 pt-0.5">
                    {item.label}
                  </dt>
                  <dd className="text-sm text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── 2.0 / 3.0 Codes ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 mb-14">
            <section aria-labelledby="sec-naics" className="mb-14 lg:mb-0">
              <SectionHeading id="sec-naics" num="2.0" title="NAICS Codes" />
              <CodeTable caption="NAICS Codes" rows={naicsCodes} />
            </section>
            <section aria-labelledby="sec-psc">
              <SectionHeading id="sec-psc" num="3.0" title="PSC / Product Service Codes" />
              <CodeTable caption="PSC / Product Service Codes" rows={pscCodes} />
            </section>
          </div>

          {/* ── 4.0 Core competencies ── */}
          <section className="mb-14" aria-labelledby="sec-competencies">
            <SectionHeading id="sec-competencies" num="4.0" title="Core Competencies" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
              {competencies.map((section, i) => (
                <div key={section.title}>
                  <h3 className="flex items-baseline gap-3 text-white font-medium mb-3">
                    <span className="font-mono text-xs text-gray-500">4.{i + 1}</span>
                    {section.title}
                  </h3>
                  <ul className="space-y-2 border-l border-white/10 pl-5 ml-1">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-gray-400 font-light leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── 5.0 Differentiators ── */}
          <section className="mb-16" aria-labelledby="sec-differentiators">
            <SectionHeading id="sec-differentiators" num="5.0" title="Why Agencies Work With Us" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
              {differentiators.map((d, i) => (
                <div key={d.title}>
                  <h3 className="flex items-baseline gap-3 text-white font-medium text-sm mb-2">
                    <span className="font-mono text-xs text-gray-500">5.{i + 1}</span>
                    {d.title}
                  </h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed">{d.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Document footer / CTA ── */}
          <footer className="border-t border-white/15 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
              {DOC_REFERENCE} · {DOC_REVISION} · UEI {SAM.uei} · CAGE {SAM.cage}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/book"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition"
              >
                Book a Consultation
              </a>
              <a
                href={PDF_REQUEST_HREF}
                className="inline-flex h-11 items-center justify-center text-sm text-gray-300 hover:text-white transition underline underline-offset-4 decoration-white/30"
              >
                Request Capabilities Statement (PDF)
              </a>
            </div>
          </footer>

        </div>
      </main>

      <Footer />
    </div>
  );
}
