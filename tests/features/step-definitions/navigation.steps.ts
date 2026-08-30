import { Given, Then, DataTable } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { posts } from "@/lib/posts";
import { INSIGHTS_PUBLIC } from "@/lib/features";

/**
 * Real Cucumber step bindings for navigation.feature.
 *
 * These exercise the same logic as the Vitest mirror suite
 * (tests/features/steps/navigation.steps.test.ts) but run under cucumber-js so
 * the Gherkin scenarios are actually executed against real step definitions.
 *
 * Scenarios are read-only and run serially, so module-level state is safe.
 */

type SitemapEntry = ReturnType<typeof sitemap>[number];
type Robots = ReturnType<typeof robots>;

let generatedSitemap: SitemapEntry[] = [];
let generatedRobots: Robots | null = null;

function robotsRules(r: Robots) {
  return Array.isArray(r.rules) ? r.rules : [r.rules];
}

// Matches both "Given the sitemap is generated" and "When the sitemap is generated".
Given("the sitemap is generated", function () {
  generatedSitemap = sitemap();
});

Then("it should include the following paths:", function (table: DataTable) {
  const paths = generatedSitemap.map((entry) => new URL(entry.url).pathname);
  for (const [path] of table.rows()) {
    assert.ok(paths.includes(path), `Sitemap is missing required path: ${path}`);
  }
});

Given("there are published blog posts", function () {
  assert.ok(posts.length > 0, "Expected at least one published blog post");
});

Then("each blog post entry should match the Insights publication state", function () {
  if (generatedSitemap.length === 0) generatedSitemap = sitemap();
  // sitemap() returns [] while PREVIEW_PASSWORD is set; fail clearly instead of
  // throwing a TypeError on generatedSitemap[0] below.
  assert.ok(
    generatedSitemap.length > 0,
    "Sitemap is empty — is PREVIEW_PASSWORD set in the test environment?",
  );
  const urls = generatedSitemap.map((entry) => entry.url);
  // Derive the origin from the generated sitemap rather than hardcoding it, so
  // the assertion follows SITE.url wherever it points.
  const origin = new URL(generatedSitemap[0].url).origin;
  const state = INSIGHTS_PUBLIC ? "present" : "absent";
  assert.equal(
    urls.includes(`${origin}/blog`),
    INSIGHTS_PUBLIC,
    `Expected the /blog index to be ${state} while INSIGHTS_PUBLIC is ${INSIGHTS_PUBLIC}`,
  );
  for (const post of posts) {
    const expected = `${origin}/blog/${post.slug}`;
    assert.equal(
      urls.includes(expected),
      INSIGHTS_PUBLIC,
      `Expected ${expected} to be ${state} while INSIGHTS_PUBLIC is ${INSIGHTS_PUBLIC}`,
    );
  }
});

Given("the robots.txt is generated", function () {
  generatedRobots = robots();
});

Then("the user agent should be {string}", function (userAgent: string) {
  assert.ok(generatedRobots, "robots.txt was not generated");
  const rule = robotsRules(generatedRobots).find((r) => r.userAgent === userAgent);
  assert.ok(rule, `No robots rule found for user agent: ${userAgent}`);
});

Then("all paths should be allowed", function () {
  assert.ok(generatedRobots, "robots.txt was not generated");
  const rule = robotsRules(generatedRobots).find((r) => r.userAgent === "*");
  assert.ok(rule, "No catch-all robots rule found");
  assert.equal(rule.allow, "/");
});
