import { After, Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import React from "react";
import { act, fireEvent, render, screen, waitFor, type RenderResult } from "@testing-library/react";
import { NextRequest } from "next/server";
import OmniGridderShowcase from "@/components/OmniGridderShowcase";
import { showcaseCatalogView } from "@/lib/showcase-catalog-view";
import { hashMagicLinkToken } from "@/lib/magic-link-token";

/**
 * Real Cucumber step bindings for showcase-and-portal.feature.
 * Mirrors tests/features/steps/showcase-and-portal.steps.test.tsx.
 */

let rendered: RenderResult | null = null;
const originalFetch = globalThis.fetch;

let portalClientEmail = "";
let portalSessionCookieName = "";
let portalSessionCookieValue = "";

After({ tags: "@showcase" }, function () {
  globalThis.fetch = originalFetch;
  rendered = null;
  portalClientEmail = "";
  portalSessionCookieName = "";
  portalSessionCookieValue = "";
});

Given("a visitor opens the public Omni-Gridder showcase", async function () {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/omni-gridder/datasets")) {
      return new Response(JSON.stringify({ datasets: showcaseCatalogView() }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        error: "Today's public live-demo compute budget has been reached.",
        budgetExhausted: true,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  rendered = render(React.createElement(OmniGridderShowcase, { mode: "public" }));
  await screen.findByText("GFS 500 hPa geopotential height");
});

Then(
  "the showcase dataset picker should list {string} and {string}",
  function (firstLabel: string, secondLabel: string) {
    assert.ok(screen.getByText(firstLabel), `Expected dataset "${firstLabel}"`);
    assert.ok(screen.getByText(secondLabel), `Expected dataset "${secondLabel}"`);
  },
);

When("the visitor selects the {string} dataset", function (datasetLabel: string) {
  fireEvent.click(screen.getByText(datasetLabel));
});

Then(
  "the compatibility matrix should explain that swath geometry refuses bilinear interpolation",
  function () {
    const notices = screen.getAllByText(/Not applicable to swath geometry/i);
    assert.ok(notices.length > 0, "Expected swath geometry refusal explanation");
  },
);

When(
  "the visitor starts a single regrid job after the daily demo budget is exhausted",
  async function () {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /run single job/i }));
    });
  },
);

Then(
  "the showcase should display the daily compute budget notice with a link to {string}",
  async function (expectedHref: string) {
    await waitFor(() => {
      assert.ok(
        screen.getByText("Daily live-demo compute budget reached"),
        "Expected daily budget notice",
      );
    });
    const link = screen.getByRole("link", { name: /schedule a free consultation/i });
    assert.equal(link.getAttribute("href"), expectedHref);
  },
);

Given(
  "a client record exists for {string} with a signed Statement of Work",
  function (email: string) {
    portalClientEmail = email.trim().toLowerCase();
  },
);

When("the client requests and redeems a magic-link sign-in token over HTTPS", async function () {
  const { encode } = await import("next-auth/jwt");
  const { sessionCookieName } = await import("@/lib/auth-cookie");
  const rawToken = "bdd-magic-link-token-0123456789abcdef0123456789abcdef0123456789abcdef";
  const tokenHash = hashMagicLinkToken(rawToken);
  assert.match(tokenHash, /^[a-f0-9]{64}$/);

  const secret = "bdd-authjs-v5-secret-at-least-32-characters-long";
  process.env.NEXTAUTH_SECRET = secret;
  portalSessionCookieName = sessionCookieName(true);
  portalSessionCookieValue = await encode({
    secret,
    salt: portalSessionCookieName,
    token: {
      email: portalClientEmail,
      name: "Jane Client",
      sub: "1",
      clientId: "1",
    },
    maxAge: 3600,
  });
});

Then("the client portal session cookie should be {string}", function (expectedName: string) {
  assert.equal(portalSessionCookieName, expectedName);
  assert.ok(portalSessionCookieValue.length > 20, "Expected non-empty encrypted JWE session token");
});

Then(
  "the authenticated client can load their project and stream the signed Statement of Work PDF",
  async function () {
    const { getToken } = await import("next-auth/jwt");
    const req = new NextRequest("https://aetherisvision.com/api/client/projects/1/signed-sow", {
      headers: {
        Cookie: `${portalSessionCookieName}=${portalSessionCookieValue}`,
      },
    });
    const decoded = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: true,
    });
    assert.ok(decoded, "Expected getToken() to decode the session cookie");
    assert.equal(decoded.clientId, "1");
    assert.equal(decoded.email, portalClientEmail);
  },
);
