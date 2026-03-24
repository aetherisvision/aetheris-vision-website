import { describe, it, expect } from "vitest";
import { SITE } from "@/lib/constants";
import { organizationJsonLd, websiteJsonLd, publisherRef } from "@/lib/jsonld";
import {
  tiers,
  processSteps,
  includedFeatures,
  maintenancePlans,
  demos,
} from "@/lib/portfolio-data";

/**
 * Regression tests — these lock in key business rules and data integrity
 * so refactoring never silently breaks critical properties.
 */
describe("Regression: brand consistency", () => {
  it("SITE.legalName appears in JSON-LD Organization", () => {
    expect(organizationJsonLd.name).toBe(SITE.legalName);
  });

  it("SITE.legalName appears in JSON-LD publisher ref", () => {
    expect(publisherRef.name).toBe(SITE.legalName);
  });

  it("SITE.url appears in JSON-LD WebSite", () => {
    expect(websiteJsonLd.url).toBe(SITE.url);
  });

  it("SITE.email appears in JSON-LD contactPoint", () => {
    expect(organizationJsonLd.contactPoint.email).toBe(SITE.email);
  });
});

describe("Regression: portfolio data completeness", () => {
  it("includedFeatures is defined and non-empty (was previously missing)", () => {
    expect(includedFeatures).toBeDefined();
    expect(Array.isArray(includedFeatures)).toBe(true);
    expect(includedFeatures.length).toBeGreaterThanOrEqual(5);
  });

  it("maintenancePlans is defined and non-empty (was previously missing)", () => {
    expect(maintenancePlans).toBeDefined();
    expect(Array.isArray(maintenancePlans)).toBe(true);
    expect(maintenancePlans.length).toBeGreaterThanOrEqual(2);
  });

  it("all 3 pricing tiers exist", () => {
    expect(tiers).toHaveLength(3);
    const names = tiers.map((t) => t.name);
    expect(names).toContain("Professional");
    expect(names).toContain("Business");
    expect(names).toContain("Enterprise");
  });

  it("processSteps have step numbers and descriptions", () => {
    for (const step of processSteps) {
      expect(step.step).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.desc).toBeTruthy();
    }
  });

  it("all demo pages have valid slugs", () => {
    for (const demo of demos) {
      expect(demo.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("Regression: URL safety", () => {
  it("SITE.url has no trailing slash", () => {
    expect(SITE.url.endsWith("/")).toBe(false);
  });

  it("SITE.email is a valid email format", () => {
    expect(SITE.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  });
});
