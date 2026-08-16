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
                    Book a consultation <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  <TextLink href="/intake">Submit a project brief</TextLink>
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
                  Scientific judgment, carried through to delivery
                </h2>
              </div>
              <div className="border-y border-[#17252f]/20 py-8 sm:py-10">
                <p className="font-serif text-2xl leading-snug text-[#0a1628] sm:text-3xl">
                  Projects often reach us where the science and the delivery meet: data need careful preparation, a forecast or model result needs an independent review, or a proven research process needs to work reliably for a broader team.
                </p>
                <p className="mt-7 max-w-3xl text-base leading-8 text-[#42565f]">
                  Aetheris Vision brings meteorological judgment, data engineering, and applied AI together around the result the project needs. One engagement may span analysis, data curation, and software. The scope follows the question—not a preset service package.
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
                  <TextLink href="#contact">Describe the data you need</TextLink>
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
                  Direct involvement from first question to final delivery
                </h2>
              </div>
              <div className="border-y border-white/25 py-8 sm:py-10">
                <p className="max-w-3xl font-serif text-2xl leading-snug text-white/95 sm:text-3xl">
                  We begin with the outcome you need, the data and documentation available, and the practical consequences of error.
                </p>
                <p className="mt-6 max-w-3xl text-base leading-8 text-white/65">
                  We then define the smallest useful scope: an independent review, a focused analysis, a curated dataset, or a working technical delivery. Responsibilities, timing, and commercial terms are agreed before work begins. Marston Ward leads the engagement and remains directly involved through completion.
                </p>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/65">
                  The workflow developed for each engagement is documented and preserved after delivery, so future reruns do not begin from scratch. Project-specific data acquired for the work and the agreed deliverables belong to the client, subject to source-license terms; at closeout, they are transferred and our working copies are removed under the agreed retention schedule. Longer-term storage, managed reruns, and continuing support can be included in an ongoing service agreement.
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
                  One regridding problem, made visible
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-[#42565f]">
                  Omni Gridder shows how Aetheris Vision approaches one kind of geospatial transformation: moving Earth-system data between grids while preserving scientific meaning. The public demonstration shows selected inputs and outputs; the production methods remain proprietary.
                </p>
                <div className="mt-8">
                  <TextLink href="/omni-gridder">Explore this Omni Gridder example</TextLink>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <figure className="border border-[#17252f]/20 bg-white p-3">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#dfe7eb]">
                    <Image
                      src="/images/omni-gridder/source-grid-plate-carree.png"
                      alt="A gridded meteorological field in a geographic coordinate system"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 35vw"
                    />
                  </div>
                  <figcaption className="px-1 pb-1 pt-4">
                    <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">Source grid</span>
                    <span className="mt-1 block font-serif text-xl text-[#0a1628]">Geographic coordinates</span>
                  </figcaption>
                </figure>
                <figure className="border border-[#17252f]/20 bg-white p-3 sm:mt-12">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#dfe7eb]">
                    <Image
                      src="/images/omni-gridder/target-grid-lambert.png"
                      alt="The same meteorological field transformed to a Lambert Conformal grid"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 35vw"
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
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Applied Meteorology in Practice</p>
              <blockquote className="mt-5 max-w-xl font-serif text-3xl leading-tight text-[#0a1628] sm:text-4xl">
                “My job is to make sure the data are read correctly—and that the science survives implementation.”
              </blockquote>
              <p className="mt-4 text-sm font-semibold text-[#486890]">— Marston Ward, Ph.D., CCM</p>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#42565f]">
                Marston Ward brings more than 35 years across operational weather, scientific analysis, software delivery, and weather research. His work connects meteorology, geospatial data, and software without losing the scientific meaning between them.
              </p>
              <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <a
                  href="/book"
                  className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#0a1628] px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#29426c]"
                >
                  Book a consultation <ArrowRightIcon className="h-4 w-4" />
                </a>
                <TextLink href="/about">Meet Marston Ward</TextLink>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 bg-[#0a1628] py-20 text-white sm:py-28">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7eabca]">Get Started</p>
              <h2 className="mt-5 max-w-xl font-serif text-4xl leading-tight tracking-[-0.025em] sm:text-6xl">
                What do you need help deciding or delivering?
              </h2>
              <p className="mt-6 max-w-lg text-base leading-8 text-white/65">
                Book a time to talk it through directly with Marston Ward, or send a project brief — the outcome you need, the data or system involved, and any timing constraints. Every inquiry is reviewed personally, typically within one business day.
              </p>
              <a
                href="/book"
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 bg-[#f4f1ea] px-7 text-sm font-semibold text-[#0a1628] transition-colors duration-200 hover:bg-white"
              >
                Book a Consultation <ArrowRightIcon className="h-4 w-4" />
              </a>
              <p className="mt-6 text-sm text-white/60">
                Have a defined project already?{" "}
                <a href="/intake" className="font-semibold text-[#9bc3df] underline decoration-[#9bc3df]/40 underline-offset-4 hover:decoration-[#9bc3df]">
                  Complete the project intake.
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
