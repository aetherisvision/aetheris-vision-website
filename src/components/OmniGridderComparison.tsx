import Image from "next/image";

const comparisonFrames = [
  {
    label: "Before",
    title: "Geographic source view",
    detail: "0.5° latitude–longitude grid · EPSG:4326",
    src: "/images/omni-gridder/source-grid-plate-carree.png",
    alt: "Synthetic CONUS temperature field shown on its original latitude-longitude grid before projection",
  },
  {
    label: "After",
    title: "Projected delivery view",
    detail: "Lambert Conformal target · same field",
    src: "/images/omni-gridder/target-grid-lambert.png",
    alt: "The same synthetic CONUS temperature field transformed into a Lambert Conformal map projection",
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

      <div className="mt-6 grid gap-4 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-5 text-sm md:grid-cols-[1.5fr_1fr]">
        <p className="font-light leading-relaxed text-gray-300">
          The data field is held constant so the geometry change is easy to judge.
          Both images are deterministic outputs from Omni Gridder&apos;s Rust plotting
          engine and are retained as pixel-regression fixtures.
        </p>
        <div className="space-y-2 font-mono text-xs text-gray-400">
          <p><span className="text-blue-400">Changed:</span> coordinate geometry</p>
          <p><span className="text-blue-400">Preserved:</span> values and missing-data mask</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        The white area over the central Rockies is an intentional missing-data test,
        not a rendering defect. This is a controlled engineering result, not customer data.
      </p>
    </div>
  );
}
