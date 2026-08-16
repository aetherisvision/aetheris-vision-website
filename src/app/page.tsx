import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import QuickContactForm from "@/components/QuickContactForm";
import SatelliteDisplay, { type SatelliteSource } from "@/components/SatelliteDisplay";
import { AMS_PROFILE_URL, SITE } from "@/lib/constants";

export const revalidate = 3600;

export const metadata = {
  title: `${SITE.name} | Consultancy in Applied Meteorology`,
  description:
    "Applied AI, geospatial data curation, and coordinate reference system transformation for weather and Earth-system work.",
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

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 border-b border-[#29426c]/35 pb-1 text-sm font-semibold text-[#29426c] transition-colors duration-200 hover:border-[#29426c]"
    >
      {children}
      <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f1ea] text-[#17252f]">
      <Navbar />

      <main id="main" className="flex-1">
        <section className="border-b border-[#17252f]/20 bg-[#f4f1ea] pt-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid min-h-[40rem] grid-cols-1 gap-14 py-16 md:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-center lg:gap-20 lg:py-24">
              <div>
                <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">
                  Aetheris Vision LLC
                </p>
                <h1 className="max-w-5xl font-serif text-[clamp(3.2rem,7.1vw,6.8rem)] leading-[0.94] tracking-[-0.045em] text-[#0a1628]">
                  Consultancy in Applied Meteorology
                </h1>
                <p className="mt-8 max-w-3xl text-base font-semibold uppercase leading-7 tracking-[0.08em] text-[#344852] sm:text-lg">
                  Applied AI <span aria-hidden="true" className="px-1 text-[#7eabca]">|</span>{" "}
                  Geospatial Data Curation <span aria-hidden="true" className="px-1 text-[#7eabca]">|</span>{" "}
                  Coordinate Reference System Transformation
                </p>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4b5d64]">
                  More than 35 years across operational weather, scientific analysis, software delivery, and weather research.
                </p>
                <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                  <a
                    href="/book"
                    className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#0a1628] px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#29426c]"
                  >
                    Get in touch <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  <TextLink href="#how-we-work">How we work</TextLink>
                </div>
              </div>

              <aside className="border-l border-[#17252f]/20 pl-6 sm:pl-8 lg:pl-10" aria-label="Principal consultant">
                <div className="relative mb-7 aspect-[3/4] w-44 overflow-hidden bg-[#e7edf0] sm:w-52">
                  <Image
                    src="/images/about/marston-ward-ams-ccm.webp"
                    alt="Marston Ward, founder and principal consultant of Aetheris Vision"
                    fill
                    className="object-cover object-top"
                    priority
                    sizes="208px"
                  />
                </div>
                <p className="font-serif text-2xl text-[#0a1628]">Marston Ward, Ph.D., CCM</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#486890]">
                  Founder &amp; Principal Consultant
                </p>
                <p className="mt-5 max-w-sm text-sm leading-6 text-[#4b5d64]">
                  AMS Certified Consulting Meteorologist. The person who scopes the engagement remains directly involved through delivery.
                </p>
                <a
                  href={AMS_PROFILE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#29426c] hover:underline"
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
                <h2 className="mt-5 max-w-xl font-serif text-4xl leading-tight tracking-[-0.025em] text-[#0a1628] sm:text-6xl">
                  Scientific expertise carried through to delivery
                </h2>
              </div>
              <div className="border-y border-[#17252f]/20 py-8 sm:py-10">
                <p className="font-serif text-2xl leading-snug text-[#0a1628] sm:text-3xl">
                  Projects often reach us where science and delivery meet: data require careful preparation, a model result needs expert scrutiny, or a research process needs to work reliably for a broader team.
                </p>
                <p className="mt-7 max-w-3xl text-base leading-8 text-[#42565f]">
                  Aetheris Vision brings scientific, technical, and delivery expertise together around the result your project needs. An engagement may span analysis, data curation, software, or another focused technical need. The scope follows the project, not a preset service package.
                </p>
              </div>
            </div>

            <figure className="mt-14 sm:mt-20">
              <div className="relative aspect-[21/9] overflow-hidden bg-[#dfe7eb]">
                <Image
                  src="/images/home/cta-storm-watch.webp"
                  alt="Field observation of a Great Plains supercell"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1280px) 100vw, 1216px"
                />
              </div>
              <figcaption className="mt-3 text-xs leading-5 text-[#5b6c72]">
                Field observation of a Great Plains supercell. Illustrative; not Aetheris Vision personnel.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="border-y border-[#17252f]/15 bg-[#e9eff1] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Project-Ready Data</p>
                <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight tracking-[-0.025em] text-[#0a1628] sm:text-5xl">
                  The hard part is often preparing the data
                </h2>
              </div>
              <div>
                <p className="font-serif text-2xl leading-snug text-[#0a1628] sm:text-3xl">
                  Preparing scientific and geospatial data can consume a significant share of a project&apos;s schedule and budget before analysis begins.
                </p>
                <p className="mt-6 max-w-3xl text-base leading-8 text-[#42565f]">
                  Source data may be readily available and still difficult to read correctly. GRIB, BUFR, NetCDF, HDF, and other scientific formats can be handled within one coherent workflow. The real work is preserving meaning as data move between formats, grids, coordinate systems, and resolutions.
                </p>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[#42565f]">
                  Aetheris Vision can acquire and curate the data, perform the transformation, and deliver the result in the format, grid, coordinate reference system, and resolution your project requires. Before full production, you can review a representative sample. Delivery includes documentation of the data sources, transformation steps, assumptions, and any measurable change introduced by regridding or resampling.
                </p>
                <div className="mt-7">
                  <TextLink href="/book">Get in touch</TextLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0a1628] py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7eabca]">Live from Orbit</p>
              <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight tracking-[-0.025em] sm:text-5xl">
                The atmosphere, as it is right now
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

        <section id="how-we-work" className="scroll-mt-20 bg-[#0a1628] py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7eabca]">How We Work</p>
                <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight tracking-[-0.025em] sm:text-5xl">
                  Focused support from scope through delivery
                </h2>
              </div>
              <div className="border-y border-white/25 py-8 sm:py-10">
                <p className="max-w-3xl font-serif text-2xl leading-snug text-white/95 sm:text-3xl">
                  We begin with what your project needs and where focused support can make the greatest difference
                </p>
                <p className="mt-6 max-w-3xl text-base leading-8 text-white/65">
                  Scope, responsibilities, timing, commercial terms, and data handling are agreed before work begins. Aetheris Vision stays directly involved through delivery, keeping the work focused, timely, and documented for future use.
                </p>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/65">
                  Project workflows are documented and preserved for future reruns. Subject to source-license terms, acquired data and agreed deliverables are transferred to the client; our working copies are removed on the agreed schedule. Managed reruns, longer-term storage, and continuing support can be included in a service agreement.
                </p>
              </div>
            </div>

            <figure className="mt-12 max-w-3xl sm:mt-16 lg:ml-auto">
              <div className="relative aspect-[3/2] overflow-hidden bg-[#071425]">
                <Image
                  src="/images/about/field-research-balloon.webp"
                  alt="A radiosonde balloon launch in polar twilight"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 768px"
                />
              </div>
              <figcaption className="mt-3 text-xs leading-5 text-white/45">
                Upper-air sounding: a radiosonde balloon launch in polar twilight. Illustrative; not Aetheris Vision personnel.
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="selected-work" className="scroll-mt-20 bg-[#fbfaf7] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div className="flex flex-col items-start justify-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Selected Example · Omni Gridder</p>
                <h2 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.025em] text-[#0a1628] sm:text-6xl">
                  Regridding made simpler
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-[#42565f]">
                  Omni Gridder shows how Aetheris Vision approaches one kind of geospatial transformation: moving Earth-system data between grids while preserving scientific meaning. The public demonstration shows selected inputs and outputs; the production methods remain proprietary.
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

        <section className="border-y border-[#17252f]/15 bg-[#e9eff1] py-20 sm:py-24">
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
                How can Aetheris Vision help your project succeed?
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

        <section id="contact" className="scroll-mt-20 bg-[#0a1628] py-14 text-white sm:py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-start lg:gap-16 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7eabca]">General Contact</p>
              <h2 className="mt-5 max-w-xl font-serif text-4xl leading-tight tracking-[-0.025em]">
                Comments and general questions
              </h2>
              <p className="mt-6 max-w-lg text-base leading-8 text-white/65">
                Use this form for comments, general questions, or website matters. Aetheris Vision typically replies within one business day.
              </p>
              <p className="mt-7 text-sm text-white/60">
                Planning a project?{" "}
                <a href="/book" className="inline-flex min-h-11 items-center font-semibold text-[#9bc3df] underline decoration-[#9bc3df]/40 underline-offset-4 hover:decoration-[#9bc3df]">
                  Get in touch
                </a>
              </p>
            </div>
            <QuickContactForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
