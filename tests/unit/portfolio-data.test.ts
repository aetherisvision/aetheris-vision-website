import { describe, it, expect } from "vitest";
import {
  tiers,
  processSteps,
  sla,
  securityFeatures,
  includedFeatures,
  faqs,
  demos,
  maintenancePlans,
} from "@/lib/portfolio-data";

describe("portfolio-data", () => {
  describe("tiers", () => {
    it("has exactly 3 pricing tiers", () => {
      expect(tiers).toHaveLength(3);
    });

    it("each tier has required fields", () => {
      for (const tier of tiers) {
        expect(tier.name).toBeTruthy();
        expect(tier.price).toBeTruthy();
        expect(tier.deliverables.length).toBeGreaterThan(0);
        expect(tier.cta).toBeTruthy();
      }
    });

    it("exactly one tier is highlighted", () => {
      const highlighted = tiers.filter((t) => t.highlight);
      expect(highlighted).toHaveLength(1);
    });
  });

  describe("processSteps", () => {
    it("has at least 3 steps", () => {
      expect(processSteps.length).toBeGreaterThanOrEqual(3);
    });

    it("each step has a title and desc", () => {
      for (const step of processSteps) {
        expect(step.title).toBeTruthy();
        expect(step.desc).toBeTruthy();
        expect(step.step).toBeTruthy();
      }
    });
  });

  describe("sla", () => {
    it("is a non-empty array", () => {
      expect(sla.length).toBeGreaterThan(0);
    });
  });

  describe("securityFeatures", () => {
    it("each item has title, desc, and icon", () => {
      for (const feat of securityFeatures) {
        expect(feat.title).toBeTruthy();
        expect(feat.desc).toBeTruthy();
        expect(feat.icon).toBeDefined();
      }
    });
  });

  describe("includedFeatures", () => {
    it("is a non-empty array of IconFeature objects", () => {
      expect(includedFeatures.length).toBeGreaterThan(0);
      for (const f of includedFeatures) {
        expect(f.title).toBeTruthy();
        expect(f.desc).toBeTruthy();
        expect(f.icon).toBeDefined();
      }
    });
  });

  describe("faqs", () => {
    it("each FAQ has a question and answer", () => {
      expect(faqs.length).toBeGreaterThan(0);
      for (const faq of faqs) {
        expect(faq.q).toBeTruthy();
        expect(faq.a).toBeTruthy();
      }
    });
  });

  describe("demos", () => {
    it("each demo has required fields", () => {
      for (const demo of demos) {
        expect(demo.title).toBeTruthy();
        expect(demo.slug).toBeTruthy();
        expect(demo.desc).toBeTruthy();
        expect(demo.industry).toBeTruthy();
        expect(demo.stack).toBeTruthy();
        expect(demo.highlight).toBeTruthy();
      }
    });

    it("demo slugs are URL-safe", () => {
      for (const demo of demos) {
        expect(demo.slug).toMatch(/^[a-z0-9-]+$/);
      }
    });

    it("each demo image is a local WebP matching its slug", () => {
      for (const demo of demos) {
        expect(demo.image).toBe(`/images/portfolio/${demo.slug}.webp`);
      }
    });
  });

  describe("maintenancePlans", () => {
    it("has at least 2 plans", () => {
      expect(maintenancePlans.length).toBeGreaterThanOrEqual(2);
    });

    it("each plan has name, price, and features", () => {
      for (const plan of maintenancePlans) {
        expect(plan.name).toBeTruthy();
        expect(plan.price).toBeTruthy();
        expect(plan.features.length).toBeGreaterThan(0);
      }
    });

  });
});
