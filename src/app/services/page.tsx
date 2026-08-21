import {
  ArrowRightIcon,
  CpuChipIcon,
  BeakerIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { CAPABILITY_STATEMENT_REQUEST_HREF, SITE, SAM } from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `Weather AI, GIS & Geospatial Services | ${SITE.name}`,
  description:
    "Applied meteorology, AI weather forecasting, GIS, geospatial regridding, CRS transformation, and scientific data-pipeline consulting.",
  path: "/services",
});

const transformationCapabilities = [
  {
    title: "Coordinate systems & projections",
    body: "Transform between geographic and projected coordinate systems while preserving the geometry the destination requires.",
  },
  {
    title: "Specialized grid geometries",
    body: "Handle rectilinear, curvilinear, point-based, HEALPix, and other source or destination layouts across resolutions and extents.",
  },
  {
    title: "Data-aware remapping",
    body: "Match the method to continuous, categorical, or conservation-sensitive fields instead of applying a one-size-fits-all interpolation.",
  },
  {
    title: "Verification & delivery",
    body: "Check the result for missing data, artifacts, and conservation errors, then prepare it for the model, analysis, or operational system that needs it.",
  },
];

const consultingAreas = [
  {
    icon: BeakerIcon,
    title: "Atmospheric‑Science SME",
    body: "AMS Certified Consulting Meteorologist judgment applied to model output, grid interpolation, and forecast verification — the domain expertise that makes an automated pipeline trustworthy.",
  },
  {
    icon: CpuChipIcon,
    title: "AI Weather Forecasting & ML Systems",
    body: "Design, evaluation, and integration of AI weather forecasting and hybrid NWP/ML systems, including GraphCast and Pangu-Weather workflows, uncertainty quantification, and reanalysis data such as ERA5 and MERRA-2.",
  },
  {
    icon: ArrowPathIcon,
    title: "Data‑Pipeline Modernization",
    body: "Assessment of existing operational frameworks and a practical path off them — legacy interpolation code, brittle ingest jobs, and undocumented grid assumptions replaced with something verifiable.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Technical Program Leadership",
    body: "Technical direction for integrated product teams on defense and civil-agency modernization: technology assessment, risk-managed deployment, and staff training.",
  },
];

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pb-24 pt-24 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          {/* Hero */}
          <header className="mb-16">
            <FadeIn>
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tight mb-6 leading-[1.1]">
                  Weather AI &amp; Geospatial Consulting
                </h1>
                <p className="text-lg text-gray-400 font-light leading-relaxed">
                  Aetheris Vision brings applied meteorology, AI weather forecasting, GIS, geospatial regridding, and scientific software together around the result each engagement needs—supported by tools we build in-house when the problem calls for them.
                </p>
              </div>
            </FadeIn>
          </header>

          {/* Scientific software and Earth-data consulting */}
          <FadeIn delay={0.05}>
            <section className="mb-8" aria-labelledby="sec-consulting">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 md:p-12">
                <div className="border-b border-white/15 pb-3 mb-6">
                  <h2 id="sec-consulting" className="text-lg font-semibold text-white tracking-tight uppercase">
                    Scientific &amp; <span className="whitespace-nowrap">Earth-Data</span> Systems
                  </h2>
                </div>
                <p className="max-w-2xl text-gray-400 font-light leading-relaxed mb-10">
                  Independent scientific judgment, carried through to working software.
                  Direct engagement on atmospheric science, AI/ML weather systems,
                  and the pipeline work that keeps them honest in production.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {consultingAreas.map((area) => (
                    <div key={area.title} className="flex gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center">
                        <area.icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1.5">{area.title}</h3>
                        <p className="text-sm text-gray-400 font-light leading-relaxed">{area.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href="/book#consultation"
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition mt-10"
                >
                  Book a consultation <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>
          </FadeIn>

          {/* Earth-data transformation */}
          <FadeIn delay={0.1}>
            <section className="mb-8" aria-labelledby="sec-transformation">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-6 sm:p-8 md:p-12">
                <div className="border-b border-white/15 pb-3 mb-6">
                  <h2 id="sec-transformation" className="text-lg font-semibold text-white tracking-tight uppercase">
                    GIS &amp; Geospatial Regridding
                  </h2>
                </div>
                <p className="max-w-3xl text-gray-400 font-light leading-relaxed mb-10">
                  Move weather, climate, satellite, GIS, and environmental data from the
                  form you have to the form your downstream work requires. Services include
                  CRS transformation, reprojection, spatial interpolation, resampling, and
                  data-aware remapping across raster, point, and specialized grid geometries.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {transformationCapabilities.map((capability) => (
                    <div key={capability.title} className="rounded-xl border border-white/10 bg-black/20 p-5">
                      <h3 className="text-white font-medium mb-2">{capability.title}</h3>
                      <p className="text-sm text-gray-400 font-light leading-relaxed">{capability.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-5 rounded-xl border border-blue-500/25 bg-blue-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-medium text-white">Need the data done correctly without spending months assembling the toolchain?</h3>
                    <p className="mt-2 text-sm font-light leading-relaxed text-gray-400">
                      Show us the source, the destination, and what the result must support. We&apos;ll take it from there.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <a
                      href="/book"
                      className="inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-medium text-black transition hover:bg-gray-200"
                    >
                      Discuss Your Data
                    </a>
                    <a
                      href="/omni-gridder"
                      className="inline-flex h-11 items-center justify-center gap-1 rounded-md border border-white/15 px-5 text-sm text-white transition hover:bg-white/5"
                    >
                      See a worked example <ArrowRightIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                  <a href="/services/geospatial-regridding" className="text-blue-400 transition hover:text-blue-300">
                    Explore GIS and geospatial regridding services <ArrowRightIcon className="ml-1 inline h-3.5 w-3.5" />
                  </a>
                  <a href="/services/weather-ai" className="text-blue-400 transition hover:text-blue-300">
                    Explore AI weather forecasting services <ArrowRightIcon className="ml-1 inline h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </section>
          </FadeIn>

          {/* Federal and cleared delivery */}
          <FadeIn delay={0.15}>
            <section className="mb-8" aria-labelledby="sec-federal">
              <div className="rounded-2xl border border-white/5 bg-black p-6 sm:p-8 md:p-12">
                <div className="border-b border-white/15 pb-3 mb-6">
                  <h2 id="sec-federal" className="text-lg font-semibold text-white tracking-tight uppercase">
                    Federal &amp; Cleared Delivery
                  </h2>
                </div>
                <p className="max-w-2xl text-gray-400 font-light leading-relaxed mb-8">
                  Both disciplines above are deliverable through federal, prime-teaming,
                  and cleared channels — this is how we deliver, not a separate offering.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    ...SAM.setAsidePills,
                    `CAGE ${SAM.cage}`,
                    `UEI ${SAM.uei}`,
                    "U.S. Government Secret Clearance",
                    "Prime Teaming",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-mono text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={CAPABILITY_STATEMENT_REQUEST_HREF}
                  className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  Get the capability statement <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>
          </FadeIn>

          {/* Custom software and web */}
          <FadeIn delay={0.2}>
            <section className="mb-16" aria-labelledby="sec-web">
              <div className="border-b border-white/15 pb-3 mb-4">
                <h2 id="sec-web" className="text-sm font-semibold text-gray-400 tracking-tight uppercase">
                  Custom Software &amp; Web
                </h2>
              </div>
              <p className="text-sm text-gray-500 font-light leading-relaxed max-w-2xl">
                We also build and maintain custom web applications — including this
                site — for select clients.{" "}
                <a href="/services/web" className="text-gray-400 hover:text-white underline underline-offset-2 transition inline-flex items-center gap-1">
                  Web development services <CodeBracketIcon className="h-3.5 w-3.5" />
                </a>
              </p>
            </section>
          </FadeIn>

          {/* Footer CTA */}
          <footer className="border-t border-white/15 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <p className="max-w-2xl text-sm font-light leading-relaxed text-gray-500">
              Every engagement starts with a conversation about the result you need.
            </p>
            <a
              href="/book"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition"
            >
              Discuss Your Data
            </a>
          </footer>

        </div>
      </main>

      <Footer />
    </div>
  );
}
