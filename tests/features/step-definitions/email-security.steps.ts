import { Before, After, Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import React from "react";
import { render, fireEvent, type RenderResult } from "@testing-library/react";
import EmailLink from "@/components/EmailLink";
import Footer from "@/components/Footer";
import PrivacyPage from "@/app/privacy/page";

/**
 * Real Cucumber step bindings for email-security.feature.
 *
 * Mirrors tests/features/steps/email-security.steps.test.tsx. The anti-scraping
 * contract: no email address may appear in rendered HTML; the mailto is only
 * assembled at click time. EmailLink writes to window.location.href, so the
 * @email-tagged hooks swap window.location for a plain capture object.
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

Given("the EmailLink component is rendered with default props", function () {
  rendered = render(React.createElement(EmailLink, null, "Email us"));
});

Given("the EmailLink component is rendered with account {string}", function (account: string) {
  rendered = render(
    React.createElement(EmailLink, { account: account as "contact" | "marston" }, "Email"),
  );
});

Given("the EmailLink component is rendered with subject {string}", function (subject: string) {
  rendered = render(React.createElement(EmailLink, { subject }, "Subscribe"));
});

Given("the Footer component is rendered", function () {
  rendered = render(React.createElement(Footer));
});

Given("the privacy page content is rendered", function () {
  rendered = render(React.createElement(PrivacyPage));
});

When("the user clicks the link", function () {
  const anchor = container().querySelector("a");
  assert.ok(anchor, "Expected a rendered anchor element");
  fireEvent.click(anchor);
});

Then("the rendered HTML should not contain {string}", function (needle: string) {
  assert.ok(
    !container().innerHTML.includes(needle),
    `Rendered HTML unexpectedly contained "${needle}"`,
  );
});

Then("the anchor href attribute should be {string}", function (expected: string) {
  const anchor = container().querySelector("a");
  assert.ok(anchor, "Expected a rendered anchor element");
  assert.equal(anchor.getAttribute("href"), expected);
});

Then("window.location.href should equal {string}", function (expected: string) {
  assert.equal(window.location.href, expected);
});
