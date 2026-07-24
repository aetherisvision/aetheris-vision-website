import type { RegridMethod } from './omni-gridder-proxy'

// Server-side catalog of omni-gridder showcase datasets — the single source of
// truth for which inputs may be regridded, onto which target grid, by which
// methods. Shared by the submit route (choosing the job spec) and the status
// route (validating the compare_uri passed back for the before/after panel).
//
// Why a catalog and not a bare URI allowlist: the showcase has to demonstrate
// COMPLEXITY, ACCURACY, SPEED and VARIETY, and those only show up when the
// datasets differ in KIND — a rectilinear model field and two geostationary
// satellite swaths from two different agencies exercise genuinely different
// paths through the engine. A list of URIs cannot express the target grid each
// one needs, nor which methods are valid for its geometry.
//
// Never accept an arbitrary client-supplied gs:// URI or dst_grid (SSRF /
// cross-tenant data exposure via og-server reading whatever bucket we hand it;
// resource exhaustion via a client asking for an enormous output array). The
// client sends a dataset ID from this catalog and nothing else.

/**
 * How a dataset's source grid is geolocated. This decides which regridding
 * methods are meaningful, so it is carried explicitly rather than inferred
 * from the file at request time.
 */
export type DemoGeometry = 'rectilinear' | 'geostationary-swath'

export interface DemoTargetGrid {
  /** West, South, East, North in degrees. */
  bbox: [number, number, number, number]
  /** Uniform spacing in degrees, both axes. */
  resolutionDeg: number
  /** Human-readable region name, for the UI. */
  region: string
}

export interface DemoDataset {
  id: string
  uri: string
  label: string
  /** Agency + instrument, shown as provenance in the UI. */
  source: string
  variable: string
  units: string
  geometry: DemoGeometry
  /** Native resolution of the SOURCE, as a display string. */
  nativeResolution: string
  target: DemoTargetGrid
  /**
   * Methods valid for this dataset's source geometry. Enforced server-side —
   * the UI disables the rest with a reason, but the proxy refuses them too,
   * because a UI-only matrix is a suggestion, not a contract.
   */
  allowedMethods: RegridMethod[]
  /** One line on what this dataset demonstrates that the others do not. */
  demonstrates: string
}

/**
 * Why the satellite rows refuse bilinear and conservative.
 *
 * A geostationary granule decodes to per-pixel `lat_2d`/`lon_2d` — swath
 * geometry, not separable axes. `bilinear` requires a rectilinear SOURCE (it
 * interpolates along two independent axes a swath does not have), and
 * `conservative` is currently rectilinear-source-to-rectilinear-destination
 * only. The engine refuses both with a specific error rather than silently
 * returning an approximation, and the showcase surfaces that refusal
 * deliberately: declining to answer when a method does not apply is a feature
 * of this engine, not a gap in it.
 */
export const SWATH_METHOD_REFUSAL =
  'Not applicable to swath geometry — a geostationary granule has per-pixel ' +
  'geolocation, not separable lat/lon axes. The engine refuses this ' +
  'combination rather than returning an approximation.'

/**
 * The showcase catalog.
 *
 * The two satellite granules are REAL staged granules from the multi-satellite
 * demo (`scripts/multi-satellite-demo.sh` in the omni-gridder repo), which ran
 * both satellites end-to-end against deployed staging through one
 * catalog-driven code path. Their bboxes and resolutions are that run's proven
 * values, not fresh guesses — a target grid that misses the granule footprint
 * regrids to all-NaN, so these are taken from a run known to produce real
 * output.
 *
 * NOTE (pre-public, issue #89): these objects live in an `esmai-*` bucket — a
 * cross-project dependency that must move to an og-owned demo bucket before
 * this surface is opened publicly. Acceptable while the showcase is admin-only.
 */
export const DEMO_DATASETS: DemoDataset[] = [
  {
    id: 'gfs-hgt500',
    uri: 'gs://esmai-dev-esmai-objects/demo/hgt500_2026070706_f006.nc',
    label: 'GFS 500 hPa geopotential height',
    source: 'NOAA GFS — global forecast model, +006 h',
    variable: 'hgt500',
    units: 'm',
    geometry: 'rectilinear',
    nativeResolution: '0.25° global',
    target: { bbox: [-125, 24, -66, 49], resolutionDeg: 0.5, region: 'CONUS' },
    // Rectilinear source: every method applies, which is what makes this the
    // dataset that can show a true three-way method comparison.
    allowedMethods: ['nearest', 'bilinear', 'conservative'],
    demonstrates:
      'Three-way method comparison on a smooth field, with conservation residual — the accuracy story.',
  },
  {
    id: 'goes18-abi-c13',
    uri: 'gs://esmai-dev-esmai-objects/demo/multisat/bhiecbhied8920/goes18/granule.nc',
    label: 'GOES-18 ABI band 13 — clean IR window',
    source: 'NOAA GOES-18 (GOES-West) ABI L1b',
    variable: 'C13',
    units: 'K',
    geometry: 'geostationary-swath',
    nativeResolution: '2 km at nadir',
    // Proven values from the multi-satellite staging run: 0.03° over
    // -135..-100 E, 20..50 N is ~1.17M destination cells.
    target: {
      bbox: [-135, 20, -100, 50],
      resolutionDeg: 0.03,
      region: 'Western CONUS / eastern Pacific',
    },
    allowedMethods: ['ewa', 'nearest'],
    demonstrates:
      'Geostationary scan-angle geolocation through +proj=geos, EWA swath resampling onto a ~3 km grid — 1.17M destination cells.',
  },
  {
    id: 'himawari9-ahi-c13',
    uri: 'gs://esmai-dev-esmai-objects/demo/multisat/bhiecbhied8920/himawari9/granule.nc',
    label: 'Himawari-9 AHI band 13 — clean IR window',
    source: 'JMA Himawari-9 AHI (ISatSS T001 tile)',
    variable: 'C13',
    units: 'K',
    geometry: 'geostationary-swath',
    nativeResolution: '2 km at nadir',
    target: {
      bbox: [70, 49, 106, 62],
      resolutionDeg: 0.02,
      region: 'Central Asia / southern Siberia',
    },
    allowedMethods: ['ewa', 'nearest'],
    demonstrates:
      'A different agency and a different satellite through the IDENTICAL code path — onboarding a sensor is a catalog row, not a new adapter.',
  },
]

/** Default dataset when a request does not name one. */
export const DEFAULT_DATASET_ID = DEMO_DATASETS[0].id

/**
 * Resolve a client-supplied dataset id against the catalog. Returns `null` for
 * anything not in it — the caller turns that into a 400.
 *
 * An unknown id is never defaulted silently: a request naming a dataset we do
 * not serve is a client error, and answering it with a different dataset's
 * result would misreport what was computed.
 */
export function datasetById(id: string | undefined): DemoDataset | null {
  if (!id) return DEMO_DATASETS.find((d) => d.id === DEFAULT_DATASET_ID) ?? null
  return DEMO_DATASETS.find((d) => d.id === id) ?? null
}

/** Every URI the catalog can serve — the SSRF allowlist for compare_uri. */
export function allowedInputUris(): string[] {
  return DEMO_DATASETS.map((d) => d.uri)
}

/**
 * Whether a method is valid for a dataset, and why not when it isn't.
 * Server-side twin of the UI's compatibility matrix.
 */
export function methodRefusalReason(
  dataset: DemoDataset,
  method: RegridMethod,
): string | null {
  if (dataset.allowedMethods.includes(method)) return null
  if (dataset.geometry === 'geostationary-swath') return SWATH_METHOD_REFUSAL
  return `Method "${method}" is not enabled for dataset "${dataset.id}".`
}

/**
 * Upper bound on destination cells for any showcase job. The catalog is
 * trusted input, but a future edit that fat-fingers a resolution should fail
 * loudly here rather than asking og-server to materialize a hundred-million-
 * cell array. The largest catalogued grid today is ~1.17M cells.
 */
const MAX_DESTINATION_CELLS = 4_000_000

/**
 * Build a dataset's destination grid server-side.
 *
 * Axes run from the bbox minimum, inclusive of both endpoints where the
 * spacing divides evenly, rounded to 6 decimals to keep the JSON compact and
 * the values stable — a weight-cache key is derived from these axes, so
 * identical submissions must produce byte-identical numbers.
 */
export function buildTargetGrid(dataset: DemoDataset): { lat: number[]; lon: number[] } {
  const { bbox, resolutionDeg } = dataset.target
  const [west, south, east, north] = bbox

  if (!Number.isFinite(resolutionDeg) || resolutionDeg <= 0) {
    throw new Error(
      `dataset ${dataset.id}: resolution must be a finite positive number of degrees, got ${resolutionDeg}`,
    )
  }
  if (!(east > west) || !(north > south)) {
    throw new Error(
      `dataset ${dataset.id}: bbox must satisfy west < east and south < north, got ${JSON.stringify(bbox)}`,
    )
  }

  const axis = (start: number, end: number): number[] => {
    // Floor, not round: an axis must never overshoot its bbox, and a spacing
    // that does not divide the span evenly should stop short rather than
    // extend past the granule footprint.
    const steps = Math.floor((end - start) / resolutionDeg)
    const out: number[] = []
    for (let i = 0; i <= steps; i++) {
      out.push(Math.round((start + i * resolutionDeg) * 1e6) / 1e6)
    }
    return out
  }

  const lat = axis(south, north)
  const lon = axis(west, east)

  const cells = lat.length * lon.length
  if (cells > MAX_DESTINATION_CELLS) {
    throw new Error(
      `dataset ${dataset.id}: destination grid is ${cells} cells, above the ${MAX_DESTINATION_CELLS} showcase limit`,
    )
  }

  return { lat, lon }
}
