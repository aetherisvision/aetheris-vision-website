import { Before, After, Given, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import React from "react";
import { render, type RenderResult } from "@testing-library/react";
import Footer from "@/components/Footer";
import PrivacyPage from "@/app/privacy/page";

/**
 * Real Cucumber step bindings for email-security.feature.
 *
 * Mirrors tests/features/steps/email-security.steps.test.tsx. The anti-scraping
 * contract is now structural: no page renders an email address or a mailto:
 * link — all contact is routed through the /contact form page.
 */
let rendered: RenderResult | null = null;
let savedLocation: Location;

Before({ tags: "@email" }, function () {
  savedLocation = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { href: "" },
  });
});

After({ tags: "@email" }, function () {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: savedLocation,
  });
  rendered = null;
});

function container(): HTMLElement {
  assert.ok(rendered, "No component has been rendered yet");
  return rendered.container;
}

Given("the Footer component is rendered", function () {
  rendered = render(React.createElement(Footer));
});

Given("the privacy page content is rendered", function () {
  rendered = render(React.createElement(PrivacyPage));
});

Then("the rendered HTML should not contain {string}", function (needle: string) {
  assert.ok(
    !container().innerHTML.includes(needle),
    `Rendered HTML unexpectedly contained "${needle}"`,
  );
});

Then("a link to {string} should be present", function (href: string) {
  const anchors = Array.from(container().querySelectorAll("a"));
  assert.ok(
    anchors.some((a) => (a.getAttribute("href") ?? "").startsWith(href)),
    `Expected a link to "${href}" but none was found`,
  );
});
