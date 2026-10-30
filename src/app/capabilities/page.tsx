import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CapabilityStatementForm from "@/components/CapabilityStatementForm";
import {
  CAPABILITY_STATEMENT_REQUEST_HREF,
  CAPABILITY_STATEMENT_REVISION,
  SITE,
  SAM,
} from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `SDVOSB & HUBZone Capability Statement | ${SITE.name}`,
  description:
    "SBA-certified SDVOSB, VOSB, and HUBZone firm for weather AI and geospatial consulting. Review capabilities, UEI, CAGE, NAICS codes, and insurance coverage.",
  path: "/capabilities",
});

const companyData: { label: string; value: ReactNode }[] = [
  { label: "Legal Name", value: SITE.legalName },
  { label: "Business Type", value: "Service-disabled veteran-owned small business (SDVOSB)" },
  { label: "UEI", value: <span className="font-mono">{SAM.uei}</span> },
  { label: "CAGE", value: <span className="font-mono">{SAM.cage}</span> },
  { label: "SAM.gov", value: "Active" },
  { label: "Primary NAICS", value: `${SAM.naicsPrimary}: Other Scientific and Technical Consulting Services` },
  {
    label: "Certifications",
    value: SAM.setAsidePills.join(". "),
  },
  { label: "Security Clearance", value: SAM.clearanceNote },
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

const naicsCodes = SAM.naics;
const pscCodes = SAM.psc;

const competencies = [
  {
    title: "Atmospheric Science & Forecasting",
    items: [
      "AMS Certified Consulting Meteorologist (CCM) expertise held by the principal",
      "Forecast and model-output interpretation for operational and planning work",
      "Verification, uncertainty, and quality assessment",
      "Weather and climate data workflows",
      "Scientific subject-matter review and project support",
    ],
  },
  {
    title: "Applied AI & Machine Learning",
    items: [
      "AI and machine-learning opportunity assessment",
      "Evaluation of data readiness, validation needs, uncertainty, and workflow fit",
      "Scientific software and data-pipeline prototypes",
      "Architecture and integration support scoped to the engagement",
    ],
  },
  {
    title: "Modernization & Transition",
    items: [
      "Assessment of existing workflows and practical paths to improve them",
      "Validation planning for AI, data, and software changes",
      "Human-in-the-loop workflow and adoption planning",
      "Technical roadmaps from concept through an agreed delivery stage",
    ],
  },
  {
    title: "Federal Registrations",
    items: [
      `SAM.gov registered: UEI ${SAM.uei}, CAGE ${SAM.cage}`,
      ...SAM.setAsidePills,
      "Oklahoma Supplier Portal: active supplier record for state-level contracting",
      SAM.clearanceNote,
    ],
  },
  {
    title: "Program Leadership",
    items: [
      "Technical planning and coordination for multidisciplinary work",
      "Focused review of assumptions, risks, and delivery requirements",
      "Translation between domain experts, technical teams, and project stakeholders",
      "Workforce development, mentoring, and team-capability support",
    ],
  },
  {
    title: "Custom Software & Web",
    items: [
      "Custom applications built to streamline real operational workflows (Next.js, React, TypeScript)",
      "High-performance, mobile-first sites with a strong focus on user experience",
      "Systems integration: connecting and optimizing disparate business tools",
      "Ongoing maintenance model: sites that improve and adapt over time without constant rebuilds",
    ],
  },
];

const differentiators = [
  {
    title: "Scope Built Around the Requirement",
    body: "We shape each engagement around the mission, technical question, and delivery requirement. Clients receive focused specialist attention without forcing the work into a preset service category.",
  },
  {
    title: "Operational Weather Depth",
    body: "The principal brings more than 35 years of experience spanning USAF forecasting, international meteorology, research, industry, and the AMS Certified Consulting Meteorologist credential.",
  },
  {
    title: "Government Contracting Foundation",
    body: `Aetheris Vision is active in SAM.gov, has an assigned UEI and CAGE code, and is an ${SAM.setAside}. Certifications are ${SAM.certificationTerm.toLowerCase()}. An active Secret clearance is held by the principal.`,
  },
];

/**
 * Plain-English buying paths for contracting officers and primes. Deliberately
 * free of dollar thresholds and percentages that change with FAR revisions,
 * except the long-standing statutory HUBZone price evaluation preference.
 */
const contractingPaths = [
  {
    title: "SDVOSB and VOSB Set-Asides",
    body: "Contracting officers may set aside requirements for service-disabled veteran-owned small businesses, and may make sole-source awards to an SDVOSB within the limits the FAR sets. The Department of Veterans Affairs may also set aside requirements for SDVOSBs and VOSBs under its Veterans First program.",
  },
  {
    title: "HUBZone Set-Asides and Price Preference",
    body: "Agencies may set aside requirements for certified HUBZone small businesses. In full and open competition, an eligible HUBZone offer may receive a 10 percent price evaluation preference when the otherwise successful offer is from a large business, subject to the exceptions in FAR 19.1307.",
  },
  {
    title: "Subcontracting for Primes",
    body: "Work subcontracted to Aetheris Vision counts toward a prime contractor's small business subcontracting goals, including the veteran-owned, service-disabled veteran-owned, and HUBZone categories.",
  },
];

function SectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <div className="border-b border-white/15 pb-3 mb-6">
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
  rows: readonly { code: string; description: string; primary?: boolean }[];
}) {
  return (
    <div className="overflow-x-auto">
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
    </div>
  );
}

export default function CapabilitiesPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pb-24 pt-24 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          {/* Hero */}
          <header className="mb-14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
                  Government Contracting
                </p>
                <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                  Capability Statement
                </h1>
                <p className="text-gray-400 font-light leading-relaxed">
                  Scientific, technical, and program support for state and federal agencies, backed
                  by operational experience and practical delivery. Review our registration data,
                  NAICS codes, Product Service Codes, competencies, and differentiators below.
                </p>
                <p className="mt-4 text-xs font-light leading-relaxed text-gray-500">
                  Experience described here includes the principal&apos;s prior employment, military
                  service, and program work; it is not represented as Aetheris Vision prime-contract
                  past performance.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a
                  href="#contracting-codes"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[#5BA8D9] px-6 text-sm font-medium text-[#0a1628] hover:bg-white transition"
                >
                  View NAICS &amp; PSC Codes
                </a>
                <a
                  href={CAPABILITY_STATEMENT_REQUEST_HREF}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-[#5BA8D9] px-6 text-sm font-medium text-[#9fd0ef] hover:bg-[#5BA8D9]/15 hover:text-white transition"
                >
                  Get the Statement (PDF)
                </a>
              </div>
            </div>
          </header>

          {/* Company data */}
          <section className="mb-14" aria-labelledby="sec-company">
            <SectionHeading id="sec-company" title="Company Data" />
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {companyData.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-1 gap-1 border-b border-white/[0.07] py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4"
                >
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-gray-500 pt-0.5">
                    {item.label}
                  </dt>
                  <dd className="text-sm text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Contracting codes */}
          <div id="contracting-codes" className="grid scroll-mt-28 grid-cols-1 gap-x-16 mb-14 lg:grid-cols-2">
            <section aria-labelledby="sec-naics" className="mb-14 lg:mb-0">
              <SectionHeading id="sec-naics" title="NAICS Codes" />
              <CodeTable caption="NAICS Codes" rows={naicsCodes} />
            </section>
            <section aria-labelledby="sec-psc">
              <SectionHeading id="sec-psc" title="PSC / Product Service Codes" />
              <CodeTable caption="PSC / Product Service Codes" rows={pscCodes} />
            </section>
          </div>

          {/* Core competencies */}
          <section className="mb-14" aria-labelledby="sec-competencies">
            <SectionHeading id="sec-competencies" title="Core Competencies" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
              {competencies.map((section) => (
                <div key={section.title}>
                  <h3 className="text-white font-medium mb-3">
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

          {/* Differentiators */}
          <section className="mb-16" aria-labelledby="sec-differentiators">
            <SectionHeading id="sec-differentiators" title="Why Agencies May Choose Aetheris Vision" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
              {differentiators.map((d) => (
                <div key={d.title}>
                  <h3 className="text-white font-medium text-sm mb-2">
                    {d.title}
                  </h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed">{d.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contracting paths */}
          <section id="how-to-contract" className="mb-16 scroll-mt-28" aria-labelledby="sec-how-to-contract">
            <SectionHeading id="sec-how-to-contract" title="How to Contract With Us" />
            <p className="mb-8 max-w-3xl text-sm font-light leading-relaxed text-gray-400">
              Aetheris Vision is an {SAM.setAside}, registered
              in SAM.gov under UEI {SAM.uei} and CAGE {SAM.cage}. Each certification opens a
              different path to award.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
              {contractingPaths.map((path) => (
                <div key={path.title}>
                  <h3 className="text-white font-medium text-sm mb-2">{path.title}</h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed">{path.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Capability statement delivery */}
          <section
            id="capability-statement"
            className="mb-14 scroll-mt-24 border-t border-white/15 pt-10"
            aria-labelledby="sec-capability-statement"
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <h2
                  id="sec-capability-statement"
                  className="mb-3 text-2xl font-semibold tracking-tight text-white"
                >
                  Get the Capability Statement
                </h2>
                <p className="font-light leading-relaxed text-gray-400">
                  Request the current one-page capability statement. We review each request
                  before responding. The PDF includes our UEI, CAGE code, NAICS codes,
                  core competencies, contact details, and insurance coverage.
                </p>
                <p className="mt-4 text-xs font-light leading-relaxed text-gray-500">
                  Updated {CAPABILITY_STATEMENT_REVISION}.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <CapabilityStatementForm />
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <footer className="border-t border-white/15 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
              Active in SAM.gov · UEI {SAM.uei} · CAGE {SAM.cage}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/book"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#5BA8D9] px-6 text-sm font-medium text-[#0a1628] hover:bg-white transition"
              >
                Get in touch
              </a>
              <a
                href={CAPABILITY_STATEMENT_REQUEST_HREF}
                className="inline-flex h-11 items-center justify-center text-sm text-gray-300 hover:text-white transition underline underline-offset-4 decoration-white/30"
              >
                Get the Capability Statement (PDF)
              </a>
            </div>
          </footer>

        </div>
      </main>

      <Footer />
    </div>
  );
}
