import { describe, it, expect } from "vitest";
import { SITE } from "@/lib/constants";

/**
 * Regression tests for sitemap, robots, and SEO metadata consistency.
 * Ensures all routes use SITE constants and critical pages are included.
 */
describe("Regression: sitemap completeness", () => {
  it("sitemap uses SITE.url for all route URLs", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.url).toMatch(new RegExp(`^${SITE.url.replace(/[/.]/g, "\\$&")}`));
    }
  });

  it("sitemap includes portfolio page", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(`${SITE.url}/portfolio`);
  });

  it("sitemap excludes fictional portfolio demo pages", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    const demoSlugs = ["law-firm", "restaurant", "trades-contractor", "veteran-nonprofit"];
    for (const slug of demoSlugs) {
      expect(urls).not.toContain(`${SITE.url}/portfolio/${slug}`);
    }
  });

  it("sitemap excludes conversion-only and review routes", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    expect(urls).not.toContain(`${SITE.url}/review`);
    expect(urls).not.toContain(`${SITE.url}/performance`);
  });

  it("sitemap includes privacy page", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(`${SITE.url}/privacy`);
  });

  it("sitemap includes blog index", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(`${SITE.url}/blog`);
  });

  it("sitemap includes focused weather AI and geospatial service pages", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(`${SITE.url}/services/weather-ai`);
    expect(urls).toContain(`${SITE.url}/services/geospatial-regridding`);
  });
});

describe("Regression: structured service topics", () => {
  it("describes the core weather AI, GIS, and regridding expertise", async () => {
    const { organizationJsonLd } = await import("@/lib/jsonld");
    expect(organizationJsonLd.knowsAbout).toEqual(
      expect.arrayContaining([
        "AI weather forecasting",
        "Geographic information systems (GIS)",
        "Geospatial regridding",
        "Coordinate reference system transformation",
        "Weather and climate data analysis",
        "Bilinear interpolation",
        "Elliptical Weighted Averaging (EWA)",
      ]),
    );
  });
});

describe("Regression: robots.txt", () => {
  it("robots uses SITE.url for sitemap reference", async () => {
    const { default: robots } = await import("@/app/robots");
    const config = robots();
    expect(config.sitemap).toBe(`${SITE.url}/sitemap.xml`);
  });
});
