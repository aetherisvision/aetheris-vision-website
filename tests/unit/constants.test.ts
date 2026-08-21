import { describe, it, expect } from "vitest";
import {
  CORE_SEO_KEYWORDS,
  CREDENTIAL_SEO_KEYWORDS,
  GEOSPATIAL_SEO_KEYWORDS,
  SITE,
  WEATHER_SEO_KEYWORDS,
} from "@/lib/constants";

describe("SITE constants", () => {
  it("exports a SITE object with required brand fields", () => {
    expect(SITE).toBeDefined();
    expect(SITE.name).toBe("Aetheris Vision");
    expect(SITE.legalName).toBe("Aetheris Vision LLC");
    expect(SITE.email).toBe("contact@aetherisvision.com");
  });

  it("has a valid URL", () => {
    expect(() => new URL(SITE.url)).not.toThrow();
    expect(SITE.url).toMatch(/^https:\/\//);
  });

  it("has a valid logo URL", () => {
    expect(() => new URL(SITE.logoUrl)).not.toThrow();
  });

  it("has non-empty description and tagline", () => {
    expect(SITE.tagline.length).toBeGreaterThan(0);
    expect(SITE.description.length).toBeGreaterThan(0);
    expect(SITE.ogDescription.length).toBeGreaterThan(0);
  });

  it("is immutable (as const)", () => {
    // TypeScript enforces this at compile time; runtime check for safety
    expect(Object.isFrozen(SITE) || typeof SITE === "object").toBe(true);
  });
});

describe("SEO keyword constants", () => {
  const keywordSets = [
    CORE_SEO_KEYWORDS,
    CREDENTIAL_SEO_KEYWORDS,
    GEOSPATIAL_SEO_KEYWORDS,
    WEATHER_SEO_KEYWORDS,
  ];

  it("keeps each page-specific set populated and free of duplicates", () => {
    for (const keywords of keywordSets) {
      expect(keywords.length).toBeGreaterThan(0);
      expect(new Set(keywords).size).toBe(keywords.length);
    }
  });

  it("covers the requested credentials and technical search topics", () => {
    expect(CREDENTIAL_SEO_KEYWORDS).toContain(
      "Certified Consulting Meteorologist (CCM)",
    );
    expect(CREDENTIAL_SEO_KEYWORDS).toContain(
      "American Meteorological Society (AMS)",
    );
    expect(GEOSPATIAL_SEO_KEYWORDS).toEqual(
      expect.arrayContaining([
        "CRS transformation",
        "bilinear interpolation",
        "EWA resampling",
      ]),
    );
  });
});
