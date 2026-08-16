import { describe, it, expect } from "vitest";
import { organizationJsonLd, publisherRef, websiteJsonLd } from "@/lib/jsonld";
import { SITE } from "@/lib/constants";

describe("JSON-LD structured data", () => {
  describe("organizationJsonLd", () => {
    it("has correct @type and @context", () => {
      expect(organizationJsonLd["@context"]).toBe("https://schema.org");
      expect(organizationJsonLd["@type"]).toBe("Organization");
    });

    it("references SITE constants consistently", () => {
      expect(organizationJsonLd.name).toBe(SITE.legalName);
      expect(organizationJsonLd.url).toBe(SITE.url);
      expect(organizationJsonLd.logo).toBe(SITE.logoUrl);
    });

    it("does not expose a direct contact address", () => {
      expect(organizationJsonLd).not.toHaveProperty("contactPoint");
    });
  });

  describe("publisherRef", () => {
    it("is a minimal Organization reference", () => {
      expect(publisherRef["@type"]).toBe("Organization");
      expect(publisherRef.name).toBe(SITE.legalName);
      expect(publisherRef.url).toBe(SITE.url);
    });

    it("does not duplicate full organization data", () => {
      expect(publisherRef).not.toHaveProperty("contactPoint");
      expect(publisherRef).not.toHaveProperty("@context");
    });
  });

  describe("websiteJsonLd", () => {
    it("has correct @type", () => {
      expect(websiteJsonLd["@type"]).toBe("WebSite");
    });
  });

  describe("JSON serialization", () => {
    it("produces valid JSON when combined", () => {
      const combined = [organizationJsonLd, websiteJsonLd];
      const json = JSON.stringify(combined);
      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(2);
    });
  });
});
