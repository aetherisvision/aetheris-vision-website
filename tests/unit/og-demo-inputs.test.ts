import { describe, it, expect } from "vitest";
import {
  DEMO_DATASETS,
  DEFAULT_DATASET_ID,
  SWATH_METHOD_REFUSAL,
  allowedInputUris,
  buildTargetGrid,
  datasetById,
  methodRefusalReason,
  type DemoDataset,
} from "@/lib/og-demo-inputs";
import type { RegridMethod } from "@/lib/omni-gridder-proxy";

const gfs = () => datasetById("gfs-hgt500") as DemoDataset;
const goes = () => datasetById("goes18-abi-c13") as DemoDataset;
const himawari = () => datasetById("himawari9-ahi-c13") as DemoDataset;

describe("showcase dataset catalog", () => {
  it("serves a rectilinear model field and two geostationary satellites from different agencies", () => {
    // The point of the catalog is VARIETY of KIND, not a longer list of files:
    // one separable-axis source and two per-pixel-geolocated swaths exercise
    // genuinely different paths through the engine. A catalog that drifted to
    // three rectilinear files would still pass every other test here while
    // demonstrating nothing.
    expect(DEMO_DATASETS.filter((d) => d.geometry === "rectilinear").length).toBeGreaterThan(0);
    expect(
      DEMO_DATASETS.filter((d) => d.geometry === "geostationary-swath").length,
    ).toBeGreaterThanOrEqual(2);

    const agencies = new Set(DEMO_DATASETS.map((d) => d.source.split(" ")[0]));
    expect(agencies.size).toBeGreaterThanOrEqual(2);
  });

  it("gives every dataset a distinct id and URI", () => {
    const ids = DEMO_DATASETS.map((d) => d.id);
    const uris = DEMO_DATASETS.map((d) => d.uri);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(uris).size).toBe(uris.length);
  });

  it("exposes exactly the catalogued URIs as the SSRF allowlist", () => {
    expect(allowedInputUris().sort()).toEqual(DEMO_DATASETS.map((d) => d.uri).sort());
  });

  it("names a default dataset that exists", () => {
    expect(datasetById(DEFAULT_DATASET_ID)).not.toBeNull();
  });
});

describe("datasetById", () => {
  it("returns the default for an absent id", () => {
    expect(datasetById(undefined)?.id).toBe(DEFAULT_DATASET_ID);
  });

  it("returns null for an unknown id rather than silently defaulting", () => {
    // Answering a request for a dataset we do not serve with a DIFFERENT
    // dataset's result would misreport what was computed. This must stay a
    // refusal, not a fallback.
    expect(datasetById("no-such-dataset")).toBeNull();
    expect(datasetById("")).not.toBeNull(); // empty string is "unspecified", not "unknown"
  });
});

describe("method compatibility is per-geometry, not global", () => {
  it("allows all three classical methods on the rectilinear source", () => {
    for (const m of ["nearest", "bilinear", "conservative"] as RegridMethod[]) {
      expect(methodRefusalReason(gfs(), m)).toBeNull();
    }
  });

  it("refuses EWA on the rectilinear source", () => {
    // EWA is the swath resampler; it is meaningless on separable axes.
    expect(methodRefusalReason(gfs(), "ewa")).not.toBeNull();
  });

  it("refuses bilinear and conservative on both satellites, with the swath reason", () => {
    for (const dataset of [goes(), himawari()]) {
      for (const m of ["bilinear", "conservative"] as RegridMethod[]) {
        const reason = methodRefusalReason(dataset, m);
        expect(reason).toBe(SWATH_METHOD_REFUSAL);
        // The reason is customer-facing copy: it must actually explain the
        // geometry, not just say "unsupported".
        expect(reason).toMatch(/per-pixel geolocation/);
      }
    }
  });

  it("allows EWA and nearest on both satellites", () => {
    for (const dataset of [goes(), himawari()]) {
      expect(methodRefusalReason(dataset, "ewa")).toBeNull();
      expect(methodRefusalReason(dataset, "nearest")).toBeNull();
    }
  });

  it("keeps allowedMethods and methodRefusalReason consistent for every dataset", () => {
    // Two representations of the same fact — if they ever disagree, the UI
    // (which reads allowedMethods) and the proxy (which calls
    // methodRefusalReason) would enforce different matrices.
    const every: RegridMethod[] = ["nearest", "bilinear", "conservative", "ewa"];
    for (const dataset of DEMO_DATASETS) {
      for (const m of every) {
        const allowed = dataset.allowedMethods.includes(m);
        expect(methodRefusalReason(dataset, m) === null).toBe(allowed);
      }
    }
  });
});

describe("buildTargetGrid", () => {
  it("reproduces the legacy CONUS grid exactly for the model field", () => {
    // Regression pin, and the reason the generalization was safe to make: the
    // weight cache is keyed on the destination axes, so a grid differing even
    // in the last decimal would silently orphan every operator cached before
    // the catalog replaced the hard-coded builder.
    const { lat, lon } = buildTargetGrid(gfs());

    expect(lat.length).toBe(51);
    expect(lon.length).toBe(119);
    expect(lat[0]).toBe(24);
    expect(lat[lat.length - 1]).toBe(49);
    expect(lon[0]).toBe(-125);
    expect(lon[lon.length - 1]).toBe(-66);

    // Value-for-value against the original implementation, not just endpoints.
    const legacyLat = Array.from({ length: 51 }, (_, i) => Math.round((24 + i * 0.5) * 1000) / 1000);
    const legacyLon = Array.from(
      { length: 119 },
      (_, i) => Math.round((-125 + i * 0.5) * 1000) / 1000,
    );
    expect(lat).toEqual(legacyLat);
    expect(lon).toEqual(legacyLon);
  });

  it("builds the proven satellite grids at demo resolution", () => {
    // These bboxes and resolutions came from a staging run known to produce
    // real output; a grid that missed the granule footprint would regrid to
    // all-NaN and still "succeed".
    const g = buildTargetGrid(goes());
    expect(g.lat.length * g.lon.length).toBeGreaterThan(1_000_000);
    expect(g.lat[0]).toBe(20);
    expect(g.lon[0]).toBe(-135);

    const h = buildTargetGrid(himawari());
    expect(h.lat.length * h.lon.length).toBeGreaterThan(1_000_000);
    expect(h.lat[0]).toBe(49);
    expect(h.lon[0]).toBe(70);
  });

  it("never overshoots the bbox", () => {
    for (const dataset of DEMO_DATASETS) {
      const [west, south, east, north] = dataset.target.bbox;
      const { lat, lon } = buildTargetGrid(dataset);
      expect(lat[0]).toBeGreaterThanOrEqual(south);
      expect(lat[lat.length - 1]).toBeLessThanOrEqual(north);
      expect(lon[0]).toBeGreaterThanOrEqual(west);
      expect(lon[lon.length - 1]).toBeLessThanOrEqual(east);
    }
  });

  it("produces strictly increasing axes at the catalogued spacing", () => {
    for (const dataset of DEMO_DATASETS) {
      const { lat, lon } = buildTargetGrid(dataset);
      for (const axis of [lat, lon]) {
        expect(axis.length).toBeGreaterThan(1);
        for (let i = 1; i < axis.length; i++) {
          expect(axis[i]).toBeGreaterThan(axis[i - 1]);
        }
      }
      // Spacing holds to the rounding precision the builder applies.
      expect(lat[1] - lat[0]).toBeCloseTo(dataset.target.resolutionDeg, 6);
    }
  });

  it("keeps every catalogued grid under the showcase cell cap", () => {
    for (const dataset of DEMO_DATASETS) {
      const { lat, lon } = buildTargetGrid(dataset);
      expect(lat.length * lon.length).toBeLessThanOrEqual(4_000_000);
    }
  });
});

describe("buildTargetGrid error paths", () => {
  // A malformed catalog entry is a server bug. It must fail loudly at build
  // time rather than asking og-server to materialize a degenerate or enormous
  // array — so these paths get their own tests, not just the happy path.
  const withTarget = (target: Partial<DemoDataset["target"]>): DemoDataset => ({
    ...gfs(),
    target: { ...gfs().target, ...target },
  });

  it("rejects a non-positive or non-finite resolution", () => {
    for (const bad of [0, -0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => buildTargetGrid(withTarget({ resolutionDeg: bad }))).toThrow(/resolution/);
    }
  });

  it("rejects an inverted or degenerate bbox", () => {
    expect(() => buildTargetGrid(withTarget({ bbox: [10, 0, -10, 20] }))).toThrow(/bbox/);
    expect(() => buildTargetGrid(withTarget({ bbox: [0, 20, 10, 0] }))).toThrow(/bbox/);
    expect(() => buildTargetGrid(withTarget({ bbox: [5, 0, 5, 20] }))).toThrow(/bbox/);
  });

  it("rejects a grid above the cell cap instead of building it", () => {
    expect(() =>
      buildTargetGrid(withTarget({ bbox: [-180, -90, 180, 90], resolutionDeg: 0.01 })),
    ).toThrow(/showcase limit/);
  });
});
