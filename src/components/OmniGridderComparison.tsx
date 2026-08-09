import Image from "next/image";

const comparisonFrames = [
  {
    label: "Before",
    title: "Original source grid",
    detail: "Geographic coordinates",
    src: "/images/omni-gridder/source-grid-plate-carree.png",
    alt: "Synthetic CONUS temperature field shown on its original latitude-longitude grid before projection",
  },
  {
    label: "After",
    title: "Delivery-ready grid",
    detail: "Same field, transformed for use",
    src: "/images/omni-gridder/target-grid-lambert.png",
    alt: "The same synthetic CONUS temperature field transformed into a Lambert Conformal map projection",
  },
];

const transformationCapabilities = [
  {
    title: "Coordinate systems",
    detail: "Geographic and projected systems, including Lambert, polar, Albers, LAEA, and UTM.",
  },
  {
    title: "Grid structures",
    detail: "Rectilinear, curvilinear, point-based, and HEALPix geometries.",
  },
  {
    title: "Resolution changes",
    detail: "Fine-to-coarse aggregation and coarse-to-fine interpolation.",
  },
  {
    title: "Data behavior",
    detail: "Continuous fields, categories, and quantities whose totals must be preserved.",
  },
  {
    title: "Remapping methods",
    detail: "Automatic selection or nearest-neighbor, bilinear, conservative, and EWA methods.",
  },
  {
    title: "Source-to-target workflows",
    detail: "A fit-for-purpose path selected for the geometry and meaning of the data.",
  },
];

export default function OmniGridderComparison() {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {comparisonFrames.map((frame) => (
          <figure
            key={frame.label}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#090b0e]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <figcaption>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                  {frame.label}
                </p>
                <h3 className="mt-1 text-base font-medium text-white">{frame.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{frame.detail}</p>
              </figcaption>
            </div>
            <Image
              src={frame.src}
              alt={frame.alt}
              width={900}
              height={640}
              className="h-auto w-full bg-white"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </figure>
        ))}
      </div>

      <div className="mt-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Transformation coverage
        </p>
        <h3 className="mt-2 text-xl font-medium text-white">
          Built for more than one type of grid change
        </h3>
        <p className="mt-2 max-w-3xl text-sm font-light leading-relaxed text-gray-400">
          Omni Gridder handles a broad range of Earth-data transformations while
          matching the method to the geometry and the meaning of the data.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {transformationCapabilities.map((capability) => (
            <div
              key={capability.title}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
            >
              <h4 className="text-sm font-medium text-white">{capability.title}</h4>
              <p className="mt-2 text-xs font-light leading-relaxed text-gray-400">
                {capability.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
