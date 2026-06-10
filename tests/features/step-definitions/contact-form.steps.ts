import { After, Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import React from "react";
import { render, fireEvent, screen, waitFor, type RenderResult } from "@testing-library/react";
import ContactForm from "@/components/ContactForm";

/**
 * Real Cucumber step bindings for contact-form.feature.
 *
 * API-layer scenarios drive the /api/contact route handler directly (mirrors
 * tests/features/steps/contact-form.steps.test.ts). UI-layer scenarios render
 * <ContactForm /> and assert the inline validation / submission states that the
 * Vitest mirror never exercised.
 */

// ── API layer ────────────────────────────────────────────────────────────────
type RouteHandler = (req: Request) => Promise<Response>;
let POST: RouteHandler | null = null;
let apiResponse: Response;
let fetchCallCount = 0;

const originalFetch = globalThis.fetch;
const originalResendKey = process.env.RESEND_API_KEY;

// The route delivers via the Resend SDK, which calls the global `fetch`. We
// stub fetch to mimic a successful Resend API response (the SDK reads
// `response.headers.entries()` on the ok path, so headers must be present).
function installMockFetch(): void {
  fetchCallCount = 0;
  globalThis.fetch = (async () => {
    fetchCallCount += 1;
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ id: "email_test" }),
    } as unknown as Response;
  }) as typeof fetch;
}

async function loadRoute(): Promise<void> {
  const mod = await import("@/app/api/contact/route");
  POST = mod.POST as unknown as RouteHandler;
}

function makeFormRequest(fields: Record<string, string>, ip: string): Request {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    body: JSON.stringify(fields),
    headers: { "x-forwarded-for": ip, "Content-Type": "application/json" },
  });
}

function uniqueIp(): string {
  return `bdd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

Given("the contact API is configured with Resend", async function () {
  process.env.RESEND_API_KEY = "re_test_key";
  installMockFetch();
  await loadRoute();
});

Given("Resend is not configured", async function () {
  process.env.RESEND_API_KEY = "";
  installMockFetch();
  await loadRoute();
});

When(
  "a visitor submits the form with name {string} email {string} and message {string}",
  async function (name: string, email: string, message: string) {
    assert.ok(POST, "Route handler not loaded");
    apiResponse = await POST(makeFormRequest({ name, email, message }, uniqueIp()));
  },
);

When("a bot submits the form with the honeypot field filled", async function () {
  assert.ok(POST, "Route handler not loaded");
  apiResponse = await POST(
    makeFormRequest(
      { name: "Bot", email: "bot@spam.com", message: "Buy now!!!", _gotcha: "i-am-a-bot" },
      uniqueIp(),
    ),
  );
});

When("{int} submissions come from the same IP address", async function (count: number) {
  assert.ok(POST, "Route handler not loaded");
  const ip = uniqueIp();
  for (let i = 0; i < count; i++) {
    apiResponse = await POST(
      makeFormRequest({ name: "Tester", email: "t@example.com", message: `message ${i}` }, ip),
    );
  }
});

Then("the submission should be emailed via Resend", function () {
  assert.ok(fetchCallCount > 0, "Expected the submission to be emailed via Resend");
});

Then("the submission should not be emailed via Resend", function () {
  assert.equal(fetchCallCount, 0, "Submission should not have been emailed via Resend");
});

Then("the response status should be {int}", function (status: number) {
  assert.equal(apiResponse.status, status);
});

Then("the 6th response status should be {int}", function (status: number) {
  assert.equal(apiResponse.status, status);
});

// ── UI layer ─────────────────────────────────────────────────────────────────
let form: RenderResult | null = null;

function renderForm(): void {
  form = render(React.createElement(ContactForm));
}

function field(id: string): HTMLInputElement | HTMLTextAreaElement {
  assert.ok(form, "ContactForm has not been rendered");
  const el = form.container.querySelector(`#${id}`);
  assert.ok(el, `Expected a #${id} field`);
  return el as HTMLInputElement | HTMLTextAreaElement;
}

function setField(id: string, value: string): void {
  fireEvent.change(field(id), { target: { value } });
}

function clickSubmit(): void {
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
}

Given("a visitor is on the contact page", function () {
  renderForm();
});

Given("a visitor has triggered the name validation error", function () {
  renderForm();
  fireEvent.blur(field("name"));
});

Given("a visitor fills in name and message correctly", function () {
  renderForm();
  setField("name", "Jane Doe");
  setField("message", "I would like to discuss a custom website build.");
});

Given("a visitor fills in name and email correctly", function () {
  renderForm();
  setField("name", "Jane Doe");
  setField("email", "jane@example.com");
});

Given("a visitor fills in all required fields correctly", function () {
  renderForm();
  setField("name", "Jane Doe");
  setField("email", "jane@example.com");
  setField("message", "I would like to discuss a custom website build.");
});

When("they click submit without filling in any fields", function () {
  clickSubmit();
});

When("they type a valid name", function () {
  setField("name", "Jane Doe");
});

When("they enter an invalid email address", function () {
  setField("email", "not-an-email");
});

When("they enter a message shorter than 10 characters", function () {
  setField("message", "short");
});

When("they click submit", function () {
  clickSubmit();
});

When("the API responds with success", function () {
  globalThis.fetch = (async () =>
    ({ ok: true, status: 200, json: async () => ({ ok: true }) }) as unknown as Response) as typeof fetch;
  clickSubmit();
});

When("the API responds with a server error", function () {
  globalThis.fetch = (async () =>
    ({ ok: false, status: 500, json: async () => ({}) }) as unknown as Response) as typeof fetch;
  clickSubmit();
});

Then("they should see {string}", async function (text: string) {
  await waitFor(() => {
    assert.ok(screen.getByText(text), `Expected to see "${text}"`);
  });
});

Then("the name error should disappear", function () {
  assert.equal(
    screen.queryByText("Name is required."),
    null,
    "Name error should have cleared",
  );
});

Then("they should see an error message with contact instructions", async function () {
  await waitFor(() => {
    assert.ok(
      form?.container.textContent?.includes("Something went wrong"),
      "Expected a 'Something went wrong' error message",
    );
  });
  assert.ok(
    form?.container.textContent?.includes("call/text"),
    "Expected the error message to include a phone contact instruction",
  );
});

After(function () {
  globalThis.fetch = originalFetch;
  if (originalResendKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalResendKey;
  }
  form = null;
});
