import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import HeroGlobe from "@/components/HeroGlobe";
import Navbar from "@/components/Navbar";
import SatelliteDisplay, { type SatelliteSource } from "@/components/SatelliteDisplay";
import { posts } from "@/lib/posts";
import { AMS_PROFILE_URL, SITE } from "@/lib/constants";

export const revalidate = 3600;

export const metadata = {
  title: `Weather AI, GIS & Geospatial Regridding | ${SITE.name}`,
  description:
    "Scientific consulting in applied meteorology, AI weather forecasting, GIS data transformation, geospatial regridding, and Earth-system data pipelines.",
  alternates: { canonical: "/" },
};

function satelliteImage(url: string) {
  return `/api/satellite?url=${encodeURIComponent(url)}`;
}

const GOES_SOURCES: SatelliteSource[] = [
  {
    url: satelliteImage("https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/678x678.jpg"),
    label: "GOES East",
    region: "Americas · Atlantic",
  },
  {
    url: satelliteImage("https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/678x678.jpg"),
    label: "GOES West",
    region: "Americas · Pacific",
  },
];

const RECENT_POSTS = posts.slice(0, 3);

function TextLink({ href, children, onDark = false }: { href: string; children: ReactNode; onDark?: boolean }) {
  return (
    <a
      href={href}
      className={
        onDark
          ? "group inline-flex items-center gap-2 border-b border-[#9bc3df]/40 pb-1 text-sm font-semibold text-[#9bc3df] transition-colors duration-200 hover:border-[#9bc3df]"
          : "group inline-flex items-center gap-2 border-b border-[#29426c]/35 pb-1 text-sm font-semibold text-[#29426c] transition-colors duration-200 hover:border-[#29426c]"
      }
    >
      {children}
      <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f1ea] text-[#17252f]">
      <link
        rel="preload"
        href="/earth-textures/day-2k.webp"
        as="image"
        type="image/webp"
        media="(min-width: 1024px) and (prefers-reduced-motion: no-preference)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        href="/earth-textures/storm-clouds-2k.webp"
        as="image"
        type="image/webp"
        media="(min-width: 1024px) and (prefers-reduced-motion: no-preference)"
        fetchPriority="low"
      />
      <Navbar />

      <main id="main" className="flex-1">
        <section className="relative border-b border-white/15 bg-[#0a1628] pt-20 text-white">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <HeroGlobe />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/60 to-[#0a1628]/25" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/55 via-[#0a1628]/10 to-[#0a1628]/50" />
          </div>

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid min-h-[40rem] grid-cols-1 gap-14 py-16 md:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-center lg:gap-20 lg:py-24">
              <div>
                <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-[#9bc3df]">
                  Aetheris Vision LLC
                </p>
                <h1 className="max-w-5xl font-serif text-[clamp(2.5rem,5.4vw,5rem)] leading-[1.02] tracking-[-0.04em] text-white">
                  AI and Geospatial
                  <br />
                  Weather Systems
                </h1>
                <p className="mt-8 text-xs font-semibold uppercase leading-7 tracking-[0.06em] text-[#bcd4e4] sm:text-sm">
                  <span className="whitespace-nowrap">AI Weather Forecasting</span>{" "}
                  <span aria-hidden="true" className="px-1 text-[#7eabca]">|</span>{" "}
                  <span className="whitespace-nowrap">GIS &amp; Geospatial Regridding</span>{" "}
                  <span aria-hidden="true" className="px-1 text-[#7eabca]">|</span>{" "}
                  <span className="whitespace-nowrap">Earth-System Data Pipelines</span>
                </p>
                <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/90">
                  For research teams, government programs, and companies that depend on weather and Earth-system data.
                </p>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/70">
                  Principal-led consulting grounded in more than 35 years across operational weather, scientific analysis, software delivery, and research.
                </p>
                <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                  <a
                    href="/book"
                    className="inline-flex min-h-12 items-center justify-center gap-3 bg-white px-7 text-sm font-semibold text-[#0a1628] transition-colors duration-200 hover:bg-[#dbe8f0]"
                  >
                    Get in touch <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  <TextLink href="/services" onDark>Our expertise</TextLink>
                  <TextLink href="#how-we-work" onDark>How we work</TextLink>
                </div>
              </div>

              <aside className="border-l border-white/25 pl-6 sm:pl-8 lg:pl-10" aria-label="Principal consultant">
                <div className="relative mb-7 aspect-[3/4] w-44 overflow-hidden bg-[#12233a] sm:w-52">
                  <Image
                    src="/images/about/marston-ward-ams-ccm.webp"
                    alt="Marston Ward, founder and principal consultant of Aetheris Vision"
                    fill
                    className="object-cover object-top"
                    preload
                    sizes="208px"
                  />
                </div>
                <p className="font-serif text-2xl text-white">Marston Ward, Ph.D., CCM</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#9bc3df]">
                  Founder &amp; Principal Consultant
                </p>
                <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
                  AMS Certified Consulting Meteorologist. The person who scopes the engagement remains directly involved through delivery.
                </p>
                <a
                  href={AMS_PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#9bc3df] hover:underline"
                >
                  View AMS credentials <ArrowRightIcon className="h-4 w-4" />
                </a>
              </aside>
            </div>
          </div>
        </section>

        <section id="expertise" className="scroll-mt-20 bg-[#fbfaf7] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Our Offering</p>
                <h2 className="mt-5 max-w-xl font-serif text-4xl leading-tight tracking-[-0.025em] text-[#0a1628] sm:text-5xl">
                  Science to Delivery
                </h2>
              </div>
              <div className="border-y border-[#17252f]/20 py-8 sm:py-10">
                <p className="font-serif text-2xl leading-snug text-[#0a1628] sm:text-3xl">
                  Projects often stall where science meets delivery. This is where Aetheris Vision steps in.
                </p>
              </div>
            </div>

            <div className="mt-14 grid grid-cols-1 items-start gap-12 sm:mt-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <figure>
                <a
                  href="/services/weather-ai"
                  aria-label="Explore Weather AI and meteorology services"
                  className="group block overflow-hidden bg-[#dfe7eb]"
                >
                  <div className="relative aspect-[1024/559] overflow-hidden">
                    <Image
                      src="/images/weather-ai/ai-weather-analysis-gemini-1024x559.png"
                      alt="Concept illustration of a robotic AI system analyzing hurricane forecast data in a meteorology operations center"
                      fill
                      className="object-cover object-center transition duration-500 group-hover:scale-[1.015]"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                    />
                  </div>
                </a>
                <figcaption className="mt-3 text-xs leading-5 text-[#5b6c72]">
                  Concept illustration of AI-assisted weather analysis. AI-generated with Google Gemini.
                </figcaption>
              </figure>

              <div className="divide-y divide-[#17252f]/15 border-y border-[#17252f]/15">
                <div className="py-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">Technology</p>
                  <h3 className="mt-2 font-serif text-2xl text-[#0a1628]">Omni Gridder</h3>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[#42565f]">
                    In-house regridding technology, applied within engagements to move weather and Earth-system data between grids, formats, and projections while preserving scientific meaning.
                  </p>
                  <div className="mt-4">
                    <TextLink href="/omni-gridder">See an Omni Gridder example</TextLink>
                  </div>
                </div>
                <div className="py-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">Expertise</p>
                  <h3 className="mt-2 font-serif text-2xl text-[#0a1628]">Systems &amp; Process Expertise</h3>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[#42565f]">
                    More than 35 years across operational weather, scientific analysis, AI/ML, and software delivery — applied to your data, models, and workflows.
                  </p>
                  <div className="mt-4">
                    <TextLink href="/services">Explore our expertise</TextLink>
                  </div>
                </div>
                <div className="py-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">Delivery</p>
                  <h3 className="mt-2 font-serif text-2xl text-[#0a1628]"><span className="whitespace-nowrap">On-Time</span> Project Management &amp; Delivery</h3>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[#42565f]">
                    Scope, schedule, and terms agreed before work begins — and the person who scopes the engagement stays directly involved through delivery.
                  </p>
                  <div className="mt-4">
                    <TextLink href="#how-we-work">How we work</TextLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-we-work" className="scroll-mt-20 bg-[#0a1628] py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7eabca]">How We Work</p>
                <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight tracking-[-0.025em] sm:text-5xl">
                  From Scope to Delivery
                </h2>
              </div>
              <div className="border-y border-white/25 py-8 sm:py-10">
                <p className="max-w-3xl font-serif text-2xl leading-snug text-white/95 sm:text-3xl">
                  We begin with what your project needs and where focused support can make the greatest difference
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 items-start gap-12 sm:mt-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <figure>
                <div className="relative aspect-[3/2] overflow-hidden bg-[#071425]">
                  <Image
                    src="/images/about/field-research-balloon.webp"
                    alt="A radiosonde balloon launch in polar twilight"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                </div>
                <figcaption className="mt-3 text-xs leading-5 text-white/45">
                  Upper-air sounding: a radiosonde balloon launch in polar twilight. Illustrative; not Aetheris Vision personnel.
                </figcaption>
              </figure>
              <div>
                <p className="max-w-3xl text-base leading-8 text-white/65">
                  Scope, responsibilities, timing, commercial terms, and data handling are agreed before work begins. Aetheris Vision stays directly involved through delivery, keeping the work focused, timely, and documented for future use.
                </p>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/65">
                  Project workflows are documented and preserved for future reruns. Subject to source-license terms, acquired data and agreed deliverables are transferred to the client; our working copies are removed on the agreed schedule. Managed reruns, longer-term storage, and continuing support can be included in a service agreement.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#17252f]/15 bg-[#e9eff1] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]"><span className="whitespace-nowrap">Project-Ready</span> Data</p>
                <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight tracking-[-0.025em] text-[#0a1628] sm:text-5xl">
                  Geospatial Data, Ready for Use
                </h2>
              </div>
              <div>
                <p className="font-serif text-2xl leading-snug text-[#0a1628] sm:text-3xl">
                  GIS and geospatial data preparation can consume a significant share of a project&apos;s schedule and budget before analysis begins.
                </p>
                <p className="mt-6 max-w-3xl text-base leading-8 text-[#42565f]">
                  Source data may be readily available and still difficult to read correctly. GRIB, BUFR, NetCDF, HDF, and other scientific formats can be handled within one coherent workflow. The real work is preserving meaning through GIS reprojection, spatial interpolation, resampling, and movement between grids, coordinate systems, and resolutions.
                </p>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[#42565f]">
                  Aetheris Vision can acquire and curate the data, perform the transformation, and deliver the result in the format, grid, coordinate reference system, and resolution your project requires. Before full production, you can review a representative sample. Delivery includes documentation of the data sources, transformation steps, assumptions, and any measurable change introduced by regridding or resampling.
                </p>
                <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:gap-8">
                  <TextLink href="/services/geospatial-regridding">Explore GIS and regridding services</TextLink>
                  <TextLink href="/book">Get in touch</TextLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="selected-work" className="scroll-mt-20 bg-[#fbfaf7] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div className="flex flex-col items-start justify-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Selected Example · Omni Gridder</p>
                <h2 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.025em] text-[#0a1628] sm:text-6xl">
                  Regridding made simple
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-[#42565f]">
                  Omni Gridder shows how Aetheris Vision approaches geospatial regridding: moving weather and Earth-system data between GIS grids while preserving scientific meaning. The public demonstration shows selected inputs and outputs; the production methods remain proprietary.
                </p>
                <div className="mt-8">
                  <TextLink href="/omni-gridder">Explore this Omni Gridder example</TextLink>
                </div>
              </div>

              <div className="grid grid-cols-1 self-center gap-5 sm:grid-cols-2">
                <figure className="flex flex-col border border-[#17252f]/20 bg-white p-3">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#dfe7eb]">
                    <Image
                      src="/images/omni-gridder/source-grid-plate-carree.png"
                      alt="A gridded meteorological field in a geographic coordinate system"
                      fill
                      className="object-cover object-[50%_68%]"
                      sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) 45vw, 32vw"
                    />
                  </div>
                  <figcaption className="px-1 pb-1 pt-4">
                    <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">Source grid</span>
                    <span className="mt-1 block font-serif text-xl text-[#0a1628]">Geographic coordinates</span>
                  </figcaption>
                </figure>
                <figure className="flex flex-col border border-[#17252f]/20 bg-white p-3">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#dfe7eb]">
                    <Image
                      src="/images/omni-gridder/target-grid-lambert.png"
                      alt="The same meteorological field transformed to a Lambert Conformal grid"
                      fill
                      className="object-cover object-[50%_64%]"
                      sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) 45vw, 32vw"
                    />
                  </div>
                  <figcaption className="px-1 pb-1 pt-4">
                    <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">Transformed grid</span>
                    <span className="mt-1 block font-serif text-xl text-[#0a1628]">Lambert Conformal</span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0a1628] py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7eabca]">Live from Orbit</p>
              <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight tracking-[-0.025em] sm:text-5xl">
                The Atmosphere, Now
              </h2>
              <p className="mt-6 max-w-lg text-base leading-8 text-white/65">
                Weather does not wait, and neither does the data. These NOAA GOES views refresh throughout the hour — the same class of live Earth-system data that Aetheris Vision&apos;s consulting, data curation, and applied AI work runs on every day.
              </p>
            </div>
            <div>
              <SatelliteDisplay sources={GOES_SOURCES} />
              <p className="mt-4 text-xs leading-5 text-white/45">
                Live NOAA GOES-East and GOES-West GEOCOLOR full-disk imagery, courtesy NOAA/NESDIS. Refreshes automatically. Not Omni Gridder output.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#17252f]/15 bg-[#e9eff1] py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20 lg:px-10">
            <figure>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#dfe7eb]">
                <Image
                  src="/images/home/applied-meteorology-workspace-v1.webp"
                  alt="Two scientific professionals reviewing meteorological and geospatial data at a multi-monitor workstation"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <figcaption className="mt-3 text-xs leading-5 text-[#5b6c72]">
                Illustrative view of collaborative weather-data analysis. People shown are not Aetheris Vision personnel.
              </figcaption>
            </figure>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Your Project</p>
              <h2 className="mt-5 max-w-xl font-serif text-3xl leading-tight text-[#0a1628] sm:text-4xl">
                Need Specialist Support?
              </h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#42565f]">
                Tell us where specialist support would make the greatest difference. Aetheris Vision takes on focused scientific and technical work to help your project move forward efficiently and on schedule.
              </p>
              <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <a
                  href="/book"
                  className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#0a1628] px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#29426c]"
                >
                  Get in touch <ArrowRightIcon className="h-4 w-4" />
                </a>
                <TextLink href="/about">About Aetheris Vision</TextLink>
              </div>
            </div>
          </div>
        </section>

        <section id="insights" className="scroll-mt-20 bg-[#fbfaf7] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Insights</p>
                <h2 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.025em] text-[#0a1628] sm:text-5xl">
                  Notes from the Practice
                </h2>
              </div>
              <TextLink href="/blog">All insights</TextLink>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-3">
              {RECENT_POSTS.map((post) => (
                <article key={post.slug} className="flex flex-col items-start border-t border-[#17252f]/20 pt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">
                    {post.category} · {post.readTime}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl leading-snug text-[#0a1628]">
                    <a href={`/blog/${post.slug}`} className="transition-colors duration-200 hover:text-[#29426c]">
                      {post.title}
                    </a>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#4b5d64] line-clamp-3">{post.summary}</p>
                  <div className="mt-5">
                    <TextLink href={`/blog/${post.slug}`}>Read the article</TextLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
