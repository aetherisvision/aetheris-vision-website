import ServiceBreadcrumbs from "@/components/ServiceBreadcrumbs";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { CAPABILITY_STATEMENT_REQUEST_HREF, FEDERAL_SEO_KEYWORDS, FOUNDER, SAM, SITE } from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";

const PAGE_PATH = "/services/federal-weather";
const PAGE_URL = `${SITE.url}${PAGE_PATH}`;
const PAGE_DESCRIPTION = `METOC, weather, and Earth-data consulting for defense and federal programs from an ${SAM.setAside}.`;

export const metadata = createPageMetadata({
  title: `Defense METOC & Federal Weather Services | ${SITE.name}`,
  description: PAGE_DESCRIPTION,
  path: PAGE_PATH,
  keywords: [...FEDERAL_SEO_KEYWORDS],
  socialDescription:
    "METOC support, weather data engineering, and AI evaluation for defense and civil agencies. Available as a prime contractor or subcontractor.",
});

const capabilities = [
  {
    title: "Weather impacts to operations",
    body: "Translate METOC forecasts, observations, and climatology into the thresholds a mission or program actually uses, with the uncertainty stated plainly.",
  },
  {
    title: "Weather and Earth-data engineering",
    body: "Ingest, regrid, and validate atmospheric and ocean model, satellite, radar, and station data (GRIB, NetCDF, HDF) into documented pipelines a program office can maintain.",
  },
  {
    title: "AI and machine-learning evaluation",
    body: "Independent assessment of AI weather models and ML products against meteorological baselines, across the lead times, regions, and conditions the program depends on.",
  },
  {
    title: "Forecast verification",
    body: "Verification design and analysis for operational and planning products, including extremes, reliability, and performance at decision thresholds.",
  },
  {
    title: "Scientific subject-matter support",
    body: "Review of requirements, technical approaches, and deliverables by an AMS Certified Consulting Meteorologist, for program offices and integrated product teams.",
  },
  {
    title: "Modernization and transition",
    body: "Assessment of legacy weather data workflows and practical, validated paths to move them onto current infrastructure.",
  },
];

const background = [
  FOUNDER.militaryService,
  "AMS Certified Consulting Meteorologist (CCM)",
  SAM.clearanceNote,
  `Active in SAM.gov: UEI ${SAM.uei}, CAGE ${SAM.cage}`,
  `SBA-certified ${SAM.certificationList}, ${SAM.certificationTerm.toLowerCase()}`,
];

/** The registered codes most relevant to weather and Earth-data work, drawn from SAM. */
const FEATURED_CODES = ["541690", "541360", "541511", "R427", "R425", "B526", "B529"];
const codes = [
  ...SAM.naics.map((c) => ({
    code: c.code,
    label: `NAICS: ${c.description}${c.primary ? " (primary)" : ""}`,
  })),
  ...SAM.psc.map((c) => ({ code: c.code, label: `PSC: ${c.description}` })),
].filter((c) => FEATURED_CODES.includes(c.code));

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Weather and Earth-data services for federal and defense programs",
  url: PAGE_URL,
  description: PAGE_DESCRIPTION,
  areaServed: "US",
  audience: {
    "@type": "Audience",
    audienceType: "Federal, defense, and civil agencies and their prime contractors",
  },
  provider: {
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.legalName,
    url: SITE.url,
  },
  serviceType: [
    "METOC (meteorological and oceanographic) support",
    "Federal meteorology consulting",
    "Defense weather data support",
    "Weather data engineering",
    "Forecast verification",
    "AI weather model evaluation",
  ],
};

export default function FederalWeatherPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505] text-gray-100">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28">
        <ServiceBreadcrumbs name="Federal & Defense Weather" path={PAGE_PATH} />
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
              {SAM.certifications.map((c) => c.abbr).join(" · ")}
            </p>
            <h1 className="mt-5 max-w-5xl font-serif text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Weather Support for Federal &amp; Defense Programs
            </h1>
            <p className="mt-7 max-w-3xl text-lg font-light leading-8 text-gray-400 sm:text-xl">
              Meteorological and oceanographic (METOC) support, weather and Earth-data engineering, and
              AI evaluation for defense and civil agencies, available as a prime contract or subcontract
              through an {SAM.setAside}.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {["METOC support", "Defense weather support", "Federal meteorology", "Weather data engineering", "Forecast verification", "Cleared delivery"].map((item) => (
                <span key={item} className="rounded-full border border-white/15 px-4 py-2 text-xs text-gray-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="federal-weather-capabilities">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">Capabilities</p>
              <h2 id="federal-weather-capabilities" className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
                Weather Science for the Mission
              </h2>
              <p className="mt-6 text-base font-light leading-7 text-gray-400">
                Programs that depend on weather need more than a forecast product. They need data they can
                trust, verification matched to the decision, and someone who understands both the science
                and how the work is used in operations.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <article key={capability.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="font-medium text-white">{capability.title}</h3>
                  <p className="mt-3 text-sm font-light leading-6 text-gray-400">{capability.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0a1628]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7eabca]">Background</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
                Operational Weather Experience
              </h2>
              <p className="mt-6 max-w-xl font-light leading-7 text-white/65">
                The principal began his career forecasting weather for Air Force operations, then spent
                decades in research, international meteorology, and software delivery. That range is what
                the program gets.
              </p>
              <p className="mt-4 max-w-xl text-xs font-light leading-relaxed text-white/45">
                Experience described here includes the principal&apos;s prior military service and
                employment; it is not represented as Aetheris Vision prime-contract past performance.
              </p>
            </div>
            <ul className="space-y-4 lg:pt-10">
              {background.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-white/80">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#7eabca]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="federal-weather-codes">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">Contracting</p>
              <h2 id="federal-weather-codes" className="mt-4 font-serif text-3xl leading-tight text-white sm:text-4xl">
                Codes for This Work
              </h2>
              <p className="mt-6 text-base font-light leading-7 text-gray-400">
                The NAICS and PSC codes most relevant to weather and Earth-data requirements. The full list
                and the set-aside paths are on the capability statement page.
              </p>
              <Link
                href="/capabilities#how-to-contract"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-blue-400 transition hover:text-blue-300"
              >
                How to contract with us <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {codes.map((row) => (
                <li key={row.code} className="flex gap-6 py-3 text-sm">
                  <span className="w-16 shrink-0 font-mono text-blue-400">{row.code}</span>
                  <span className="font-light text-gray-300">{row.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-lg font-light text-gray-300">
              Planning a requirement, a sources-sought response, or a teaming arrangement?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/contact#contact-form" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-7 text-sm font-medium text-black transition hover:bg-gray-200">
                Discuss a requirement <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href={CAPABILITY_STATEMENT_REQUEST_HREF} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/20 px-7 text-sm font-medium text-white transition hover:bg-white/5">
                Capability statement
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
