import Image from "next/image";

const comparisonFrames = [
  {
    label: "Source",
    title: "Geographic grid",
    detail: "Latitude–longitude geometry",
    src: "/images/omni-gridder/source-grid-plate-carree.png",
    alt: "Synthetic continental United States temperature field shown on its original latitude-longitude grid before reprojection",
  },
  {
    label: "Destination",
    title: "Lambert Conformal grid",
    detail: "Same field, operationally useful geometry",
    src: "/images/omni-gridder/target-grid-lambert.png",
    alt: "The same synthetic continental United States temperature field transformed onto a Lambert Conformal grid",
  },
];

const conservativeSourceColors = [
  "#dce8eb", "#b9d1d9", "#86adbd", "#638ba2",
  "#cbdde2", "#95bbc7", "#6f9aaf", "#496f8b",
  "#abc8d2", "#7ea8b8", "#567f99", "#365d7e",
  "#8eb5c2", "#608da2", "#426b87", "#294d70",
];

const conservativeDestinationColors = ["#bed5dc", "#688fa4", "#7da6b5", "#3a6380"];

const ewaDestinationColors = [
  "#edf1ef", "#dce9e6", "#c4dad4", "#aecdc5",
  "#e3eeeb", "#c5ddd7", "#98c0b6", "#80aea3",
  "#d2e4df", "#a9ccc4", "#75a99e", "#5a9186",
  "#c8ded8", "#97bfb6", "#668f88", "#426f69",
];

function ConservativeSchematic() {
  return (
    <svg
      viewBox="0 0 620 250"
      role="img"
      aria-label="Conceptual diagram of fine source cells being conservatively remapped to coarser destination cells"
      className="h-auto w-full"
    >
      <defs>
        <marker id="conservative-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#486890" />
        </marker>
      </defs>
      <text x="24" y="24" fill="#486890" fontSize="12" fontWeight="700" letterSpacing="1.4">SOURCE GEOMETRY</text>
      <text x="410" y="24" fill="#486890" fontSize="12" fontWeight="700" letterSpacing="1.4">TARGET GEOMETRY</text>
      {conservativeSourceColors.map((color, index) => (
        <rect
          key={color + index}
          x={24 + (index % 4) * 43}
          y={46 + Math.floor(index / 4) * 43}
          width="43"
          height="43"
          fill={color}
          stroke="#fbfaf7"
          strokeWidth="3"
        />
      ))}
      <line x1="232" y1="132" x2="365" y2="132" stroke="#486890" strokeWidth="2" markerEnd="url(#conservative-arrow)" />
      <text x="299" y="123" textAnchor="middle" fill="#52656d" fontSize="11" fontWeight="700">OMNI GRIDDER</text>
      {conservativeDestinationColors.map((color, index) => (
        <rect
          key={color + index}
          x={410 + (index % 2) * 86}
          y={46 + Math.floor(index / 2) * 86}
          width="86"
          height="86"
          fill={color}
          stroke="#fbfaf7"
          strokeWidth="4"
        />
      ))}
      <text x="24" y="239" fill="#42565f" fontSize="12">Resolution changes</text>
      <text x="410" y="239" fill="#42565f" fontSize="12">Scientific meaning carried forward</text>
    </svg>
  );
}

function EwaSchematic() {
  return (
    <svg
      viewBox="0 0 620 250"
      role="img"
      aria-label="Conceptual diagram of geolocated satellite pixel footprints being resampled to a regular destination grid with elliptical weighted averaging"
      className="h-auto w-full"
    >
      <defs>
        <marker id="ewa-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#486890" />
        </marker>
      </defs>
      <text x="24" y="24" fill="#486890" fontSize="12" fontWeight="700" letterSpacing="1.4">OBSERVATION GEOMETRY</text>
      <text x="410" y="24" fill="#486890" fontSize="12" fontWeight="700" letterSpacing="1.4">ANALYSIS GRID</text>
      <path d="M 31 189 C 82 71, 149 54, 216 73" fill="none" stroke="#9aadb3" strokeWidth="1.5" strokeDasharray="5 5" />
      {[
        [56, 162, -31, "#d7e8e3"],
        [91, 116, -21, "#b6d2ca"],
        [136, 86, -9, "#83afa5"],
        [188, 78, 8, "#527f77"],
      ].map(([cx, cy, rotation, color], index) => (
        <ellipse
          key={index}
          cx={cx as number}
          cy={cy as number}
          rx="34"
          ry="19"
          transform={`rotate(${rotation} ${cx} ${cy})`}
          fill={color as string}
          fillOpacity="0.92"
          stroke="#315d55"
          strokeWidth="1.5"
        />
      ))}
      <line x1="248" y1="132" x2="365" y2="132" stroke="#486890" strokeWidth="2" markerEnd="url(#ewa-arrow)" />
      <text x="306" y="123" textAnchor="middle" fill="#52656d" fontSize="11" fontWeight="700">OMNI GRIDDER</text>
      {ewaDestinationColors.map((color, index) => (
        <rect
          key={color + index}
          x={410 + (index % 4) * 43}
          y={46 + Math.floor(index / 4) * 43}
          width="43"
          height="43"
          fill={color}
          stroke="#fbfaf7"
          strokeWidth="3"
        />
      ))}
      <text x="24" y="239" fill="#42565f" fontSize="12">Irregular observations</text>
      <text x="410" y="239" fill="#42565f" fontSize="12">Analysis-ready output</text>
    </svg>
  );
}

export default function OmniGridderComparison() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {comparisonFrames.map((frame) => (
          <figure
            key={frame.label}
            className="overflow-hidden border border-[#17252f]/20 bg-white"
          >
            <figcaption className="flex items-start justify-between gap-4 border-b border-[#17252f]/15 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#486890]">
                  {frame.label}
                </p>
                <h3 className="mt-1 font-serif text-2xl text-[#0a1628]">{frame.title}</h3>
                <p className="mt-1 text-xs text-[#6a797e]">{frame.detail}</p>
              </div>
            </figcaption>
            <Image
              src={frame.src}
              alt={frame.alt}
              width={900}
              height={640}
              loading="eager"
              className="h-auto w-full bg-white"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </figure>
        ))}
      </div>

      <p className="mt-4 max-w-4xl text-xs leading-5 text-[#6a797e]">
        Illustrative preview. Production workflows include method selection, safeguards, and verification not shown here.
      </p>

      <section className="mt-20" aria-labelledby="workflows-heading">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#486890]">Where method matters</p>
            <h3 id="workflows-heading" className="mt-3 font-serif text-4xl tracking-[-0.025em] text-[#0a1628] sm:text-5xl">
              When simple interpolation is not enough
            </h3>
          </div>
          <div>
            <p className="text-base leading-7 text-[#42565f]">
              Familiar methods such as nearest-neighbor and bilinear interpolation remain useful. Omni Gridder is aimed at the harder cases—where resolution, physical meaning, or observation geometry makes a visually plausible answer insufficient.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="min-w-0 border border-[#17252f]/20 bg-white p-5 sm:p-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#486890]">Conservative remapping</p>
              <h4 id="conservative-heading" className="mt-2 font-serif text-2xl text-[#0a1628]">Preserve what matters as resolution changes</h4>
            </div>
            <div
              className="mt-6 max-w-full overflow-x-auto overscroll-x-contain border-y border-[#17252f]/15 py-4"
              role="region"
              aria-labelledby="conservative-heading"
              aria-describedby="conservative-scroll-hint"
              tabIndex={0}
            >
              <span id="conservative-scroll-hint" className="sr-only">Scroll horizontally to view the complete diagram on a small screen</span>
              <div className="min-w-[560px] sm:min-w-0">
                <ConservativeSchematic />
              </div>
            </div>
            <p className="pt-5 text-sm leading-6 text-[#52656d]">
              Used where totals or area-weighted quantities must remain consistent between source and target grids.
            </p>
          </article>

          <article className="min-w-0 border border-[#17252f]/20 bg-white p-5 sm:p-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#486890]">Elliptical Weighted Averaging (EWA)</p>
              <h4 id="ewa-heading" className="mt-2 font-serif text-2xl text-[#0a1628]">Respect the observation geometry</h4>
            </div>
            <div
              className="mt-6 max-w-full overflow-x-auto overscroll-x-contain border-y border-[#17252f]/15 py-4"
              role="region"
              aria-labelledby="ewa-heading"
              aria-describedby="ewa-scroll-hint"
              tabIndex={0}
            >
              <span id="ewa-scroll-hint" className="sr-only">Scroll horizontally to view the complete diagram on a small screen</span>
              <div className="min-w-[560px] sm:min-w-0">
                <EwaSchematic />
              </div>
            </div>
            <p className="pt-5 text-sm leading-6 text-[#52656d]">
              Suited to satellite swaths and other geolocated observations whose footprints do not behave like a conventional source grid.
            </p>
          </article>
        </div>

        <p className="mt-6 border-t border-[#17252f]/15 pt-5 text-sm leading-6 text-[#52656d]">
          Planned extensions include spherical harmonic transforms and other scale-aware methods.
        </p>
      </section>
    </div>
  );
}
