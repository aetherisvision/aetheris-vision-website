import { After, Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import React from "react";
import { act, render, fireEvent, screen, waitFor, type RenderResult } from "@testing-library/react";
import ContactForm from "@/components/ContactForm";

let form: RenderResult | null = null;
let queuedResponse: Response | null = null;
const originalFetch = globalThis.fetch;

function installFetchResponse(body: unknown, status = 202): void {
  queuedResponse = new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
  globalThis.fetch = (async () => {
    assert.ok(queuedResponse, "Expected a queued contact API response");
    const response = queuedResponse;
    queuedResponse = null;
    return response;
  }) as typeof fetch;
}

function renderForm(): void {
  form = render(React.createElement(ContactForm));
}

function field(id: string): HTMLInputElement | HTMLTextAreaElement {
  assert.ok(form, "ContactForm has not been rendered");
  const element = form.container.querySelector(`#${id}`);
  assert.ok(element, `Expected a #${id} field`);
  return element as HTMLInputElement | HTMLTextAreaElement;
}

function setField(id: string, value: string): void {
  fireEvent.change(field(id), { target: { value } });
}

function confirmHumanSubmission(): void {
  const attestation = screen.queryByRole("checkbox", {
    name: /not an automated agent or bot/i,
  });
  if (attestation && !(attestation as HTMLInputElement).checked) {
    fireEvent.click(attestation);
  }
}

function clickSubmit(name: RegExp = /send inquiry/i): void {
  confirmHumanSubmission();
  fireEvent.click(screen.getByRole("button", { name }));
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

When("the API starts email verification", async function () {
  installFetchResponse({
    ok: true,
    stage: "verification",
    challengeId: "11111111-1111-4111-8111-111111111111",
  });
  await act(async () => {
    clickSubmit();
  });
});

When("they enter confirmation code {string}", async function (code: string) {
  const input = await screen.findByLabelText(/confirmation code/i);
  fireEvent.change(input, { target: { value: code } });
});

When("the API confirms the verified submission", async function () {
  installFetchResponse({ ok: true, stage: "submitted" });
  await act(async () => {
    clickSubmit(/confirm and submit/i);
  });
});

When("the API responds with an unexpected success payload", async function () {
  installFetchResponse({ ok: true }, 200);
  await act(async () => {
    clickSubmit();
  });
});

When("the API responds with a server error", async function () {
  installFetchResponse({ error: "Internal server error" }, 500);
  await act(async () => {
    clickSubmit();
  });
});

Then("they should see {string}", async function (expectedText: string) {
  await waitFor(() => {
    assert.ok(
      form?.container.textContent?.includes(expectedText),
      `Expected to see "${expectedText}"`,
    );
  });
});

Then("they should not see {string}", function (expectedText: string) {
  assert.equal(screen.queryByText(expectedText), null, `Did not expect to see "${expectedText}"`);
});

Then("the name error should disappear", function () {
  assert.equal(screen.queryByText("Name is required."), null, "Name error should have cleared");
});

Then("they should see an error message with contact instructions", async function () {
  await waitFor(() => {
    assert.ok(
      form?.container.textContent?.includes("Something went wrong"),
      "Expected a 'Something went wrong' error message",
    );
  });
  const consultationLink = form?.container.querySelector('a[href="/book"]');
  assert.ok(
    consultationLink?.textContent?.includes("book a consultation"),
    "Expected the error message to offer a consultation",
  );
  assert.equal(form?.container.querySelector('a[href^="mailto:"]'), null);
  assert.equal(form?.container.querySelector('a[href^="tel:"]'), null);
});

After(function () {
  globalThis.fetch = originalFetch;
  queuedResponse = null;
  form = null;
});
