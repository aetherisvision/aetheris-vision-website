import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OmniGridderComparison from "@/components/OmniGridderComparison";

export const metadata = {
  title: `Geospatial Regridding & GIS Transformation | Omni Gridder`,
  description:
    "GIS and geospatial regridding for weather, climate, and Earth-system data across difficult grids, projections, resolutions, and observation geometries.",
  alternates: { canonical: "/omni-gridder" },
};

export default function OmniGridderPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f1ea] text-[#17252f]">
      <Navbar />

      <main id="main" className="flex-1 pt-20">
        <header className="border-b border-[#17252f]/20 bg-[#f4f1ea]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-20 lg:px-10 lg:py-24">
            <div>
              <Link href="/" className="text-xs font-bold uppercase tracking-[0.18em] text-[#486890] hover:underline">
                Aetheris Vision Consulting
              </Link>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Featured Example</p>
              <h1 className="mt-4 font-serif text-[clamp(3.4rem,8vw,7rem)] leading-[0.92] tracking-[-0.05em] text-[#0a1628]">Geospatial Regridding with Omni Gridder</h1>
              <p className="mt-8 max-w-3xl text-xl leading-9 text-[#344852]">
                A preview of a more disciplined GIS workflow for transforming weather and Earth-system data across mismatched grids, coordinate reference systems, resolutions, and observation geometries.
              </p>
            </div>

            <div className="border-l border-[#17252f]/20 pl-7 sm:pl-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">Why we feature it</p>
              <p className="mt-4 text-base leading-7 text-[#42565f]">
                Omni Gridder demonstrates a class of problem we solve and the standard we bring to it. The production architecture, method-selection logic, and safeguards remain proprietary and are scoped to each engagement.
              </p>
              <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                <a
                  href="#demonstration"
                  className="inline-flex items-center gap-2 border-b border-[#29426c]/40 pb-1 text-sm font-semibold text-[#29426c] hover:border-[#29426c]"
                >
                  Explore the demonstration <ArrowRightIcon className="h-4 w-4" />
                </a>
                <a
                  href="/book"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#52656d] hover:text-[#29426c]"
                >
                  Get in touch <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </header>

        <section className="bg-[#0a1628] py-16 text-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-20 lg:px-10">
            <p className="font-serif text-3xl leading-tight tracking-[-0.02em] text-white sm:text-4xl">
              A file can open cleanly and still be wrong for the intended analysis
            </p>
            <p className="border-l border-white/25 pl-6 text-sm leading-6 text-white/65">
              The difficult part is not moving values. It is preserving their meaning.
            </p>
          </div>
        </section>

        <section
          id="legacy-workflow"
          className="scroll-mt-20 border-b border-[#17252f]/15 bg-[#f4f1ea] py-20 sm:py-28"
          aria-labelledby="legacy-workflow-heading"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Before Omni Gridder</p>
              <h2 id="legacy-workflow-heading" className="mt-5 font-serif text-4xl tracking-[-0.025em] text-[#0a1628] sm:text-6xl">
                Too much of the work happened between the tools
              </h2>
            </div>
            <div className="lg:pt-12">
              <p className="font-serif text-2xl leading-9 text-[#253c47] sm:text-3xl sm:leading-10">
                Moving a single weather or Earth-system field between GIS grids could require repairing coordinates, reconciling metadata, and passing intermediate files through several applications before the result could be checked.
              </p>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#52656d]">
                Those tools remain useful. The difficult part is managing the handoffs: hidden defaults, inconsistent geometry, and quality checks performed only at the end. Omni Gridder is being built to bring that work into a controlled, documented, and repeatable workflow.
              </p>
            </div>
          </div>
        </section>

        <section id="demonstration" className="scroll-mt-20 bg-[#fbfaf7] py-20 sm:py-28" aria-labelledby="comparison-heading">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 gap-7 border-b border-[#17252f]/20 pb-9 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#486890]">Coordinate Geometry</p>
                <h2 id="comparison-heading" className="mt-5 font-serif text-4xl tracking-[-0.025em] text-[#0a1628] sm:text-6xl">Preserving meaning as the geometry changes</h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-[#4b5d64] lg:justify-self-end">
                This controlled geospatial regridding example holds the synthetic field constant while its geometry changes. It reveals the challenge Omni Gridder is designed to solve—not the production logic behind the result.
              </p>
            </div>
            <div className="mt-10">
              <OmniGridderComparison />
            </div>
          </div>
        </section>

        <section className="bg-[#0a1628] py-20 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7eabca]">Aetheris Vision</p>
              <h2 className="mt-5 max-w-4xl font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-6xl">Bring us a different scientific data problem</h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/65">
                Omni Gridder is one example. If data preparation, model interpretation, or a fragile scientific workflow is slowing your project, tell us what the finished result needs to do. Project workflows are documented for future reruns, while client data are transferred or removed under the agreed retention terms.
              </p>
            </div>
            <a
              href="/book"
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 bg-[#f4f1ea] px-7 text-sm font-semibold text-[#0a1628] transition-colors duration-200 hover:bg-white sm:w-auto lg:justify-self-end"
            >
              Get in touch <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
