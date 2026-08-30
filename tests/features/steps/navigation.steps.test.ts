import { describe, it, expect } from "vitest";
import { posts } from "@/lib/posts";
import { INSIGHTS_PUBLIC } from "@/lib/features";

/**
 * BDD step definitions for navigation.feature
 */

describe("Feature: Site Navigation", () => {
  describe("Scenario: All required pages appear in sitemap", () => {
    it("should include all required paths", async () => {
      // Given the sitemap is generated
      const sitemapModule = await import("@/app/sitemap");
      const sitemap = sitemapModule.default();

      // Then it should include the required paths
      const urls = sitemap.map((entry) => {
        const u = new URL(entry.url);
        return u.pathname;
      });

      const required = ["/", "/about", "/capabilities", "/book", "/contact"];
      if (INSIGHTS_PUBLIC) required.push("/blog");
      for (const path of required) {
        expect(urls).toContain(path);
      }
    });
  });

  describe("Scenario: Insights articles follow the publication state", () => {
    it("each blog post entry should match the Insights publication state", async () => {
      // Given there are published blog posts
      expect(posts.length).toBeGreaterThan(0);

      // When the sitemap is generated
      const sitemapModule = await import("@/app/sitemap");
      const sitemap = sitemapModule.default();
      const urls = sitemap.map((entry) => entry.url);

      // Then the /blog index and each article follow the publication state
      if (INSIGHTS_PUBLIC) {
        expect(urls).toContain("https://aetherisvision.com/blog");
      } else {
        expect(urls).not.toContain("https://aetherisvision.com/blog");
      }
      for (const post of posts) {
        const expected = `https://aetherisvision.com/blog/${post.slug}`;
        if (INSIGHTS_PUBLIC) {
          expect(urls).toContain(expected);
        } else {
          expect(urls).not.toContain(expected);
        }
      }
    });
  });

  describe("Scenario: Robots.txt allows all crawlers", () => {
    it("should allow all user agents on all paths", async () => {
      // Given the robots.txt is generated
      const robotsModule = await import("@/app/robots");
      const robots = robotsModule.default();

      // Then the user agent should be "*"
      const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
      const allRule = rules.find((r) => r.userAgent === "*");
      expect(allRule).toBeDefined();

      // And all paths should be allowed
      expect(allRule!.allow).toBe("/");
    });
  });
});
