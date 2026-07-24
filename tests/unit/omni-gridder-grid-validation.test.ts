import { describe, it, expect } from "vitest";
import {
  toJobDstGrid,
  validateGrid,
  type OmniGridderGrid,
} from "@/lib/omni-gridder-client";

// `POST /v1/target-grids` returns a grid that is validated, then converted by
// `toJobDstGrid` into the `dst_grid` shape a job spec embeds (the response's
// projected axes live under coordinates.y/x; the worker reads lat/lon). It
// crosses a process boundary, so a 200 is not evidence the
// body has the shape we are about to pass on — and a malformed grid handed to
// og-server fails later, further away, with a worse message. These tests cover
// the error paths, not just the happy one: a validator whose rejections are
// untested is a validator nobody knows still rejects.

const validGrid = (): OmniGridderGrid => ({
  name: "gfs-hgt500-utm-target",
  shape: [140, 200],
  crs: "EPSG:32614",
  dim_names: ["y", "x"],
  coordinates: {
    y: [3_650_000, 3_655_000, 3_660_000],
    x: [400_000, 405_000, 410_000],
  },
});

describe("validateGrid accepts a well-formed grid", () => {
  it("returns the grid unchanged", () => {
    const g = validGrid();
    expect(validateGrid(g)).toEqual(g);
  });

  it("passes a grid whose extra fields it does not model", () => {
    // The grid is a pass-through artifact; unknown og-core fields must ride
    // along rather than be stripped or rejected.
    const g = { ...validGrid(), some_future_field: { nested: true } };
    expect(validateGrid(g)).toMatchObject({ crs: "EPSG:32614" });
  });
});

describe("toJobDstGrid produces the worker's dst_grid contract", () => {
  it("renames projected y/x axes to lat/lon and carries crs", () => {
    const g = validGrid();
    expect(toJobDstGrid(g)).toEqual({
      name: "gfs-hgt500-utm-target",
      crs: "EPSG:32614",
      lat: g.coordinates.y,
      lon: g.coordinates.x,
    });
  });

  it("passes geographic lat/lon axes through under the same keys", () => {
    const g: OmniGridderGrid = {
      ...validGrid(),
      crs: "EPSG:4326",
      dim_names: ["lat", "lon"],
      coordinates: { lat: [33, 34], lon: [-104, -103] },
    };
    expect(toJobDstGrid(g)).toEqual({
      name: g.name,
      crs: "EPSG:4326",
      lat: [33, 34],
      lon: [-104, -103],
    });
  });

  it("throws a specific error when no embeddable axis pair exists", () => {
    // A response with axis names this seam does not model must fail HERE,
    // not in the worker after the job was already accepted.
    const g: OmniGridderGrid = {
      ...validGrid(),
      coordinates: { pix: [1, 2, 3] },
    };
    expect(() => toJobDstGrid(g)).toThrow(/no embeddable axis pair.*pix/);
  });
});

describe("validateGrid rejects structural damage", () => {
  it("rejects non-objects", () => {
    for (const bad of [null, undefined, 42, "grid", []]) {
      // An array passes `typeof === "object"`, so it must be caught by the
      // field checks rather than assumed away.
      expect(() => validateGrid(bad)).toThrow(/malformed grid/);
    }
  });

  it("rejects a missing or empty crs", () => {
    expect(() => validateGrid({ ...validGrid(), crs: undefined })).toThrow(/crs/);
    expect(() => validateGrid({ ...validGrid(), crs: "" })).toThrow(/crs/);
    expect(() => validateGrid({ ...validGrid(), crs: 32614 })).toThrow(/crs/);
  });

  it("rejects a shape that is missing, empty, or not positive integers", () => {
    expect(() => validateGrid({ ...validGrid(), shape: undefined })).toThrow(/shape/);
    expect(() => validateGrid({ ...validGrid(), shape: [] })).toThrow(/shape/);
    expect(() => validateGrid({ ...validGrid(), shape: [140, 0] })).toThrow(/shape/);
    expect(() => validateGrid({ ...validGrid(), shape: [140, -1] })).toThrow(/shape/);
    expect(() => validateGrid({ ...validGrid(), shape: [140, 1.5] })).toThrow(/shape/);
  });

  it("rejects dim_names that disagree with the shape rank", () => {
    expect(() => validateGrid({ ...validGrid(), dim_names: ["y"] })).toThrow(/dim_names/);
    expect(() => validateGrid({ ...validGrid(), dim_names: undefined })).toThrow(/dim_names/);
  });

  it("rejects missing or non-finite coordinates", () => {
    expect(() => validateGrid({ ...validGrid(), coordinates: undefined })).toThrow(/coordinates/);
    expect(() =>
      validateGrid({ ...validGrid(), coordinates: { y: [1, Number.NaN], x: [1] } }),
    ).toThrow(/non-finite/);
    expect(() =>
      validateGrid({ ...validGrid(), coordinates: { y: [1, Number.POSITIVE_INFINITY], x: [1] } }),
    ).toThrow(/non-finite/);
    expect(() => validateGrid({ ...validGrid(), coordinates: { y: "1,2,3" } })).toThrow(
      /not an array/,
    );
  });

  it("rejects a missing name", () => {
    expect(() => validateGrid({ ...validGrid(), name: undefined })).toThrow(/name/);
  });
});

describe("validateGrid rejects an unresolved UTM alias", () => {
  // og-server resolves "utm" to a concrete EPSG zone BEFORE returning, so the
  // artifact records which zone was actually used. If the alias ever survived
  // into a stored grid, the provenance claim would be silently false — the
  // artifact would say "utm" forever and no one could tell which zone ran.
  it("refuses the literal alias in any casing or padding", () => {
    for (const alias of ["utm", "UTM", "Utm", " utm ", "utm_auto", "UTM_AUTO"]) {
      expect(() => validateGrid({ ...validGrid(), crs: alias })).toThrow(/unresolved alias/);
    }
  });

  it("accepts a resolved zone in either hemisphere", () => {
    expect(validateGrid({ ...validGrid(), crs: "EPSG:32614" }).crs).toBe("EPSG:32614");
    expect(validateGrid({ ...validGrid(), crs: "EPSG:32714" }).crs).toBe("EPSG:32714");
  });

  it("does not reject a legitimate CRS that merely contains the letters", () => {
    // The check is anchored, not a substring match — a PROJ string mentioning
    // the projection by name is a real, resolved CRS.
    const projString = "+proj=utm +zone=14 +datum=WGS84 +units=m +no_defs";
    expect(validateGrid({ ...validGrid(), crs: projString }).crs).toBe(projString);
  });
});
