import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { GEOSPATIAL_SEO_KEYWORDS, SITE } from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";

const PAGE_URL = `${SITE.url}/services/geospatial-regridding`;
const PAGE_DESCRIPTION =
  "GIS consulting and geospatial regridding for weather, climate, satellite, and environmental data, including CRS transformation, reprojection, resampling, and validation.";

export const metadata = createPageMetadata({
  title: `GIS & Geospatial Regridding Services | ${SITE.name}`,
  description: PAGE_DESCRIPTION,
  path: "/services/geospatial-regridding",
  keywords: [...GEOSPATIAL_SEO_KEYWORDS],
  socialDescription:
    "Transform weather and Earth-system data across coordinate systems, grids, resolutions, and scientific formats without losing meaning.",
});

const capabilities = [
  {
    title: "CRS transformation and reprojection",
    body: "Move data between geographic and projected coordinate reference systems while preserving the geometry, extent, and metadata the destination requires.",
  },
  {
    title: "Geospatial regridding and resampling",
    body: "Transform rectilinear, curvilinear, point-based, HEALPix, and other Earth-data geometries across resolutions and spatial extents.",
  },
  {
    title: "Spatial interpolation and remapping",
    body: "Select nearest-neighbor, bilinear, conservative remapping, or Elliptical Weighted Averaging (EWA) according to whether a field is continuous, categorical, conservation-sensitive, or sampled along satellite swaths.",
  },
  {
    title: "Scientific format engineering",
    body: "Build coherent workflows around GRIB, BUFR, NetCDF, HDF, raster, point, and related meteorological or geospatial data sources.",
  },
  {
    title: "Quality assurance and provenance",
    body: "Check for missing data, coordinate errors, edge artifacts, conservation changes, and other failures, then document sources, assumptions, and transformations.",
  },
  {
    title: "Repeatable data pipelines",
    body: "Turn a one-off GIS procedure into a documented scientific pipeline that can be reviewed, rerun, and integrated with analysis, modeling, or operations.",
  },
];

const applications = [
  "Numerical weather prediction and AI weather workflows",
  "Satellite, radar, and remote-sensing data preparation",
  "Climate, hydrology, ocean, and environmental analysis",
  "Model-to-observation and model-to-model comparison",
  "GIS-ready delivery for scientific and operational teams",
];

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "GIS and geospatial regridding services",
  url: PAGE_URL,
  description: PAGE_DESCRIPTION,
  areaServed: "US",
  provider: {
    "@type": "Organization",
    name: SITE.legalName,
    url: SITE.url,
  },
  serviceType: [
    "GIS consulting",
    "Geospatial regridding",
    "Coordinate reference system transformation",
    "Spatial interpolation",
    "Bilinear interpolation",
    "Conservative regridding",
    "Elliptical Weighted Averaging (EWA)",
    "Satellite swath resampling",
    "Earth-system data engineering",
  ],
};

export default function GeospatialRegriddingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505] text-gray-100">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28">
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
              GIS &amp; <span className="whitespace-nowrap">Earth-Data</span> Transformation
            </p>
            <h1 className="mt-5 max-w-5xl font-serif text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Geospatial Regridding
            </h1>
            <p className="mt-7 max-w-3xl text-lg font-light leading-8 text-gray-400 sm:text-xl">
              Transform weather, climate, satellite, and environmental data across coordinate systems, grids, resolutions, and scientific formats—without losing the physical meaning that makes the data useful.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {["GIS consulting", "Geospatial regridding", "CRS transformation", "Spatial validation"].map((item) => (
                <span key={item} className="rounded-full border border-white/15 px-4 py-2 text-xs text-gray-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="capabilities-heading">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">Capabilities</p>
              <h2 id="capabilities-heading" className="mt-4 font-serif text-3xl leading-tight text-white sm:text-4xl">
                <span className="whitespace-nowrap">Analysis-Ready</span> Data
              </h2>
              <p className="mt-6 text-base font-light leading-7 text-gray-400">
                The correct GIS operation depends on the variable, geometry, intended use, and acceptable error. Every engagement begins with those constraints.
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7eabca]">Where it applies</p>
              <h2 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
                GIS for Earth Science
              </h2>
              <p className="mt-6 max-w-xl font-light leading-7 text-white/65">
                Generic GIS tools can move pixels and coordinates. Scientific regridding also has to respect units, masks, categories, conservation, time, vertical coordinates, and the assumptions behind the source field.
              </p>
            </div>
            <ul className="space-y-4 lg:pt-10">
              {applications.map((application) => (
                <li key={application} className="flex gap-3 text-sm leading-6 text-white/80">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#7eabca]" />
                  {application}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-8 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">See the approach</p>
              <h2 className="mt-4 font-serif text-3xl text-white sm:text-4xl">See Regridding in Action</h2>
              <p className="mt-4 max-w-2xl font-light leading-7 text-gray-400">
                Omni Gridder demonstrates how the same synthetic meteorological field changes geometry while its scientific meaning is preserved.
              </p>
            </div>
            <Link href="/omni-gridder" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/5">
              Explore Omni Gridder <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-lg font-light text-gray-300">
              Have GIS or Earth data that does not line up with the system that needs it?
            </p>
            <Link href="/contact#contact-form" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-7 text-sm font-medium text-black transition hover:bg-gray-200">
              Discuss Your Data <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
    </div>
  );
}
