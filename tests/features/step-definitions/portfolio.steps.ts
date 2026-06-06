import { Given, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { tiers, maintenancePlans, includedFeatures } from "@/lib/portfolio-data";

/**
 * Real Cucumber step bindings for portfolio.feature.
 *
 * Mirrors the Vitest suite (tests/features/steps/portfolio.steps.test.ts) but
 * runs under cucumber-js. The portfolio data is statically imported, so
 * "the portfolio data is loaded" is a no-op precondition.
 */

Given("the portfolio data is loaded", function () {
  // Data is imported statically; nothing to set up.
});

Then("there should be exactly 3 pricing tiers", function () {
  assert.equal(tiers.length, 3);
});

Then("one tier should be highlighted as recommended", function () {
  assert.equal(tiers.filter((t) => t.highlight).length, 1);
});

Then("each tier should have a price", function () {
  for (const tier of tiers) {
    assert.ok(tier.price, `Tier "${tier.name}" is missing a price`);
  }
});

Then("each tier should list at least 3 features", function () {
  for (const tier of tiers) {
    assert.ok(
      tier.deliverables.length >= 3,
      `Tier "${tier.name}" has fewer than 3 deliverables`,
    );
  }
});

Then("there should be at least 2 maintenance plans", function () {
  assert.ok(maintenancePlans.length >= 2);
});

Then("one maintenance plan should be highlighted", function () {
  assert.equal(maintenancePlans.filter((p) => p.highlight).length, 1);
});

Then("there should be at least 5 included features", function () {
  assert.ok(includedFeatures.length >= 5);
});
