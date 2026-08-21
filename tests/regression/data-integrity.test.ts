import { describe, it, expect } from "vitest";
import { SITE } from "@/lib/constants";
import { organizationJsonLd, websiteJsonLd, publisherRef } from "@/lib/jsonld";
import { clientWork } from "@/lib/client-work";

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

  it("does not expose direct contact details in public JSON-LD", () => {
    expect(organizationJsonLd).not.toHaveProperty("contactPoint");
    expect(organizationJsonLd).not.toHaveProperty("email");
    expect(organizationJsonLd).not.toHaveProperty("telephone");
  });
});

describe("Regression: delivered client work", () => {
  it("every listed engagement points at a live https URL", () => {
    expect(clientWork.length).toBeGreaterThan(0);
    for (const cs of clientWork) {
      expect(cs.url).toMatch(/^https:\/\//);
      expect(cs.title).toBeTruthy();
      expect(cs.stack).toBeTruthy();
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
