import { ArrowRightIcon, GlobeAltIcon, AcademicCapIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { CAPABILITY_STATEMENT_REQUEST_HREF, SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import HeroVideo from "@/components/HeroVideo";
import OmniGridderComparison from "@/components/OmniGridderComparison";
import SatelliteDisplay, { type SatelliteSource } from "@/components/SatelliteDisplay";

export const revalidate = 3600;

const CONSULTATION_HREF = "/book";

/** Route an external satellite image URL through our same-origin proxy. */
function sat(url: string) {
  return `/api/satellite?url=${encodeURIComponent(url)}`;
}

// Geostationary satellite full disk images
const STATIC_SOURCES: SatelliteSource[] = [
  {
    url: sat("https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/678x678.jpg"),
    label: "GOES-16 East",
    region: "Americas · Atlantic",
  },
  {
    url: sat("https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/678x678.jpg"),
    label: "GOES-18 West",
    region: "Americas · Pacific",
  },
];

const transformationSkills = [
  {
    title: "Projection & CRS expertise",
    body: "Move between geographic and projected coordinate systems while respecting the geometry your operational workflow requires.",
  },
  {
    title: "Complex grid transformations",
    body: "Work across rectilinear, curvilinear, point-based, and HEALPix grids, including changes in resolution and extent.",
  },
  {
    title: "Method matched to the data",
    body: "Select interpolation and remapping methods according to whether the field is continuous, categorical, or must preserve totals.",
  },
  {
    title: "Validated, usable delivery",
    body: "Receive the requested target grid with quality checks and outputs prepared for the system, model, or analysis that needs them.",
  },
];

export const metadata = {
  title: `${SITE.name} | ${SITE.tagline}`,
  description:
    "Agentic OG: a cloud-native regridding engine for satellite and NWP data, built by a career atmospheric scientist. Veteran-owned. SAM registered. Based in Oklahoma.",
};

export default async function Home() {
  const sources: SatelliteSource[] = [...STATIC_SOURCES];
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />

      {/* Hero Section */}
      <main id="main" className="flex-1">
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
          <HeroVideo />

          {/* Fallback static image (shows when video file is absent or unsupported) */}
          {/* Backgrounds are self-hosted — sources documented in public/images/README.md */}
          <div className="absolute inset-0 -z-[21]">
            <Image
              src="/images/home/hero-earth.webp"
              alt=""
              aria-hidden="true"
              fill
              className="object-cover opacity-50 contrast-125"
              priority
              sizes="100vw"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-[#101820]/40 via-[#101820]/90 to-[#101820] -z-10" />

          <SatelliteDisplay sources={sources} />

          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
            <FadeIn delay={0.2}>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tighter text-white mb-6 leading-[1.1]">
                Agentic Regridding, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-av-ice to-av-light">
                  For Real Pipelines.
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="max-w-2xl text-lg md:text-xl text-av-ice/75 mb-10 leading-relaxed font-light">
                Agentic OG moves satellite and NWP data onto whatever grid a downstream system needs — a cloud-native regridding engine, not another team reimplementing interpolation math.
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={CONSULTATION_HREF}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200"
                >
                  Discuss Your Data
                </a>
                <a
                  href="#results"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-white/5"
                >
                  See Before &amp; After <ArrowRightIcon className="ml-2 h-4 w-4" />
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Transformation Expertise Section */}
        <section id="expertise" className="py-24 bg-[#111014] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <FadeIn delay={0}>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Earth-Data Transformation Expertise</p>
              <h2 className="max-w-4xl text-3xl md:text-5xl font-semibold text-white tracking-tight mb-5">
                Get the data right without losing months to the tooling
              </h2>
              <p className="max-w-3xl text-gray-400 font-light leading-relaxed">
                Finding the right library is only the beginning. Installation, dependencies, grid definitions, method selection, validation, and production integration can consume months before the first trustworthy result. Bring us the source data and the required destination; we handle the specialized work between them.
              </p>
            </FadeIn>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {transformationSkills.map((skill, i) => (
                <FadeIn key={skill.title} delay={0.05 + i * 0.05} className="h-full">
                  <div className="h-full rounded-xl border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-blue-500/30 hover:bg-blue-500/[0.05]">
                    <h3 className="text-lg font-medium text-white">{skill.title}</h3>
                    <p className="mt-3 text-sm text-gray-400 font-light leading-relaxed">{skill.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.25}>
              <div className="mt-10 flex flex-col gap-5 rounded-xl border border-blue-500/25 bg-blue-500/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="max-w-2xl">
                  <h3 className="text-xl font-medium text-white">Your team needs the result, not another toolchain to maintain.</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-gray-400">
                    Start with the grid you have and the grid you need. We&apos;ll identify the right transformation path and show what a reliable delivery looks like.
                  </p>
                </div>
                <a
                  href={CONSULTATION_HREF}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-7 text-sm font-medium text-black transition-colors hover:bg-gray-200"
                >
                  Discuss Your Data <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Real Proof Section */}
        <section id="results" className="py-24 bg-background border-t border-white/5">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Before &amp; After</p>
              <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-5">
                See the Geometry Change
              </h2>
              <p className="max-w-3xl text-gray-400 font-light leading-relaxed mb-12">
                One controlled temperature field, shown first on its geographic source grid and then in the projected form used for operational delivery.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <OmniGridderComparison />
              <div className="mt-7 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div className="inline-flex max-w-full items-start gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-300 sm:items-center sm:rounded-full sm:py-1.5">
                  <ShieldCheckIcon className="h-4 w-4 shrink-0" />
                  <span>Reviewed by an AMS Certified Consulting Meteorologist (CCM) with an MSc in Applied AI</span>
                </div>
                <a href="/agentic-og" className="flex shrink-0 items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition">
                  Read the full technical brief <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* People Banner — every job is watched by someone, not just a dashboard */}
        <section className="relative h-64 md:h-80 border-t border-white/5 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1754152365074-b1014729ce37?fm=jpg&q=80&w=1920&auto=format&fit=crop"
            alt="An engineer monitoring live data on screen"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-[#101820]/60 to-[#101820]/20" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6">
              <FadeIn>
                <p className="text-white font-light text-lg md:text-xl max-w-xl">
                  Every job is monitored end to end — submission, queueing, compute, and delivery — with a person accountable for the result.
                </p>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Why Trust This Section */}
        <section className="py-24 bg-[#111014] border-t border-white/5 relative overflow-hidden">
          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Why Trust This</p>
              <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-12">
                Built by Someone Who Depends on It
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <FadeIn delay={0.05} direction="up" className="h-full">
                <div className="group relative rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-6 md:p-8 transition hover:bg-blue-500/[0.07] hover:border-blue-500/30 flex flex-col h-full overflow-hidden">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <Image
                      src="/images/competencies/applied-meteorology.webp"
                      alt=""
                      aria-hidden="true"
                      fill
                      className="object-cover object-[50%_22%] opacity-[0.65] group-hover:opacity-[0.8] transition-opacity duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#101820]/20 via-[#101820]/70 to-[#101820]/92" />
                  </div>
                  <div className="relative z-10">
                    <div className="h-12 w-12 rounded-lg bg-gray-900 border border-blue-500/30 flex items-center justify-center mb-6">
                      <GlobeAltIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-3">35 Years With This Data</h3>
                    <p className="text-gray-400 font-light leading-relaxed text-sm">
                      Global atmospheric modeling and operational forecasting since a career that began as a <strong className="text-gray-200">United States Air Force</strong> weather forecaster — the exact data this engine regrids.
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.1} direction="up" className="h-full">
                <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 md:p-8 transition hover:bg-white/[0.04] hover:border-white/10 flex flex-col h-full overflow-hidden">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <Image
                      src="/images/competencies/technical-advisory.webp"
                      alt=""
                      aria-hidden="true"
                      fill
                      className="object-cover opacity-[0.65] group-hover:opacity-[0.8] transition-opacity duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#101820]/20 via-[#101820]/70 to-[#101820]/92" />
                  </div>
                  <div className="relative z-10">
                    <div className="h-12 w-12 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center mb-6">
                      <AcademicCapIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-3">PhD-Level Science</h3>
                    <p className="text-gray-400 font-light leading-relaxed text-sm">
                      AMS Certified Consulting Meteorologist, PhD in atmospheric and environmental science — the interpolation math is checked against decades of domain judgment, not just unit tests.
                    </p>
                    <a href="/about" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition mt-4">
                      Read the founder&apos;s story <ArrowRightIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.15} direction="up" className="h-full">
                <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 md:p-8 transition hover:bg-white/[0.04] hover:border-white/10 flex flex-col h-full overflow-hidden">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <Image
                      src="/images/competencies/state-federal-contracting.webp"
                      alt=""
                      aria-hidden="true"
                      fill
                      className="object-cover object-[50%_72%] opacity-[0.8] group-hover:opacity-[0.95] transition-opacity duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#101820]/10 via-[#101820]/50 to-[#101820]/85" />
                  </div>
                  <div className="relative z-10">
                    <div className="h-12 w-12 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center mb-6">
                      <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-3">Federal-Ready</h3>
                    <p className="text-gray-400 font-light leading-relaxed text-sm">
                      SAM.gov registered, SDVOSB/VOSB eligible, U.S. Government Secret clearance held. Ready to work directly with agencies on specialized weather, AI, and defense system requirements.
                    </p>
                    <a href={CAPABILITY_STATEMENT_REQUEST_HREF} className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition mt-4">
                      Request capability statement <ArrowRightIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="py-24 bg-[#111014] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <FadeIn>
              <div className="relative flex flex-col justify-between gap-10 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-10 md:flex-row md:items-center md:p-14">
                {/* Background — a storm watcher facing an approaching plains storm (see public/images/README.md) */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <Image
                    src="/images/home/cta-storm-watch.webp"
                    alt=""
                    aria-hidden="true"
                    fill
                    className="object-cover object-[50%_45%] opacity-[0.5]"
                    sizes="(max-width: 1024px) 100vw, 1024px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#101820]/95 via-[#101820]/75 to-[#101820]/35" />
                </div>
                {/* Glow */}
                <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-xl">
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4">
                    <span className="h-px w-6 bg-blue-500"></span> Get Started
                  </div>
                  <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
                    Ready to regrid something real?
                  </h2>
                  <p className="text-gray-400 font-light leading-relaxed">
                    Tell us about your pipeline and we&apos;ll respond within one business day to arrange a consultation or private demo walkthrough.
                  </p>
                </div>

                <div className="relative z-10 flex flex-col gap-4 shrink-0">
                  <a
                    href={CONSULTATION_HREF}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition"
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                    Discuss Your Data
                  </a>
                  <a
                    href="/contact"
                    className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-transparent px-8 text-sm font-medium text-white hover:bg-white/5 transition"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
