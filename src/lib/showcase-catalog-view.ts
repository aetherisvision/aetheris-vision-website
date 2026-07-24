import {
  DEMO_DATASETS,
  buildTargetGrid,
  methodRefusalReason,
  type DemoDataset,
} from './og-demo-inputs'
import type { RegridMethod } from './omni-gridder-proxy'

// The client-safe projection of the showcase catalog.
//
// The browser needs to render the picker, the compatibility matrix, and the
// honest job size — it does NOT need the `gs://` URIs. Those are the engine's
// business, and shipping bucket paths to a page is how internal storage layout
// leaks into screenshots and support threads. The client names a dataset by
// id; the server resolves the id to a URI. This module is the seam that keeps
// that true, and it is what a future PUBLIC showcase route will serve too.

export const ALL_METHODS: RegridMethod[] = ['nearest', 'bilinear', 'conservative', 'ewa']

export const METHOD_LABELS: Record<RegridMethod, string> = {
  nearest: 'Nearest neighbour',
  bilinear: 'Bilinear',
  conservative: 'Conservative',
  ewa: 'EWA (swath)',
}

/** Per-method availability for one dataset, carrying the reason when refused. */
export interface MethodAvailability {
  method: RegridMethod
  allowed: boolean
  /** Present only when `allowed` is false. The engine's reason, not a paraphrase. */
  reason: string | null
}

export interface DatasetView {
  id: string
  label: string
  source: string
  variable: string
  units: string
  geometry: DemoDataset['geometry']
  nativeResolution: string
  demonstrates: string
  /** Region name plus the resolution in its own units — never mixed. */
  targetSummary: string
  /** `EPSG:xxxx`-style label, or "geographic (EPSG:4326)". Projected zones resolve server-side. */
  targetCrsLabel: string
  /**
   * Destination cell count. Exact for a geographic grid; for a projected one
   * it is `null`, because the real number comes from og-server when the grid
   * is generated and guessing it here would be a number the page could not
   * stand behind.
   */
  destinationCells: number | null
  methods: MethodAvailability[]
  /** The method plotted when several run — the first allowed one, per dataset. */
  primaryMethod: RegridMethod
}

/**
 * The method whose result gets plotted when a comparison runs.
 *
 * Deliberately per-dataset rather than a module constant. The page previously
 * hard-coded `bilinear`, which is not merely a style choice now: bilinear is
 * INVALID on a swath source, so a fixed primary would have asked for a plot of
 * a job that was refused and never submitted.
 */
export function primaryMethodFor(dataset: DemoDataset): RegridMethod {
  return dataset.allowedMethods[0]
}

function targetSummary(dataset: DemoDataset): string {
  const t = dataset.target
  return t.kind === 'geographic'
    ? `${t.region} · ${t.resolutionDeg}°`
    : `${t.region} · ${t.resolutionMeters} m`
}

function targetCrsLabel(dataset: DemoDataset): string {
  const t = dataset.target
  if (t.kind === 'geographic') return 'geographic (EPSG:4326)'
  // The alias is shown as "auto" rather than pretending to know the zone: the
  // concrete EPSG code is resolved by og-server from the bbox centroid at
  // submit time, and the result carries it. Displaying a guessed zone here
  // would be a provenance claim the page has not earned.
  return /^utm(_auto)?$/i.test(t.crs.trim()) ? 'UTM (zone resolved by the engine)' : t.crs
}

function destinationCells(dataset: DemoDataset): number | null {
  if (dataset.target.kind !== 'geographic') return null
  try {
    const { lat, lon } = buildTargetGrid(dataset)
    return lat.length * lon.length
  } catch {
    // A malformed catalog entry is reported by the submit path, which is where
    // it can fail loudly. The picker should still render rather than blanking
    // the whole page over one bad row.
    return null
  }
}

export function toDatasetView(dataset: DemoDataset): DatasetView {
  return {
    id: dataset.id,
    label: dataset.label,
    source: dataset.source,
    variable: dataset.variable,
    units: dataset.units,
    geometry: dataset.geometry,
    nativeResolution: dataset.nativeResolution,
    demonstrates: dataset.demonstrates,
    targetSummary: targetSummary(dataset),
    targetCrsLabel: targetCrsLabel(dataset),
    destinationCells: destinationCells(dataset),
    methods: ALL_METHODS.map((method) => ({
      method,
      allowed: dataset.allowedMethods.includes(method),
      reason: methodRefusalReason(dataset, method),
    })),
    primaryMethod: primaryMethodFor(dataset),
  }
}

export function showcaseCatalogView(): DatasetView[] {
  return DEMO_DATASETS.map(toDatasetView)
}
