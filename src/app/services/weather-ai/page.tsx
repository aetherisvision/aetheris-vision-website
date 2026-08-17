import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { SITE } from "@/lib/constants";

const PAGE_URL = `${SITE.url}/services/weather-ai`;

export const metadata: Metadata = {
  title: `AI Weather Forecasting & Meteorology Consulting | ${SITE.name}`,
  description:
    "AI weather forecasting and applied meteorology consulting for NWP/ML systems, forecast verification, uncertainty, Earth-data pipelines, and operational delivery.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `AI Weather Forecasting & Meteorology Consulting | ${SITE.name}`,
    description:
      "Scientific guidance and production delivery for AI/ML weather systems, forecast evaluation, and meteorological data pipelines.",
    url: PAGE_URL,
    type: "website",
  },
};

const capabilities = [
  {
    title: "AI weather system design",
    body: "Frame the forecast problem, data requirements, spatial and temporal scales, evaluation criteria, and operational constraints before selecting a model or architecture.",
  },
  {
    title: "NWP and machine-learning integration",
    body: "Connect numerical weather prediction, observations, reanalysis, and ML approaches—including GraphCast- and Pangu-Weather-class workflows—into a coherent system.",
  },
  {
    title: "Forecast verification",
    body: "Evaluate skill, bias, reliability, extremes, spatial displacement, and performance across lead times, regions, seasons, and decision thresholds.",
  },
  {
    title: "Weather data engineering",
    body: "Prepare model, satellite, radar, station, and reanalysis data for training, inference, comparison, and downstream applications with traceable transformations.",
  },
  {
    title: "Uncertainty and decision support",
    body: "Translate ensembles, probabilistic output, confidence limits, and known model failure modes into information people and automated systems can use responsibly.",
  },
  {
    title: "Operational delivery",
    body: "Move from research code or a promising prototype to documented, monitored, repeatable pipelines that fit the team, infrastructure, and mission.",
  },
];

const principles = [
  "Meteorological validity before model novelty",
  "Baselines and verification matched to the real decision",
  "GIS-aware handling of grids, projections, and spatial scale",
  "Explicit uncertainty, provenance, and operational limits",
  "Human review where consequences require scientific judgment",
];

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI weather forecasting and applied meteorology consulting",
  url: PAGE_URL,
  description: metadata.description,
  areaServed: "US",
  provider: {
    "@type": "Organization",
    name: SITE.legalName,
    url: SITE.url,
  },
  serviceType: [
    "AI weather forecasting consulting",
    "Applied meteorology consulting",
    "Forecast verification",
    "Weather data engineering",
    "NWP and machine-learning integration",
  ],
};

export default function WeatherAiPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505] text-gray-100">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28">
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
              Applied Meteorology &amp; AI/ML
            </p>
            <h1 className="mt-5 max-w-5xl font-serif text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Weather AI &amp; Meteorology
            </h1>
            <p className="mt-7 max-w-3xl text-lg font-light leading-8 text-gray-400 sm:text-xl">
              Scientific guidance and working technical delivery for organizations evaluating, building, or operating AI/ML weather systems—from data and baselines through verification, uncertainty, and production use.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {["AI weather forecasting", "Applied meteorology", "Forecast verification", "NWP/ML systems"].map((item) => (
                <span key={item} className="rounded-full border border-white/15 px-4 py-2 text-xs text-gray-300">
                  {item}
                </span>
              ))}
            </div>
            <figure className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <Image
                src="/images/weather-ai/ai-weather-analysis-gemini-1024x559.png"
                alt="Concept illustration of a robotic AI system analyzing hurricane forecast data in a meteorology operations center"
                width={1024}
                height={559}
                sizes="(min-width: 1152px) 1088px, calc(100vw - 40px)"
                className="h-auto w-full object-cover"
              />
              <figcaption className="border-t border-white/10 px-5 py-3 text-xs leading-5 text-gray-500">
                Concept illustration of AI-assisted weather analysis. Image source: AI-generated with Google Gemini.
              </figcaption>
            </figure>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="weather-ai-capabilities">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">Capabilities</p>
              <h2 id="weather-ai-capabilities" className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
                Weather Science for AI
              </h2>
              <p className="mt-6 text-base font-light leading-7 text-gray-400">
                A model can score well and still fail the forecast situation, geography, lead time, or operational decision that matters. Domain judgment stays connected to the engineering.
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7eabca]">How we evaluate weather AI</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
                Beyond Forecast Accuracy
              </h2>
              <p className="mt-6 max-w-xl font-light leading-7 text-white/65">
                Modern AI weather forecasting can be powerful, but it still depends on the training data, reference analysis, grid, loss function, verification design, and conditions outside the model&apos;s strongest regime.
              </p>
            </div>
            <ul className="space-y-4 lg:pt-10">
              {principles.map((principle) => (
                <li key={principle} className="flex gap-3 text-sm leading-6 text-white/80">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#7eabca]" />
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-8 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">The geospatial connection</p>
              <h2 className="mt-4 font-serif text-3xl text-white sm:text-4xl">Aligned Data First</h2>
              <p className="mt-4 max-w-2xl font-light leading-7 text-gray-400">
                Training, inference, and verification often require regridding model fields, observations, and targets across different coordinate systems and resolutions.
              </p>
            </div>
            <Link href="/services/geospatial-regridding" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/5">
              Explore geospatial services <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-lg font-light text-gray-300">
              Evaluating an AI weather product or moving a forecasting workflow toward production?
            </p>
            <Link href="/contact#contact-form" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-7 text-sm font-medium text-black transition hover:bg-gray-200">
              Discuss the system <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
    </div>
  );
}
