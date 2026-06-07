import { After, Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import React from "react";
import { render, fireEvent, screen, waitFor, type RenderResult } from "@testing-library/react";
import AnalyticsDashboardPage from "@/app/portfolio/analytics-dashboard/page";

/**
 * Real Cucumber step bindings for analytics-dashboard.feature.
 *
 * Renders the demo page in jsdom (framer-motion + next/link are stubbed) and
 * asserts its actual, observable behaviour: metric cards, charts, alert
 * resolution, timeframe selection, the refresh loading state, the demo banner /
 * portfolio links, and the technology footer.
 */
let rendered: RenderResult | null = null;

function root(): HTMLElement {
  assert.ok(rendered, "Dashboard page has not been rendered");
  return rendered.container;
}

function metricCard(title: string): HTMLElement {
  const heading = screen.getByText(title);
  const card = heading.closest("div");
  assert.ok(card, `Could not find a card for "${title}"`);
  return card;
}

Given("I am viewing the analytics dashboard demo page", function () {
  rendered = render(React.createElement(AnalyticsDashboardPage));
});

// ── Metric cards ───────────────────────────────────────────────────────────
Then("I should see the {string} metric", function (title: string) {
  assert.ok(screen.getByText(title), `Expected the "${title}" metric`);
});

Then("each metric card should show a percentage change indicator", function () {
  for (const title of ["Active Users", "Revenue Today", "Server Response", "Uptime"]) {
    const card = metricCard(title);
    assert.ok(
      /\d+(\.\d+)?%/.test(card.textContent ?? ""),
      `"${title}" card is missing a percentage change indicator`,
    );
  }
});

// ── Charts & performance ─────────────────────────────────────────────────────
Then("I should see the {string} chart", function (title: string) {
  assert.ok(screen.getByText(title), `Expected the "${title}" chart`);
});

Then("the user activity chart should render an SVG line", function () {
  const card = screen.getByText("User Activity (24h)").closest('[class*="rounded-xl"]');
  assert.ok(card, "Could not find the User Activity chart card");
  const svg = card.querySelector("svg");
  assert.ok(svg, "Expected an SVG inside the User Activity chart");
  assert.ok(svg.querySelector("path"), "Expected a line path in the chart SVG");
});

Then(
  "the system performance section should show {string}, {string}, and {string} with progress bars",
  function (cpu: string, memory: string, network: string) {
    assert.ok(screen.getByText(cpu), `Expected "${cpu}" label`);
    assert.ok(screen.getByText(memory), `Expected "${memory}" label`);
    assert.ok(screen.getByText(network), `Expected "${network}" label`);
    const tracks = root().querySelectorAll("div.h-2");
    assert.ok(tracks.length >= 3, "Expected at least 3 progress-bar tracks");
  },
);

// ── Alerts ───────────────────────────────────────────────────────────────────
Given("the dashboard shows {int} active alerts", function (count: number) {
  assert.ok(screen.getByText(new RegExp(`${count}\\s*Active`)), `Expected ${count} active alerts`);
});

When("I resolve the alert {string}", function (message: string) {
  const item = screen.getByText(message).closest('[class*="justify-between"]');
  assert.ok(item, "Could not find the alert item");
  const button = item.querySelector("button");
  assert.ok(button, "Expected a resolve button on the unresolved alert");
  fireEvent.click(button);
});

Then("that alert should be shown with a strikethrough style", function () {
  const p = screen.getByText("High memory usage on server-3");
  assert.ok(
    p.className.includes("line-through"),
    "Resolved alert should have a strikethrough style",
  );
});

Then("the alert should no longer show a resolve button", function () {
  const item = screen.getByText("High memory usage on server-3").closest('[class*="justify-between"]');
  assert.ok(item, "Could not find the alert item");
  assert.equal(item.querySelector("button"), null, "Resolve button should be gone");
});

Then("the active alert count should decrease to {int}", function (count: number) {
  assert.ok(
    screen.getByText(new RegExp(`${count}\\s*Active`)),
    `Expected the active alert count to be ${count}`,
  );
});

// ── Timeframe ────────────────────────────────────────────────────────────────
Given("the default timeframe is {string}", function (label: string) {
  const select = root().querySelector("select");
  assert.ok(select, "Expected a timeframe dropdown");
  const selected = select.querySelector<HTMLOptionElement>("option:checked");
  assert.equal(selected?.textContent, label);
});

When("I change the timeframe to {string}", function (label: string) {
  const select = root().querySelector("select");
  assert.ok(select, "Expected a timeframe dropdown");
  const option = Array.from(select.options).find((o) => o.textContent === label);
  assert.ok(option, `No timeframe option labelled "${label}"`);
  fireEvent.change(select, { target: { value: option.value } });
});

Then("the timeframe dropdown value should be {string}", function (value: string) {
  const select = root().querySelector("select");
  assert.ok(select, "Expected a timeframe dropdown");
  assert.equal(select.value, value);
});

// ── Refresh ──────────────────────────────────────────────────────────────────
function refreshButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /refresh/i }) as HTMLButtonElement;
}

When("I click the refresh button", function () {
  fireEvent.click(refreshButton());
});

Then("the refresh button should be disabled", function () {
  assert.equal(refreshButton().disabled, true);
});

Then("the refresh icon should show a spinning animation", function () {
  const svg = refreshButton().querySelector("svg");
  assert.ok(svg, "Expected an icon in the refresh button");
  assert.ok(
    (svg.getAttribute("class") ?? "").includes("animate-spin"),
    "Refresh icon should spin while refreshing",
  );
});

When("the refresh completes", async function () {
  await waitFor(() => assert.equal(refreshButton().disabled, false), { timeout: 3000 });
});

Then("the refresh button should be enabled again", function () {
  assert.equal(refreshButton().disabled, false);
});

// ── Demo banner & navigation ─────────────────────────────────────────────────
Then("I should see a {string} banner crediting {string}", function (banner: string, company: string) {
  assert.ok(screen.getByText(new RegExp(banner)), `Expected a "${banner}" banner`);
  assert.ok(screen.getAllByText(company).length >= 1, `Expected the banner to credit "${company}"`);
});

Then("there should be a {string} control linking to the portfolio", function (label: string) {
  const link = screen.getByText(label).closest("a");
  assert.ok(link, `Expected "${label}" to be a link`);
  assert.equal(link.getAttribute("href"), "/portfolio");
});

Then("the company name should link to the portfolio", function () {
  const link = screen.getAllByText("Aetheris Vision")[0].closest("a");
  assert.ok(link, "Expected the company name to be a link");
  assert.equal(link.getAttribute("href"), "/portfolio");
});

// ── Technology footer ────────────────────────────────────────────────────────
Then("the footer should highlight {string}", function (text: string) {
  assert.ok(screen.getByText(text), `Expected the footer to highlight "${text}"`);
});

Then("the footer should list {string}", function (tech: string) {
  assert.ok(screen.getByText(tech), `Expected the footer to list "${tech}"`);
});

// ── Theme & layout ───────────────────────────────────────────────────────────
Then("the dashboard root should use a dark gradient background", function () {
  const el = root().firstElementChild;
  assert.ok(el, "Expected a root element");
  const cls = el.getAttribute("class") ?? "";
  assert.ok(cls.includes("bg-gradient-to-br"), "Expected a gradient background");
  assert.ok(cls.includes("from-slate-950"), "Expected a dark slate gradient");
});

Then("the metric grid should use responsive column classes", function () {
  const grid = root().querySelector('[class*="lg:grid-cols-4"]');
  assert.ok(grid, "Expected a responsive metric grid");
  assert.ok(
    (grid.getAttribute("class") ?? "").includes("sm:grid-cols-2"),
    "Expected the grid to adapt across breakpoints",
  );
});

After(function () {
  rendered = null;
});
