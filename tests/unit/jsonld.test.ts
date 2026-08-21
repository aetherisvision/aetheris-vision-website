import { describe, it, expect } from "vitest";
import { organizationJsonLd, publisherRef, websiteJsonLd } from "@/lib/jsonld";
import { SITE } from "@/lib/constants";

describe("JSON-LD structured data", () => {
  describe("organizationJsonLd", () => {
    it("has correct @type and @context", () => {
      expect(organizationJsonLd["@context"]).toBe("https://schema.org");
      expect(organizationJsonLd["@type"]).toEqual([
        "Organization",
        "ProfessionalService",
      ]);
    });

    it("references SITE constants consistently", () => {
      expect(organizationJsonLd.name).toBe(SITE.legalName);
      expect(organizationJsonLd.url).toBe(SITE.url);
      expect(organizationJsonLd.logo).toBe(SITE.logoUrl);
      expect(organizationJsonLd["@id"]).toBe(`${SITE.url}/#organization`);
    });

    it("does not expose a direct contact address", () => {
      expect(organizationJsonLd).not.toHaveProperty("contactPoint");
    });

    it("describes the principal's CCM credential and AMS issuer", () => {
      expect(organizationJsonLd.founder.hasCredential.name).toBe(
        "Certified Consulting Meteorologist (CCM)",
      );
      expect(
        organizationJsonLd.founder.hasCredential.recognizedBy.name,
      ).toBe("American Meteorological Society (AMS)");
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
      expect(websiteJsonLd.publisher["@id"]).toBe(
        organizationJsonLd["@id"],
      );
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
