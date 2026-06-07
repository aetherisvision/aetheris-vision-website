import { Before, After, Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import React from "react";
import { render, fireEvent, screen, waitFor, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatWidget from "@/components/ChatWidget";

/**
 * Real Cucumber step bindings for chat.feature.
 *
 * Renders the ChatWidget in jsdom and stubs global fetch with streaming /
 * rate-limit responses (mirrors tests/features/steps/chat.steps.test.tsx). The
 * widget streams via res.body.getReader(), so the mock Responses are built with
 * Node's Response / ReadableStream (kept out of the jsdom bridge).
 */
const DEFAULT_REPLY = "Our consulting spans meteorology, AI, and federal contracting.";

let rendered: RenderResult | null = null;
let lastTyped = "";
const sentMessages: string[] = [];
let closeOpenStream: (() => void) | null = null;
let scenarioFetchOverride = false;
const originalFetch = globalThis.fetch;

function makeStreamResponse(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = text.split(" ").map((word) => `${word} `);
  let index = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
  return new Response(stream, { status: 200 });
}

function makeOpenStream(): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("Thinking..."));
      closeOpenStream = () => {
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
    },
  });
  return new Response(stream, { status: 200 });
}

function installStreamingFetch(): void {
  globalThis.fetch = (async () => makeStreamResponse(DEFAULT_REPLY)) as typeof fetch;
}

function container(): HTMLElement {
  assert.ok(rendered, "ChatWidget has not been rendered");
  return rendered.container;
}

function toggleButton(): HTMLButtonElement {
  const btn =
    container().querySelector<HTMLButtonElement>('button[aria-label="Open chat"]') ??
    container().querySelector<HTMLButtonElement>('button[aria-label="Close chat"]');
  assert.ok(btn, "Expected the chat toggle button");
  return btn;
}

function input(): HTMLTextAreaElement {
  return screen.getByRole("textbox") as HTMLTextAreaElement;
}

function sendButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /send/i }) as HTMLButtonElement;
}

async function submitAndAwaitReply(message: string): Promise<void> {
  fireEvent.change(input(), { target: { value: message } });
  lastTyped = message;
  sentMessages.push(message);
  fireEvent.click(sendButton());
  await waitFor(() => assert.equal(input().disabled, false));
}

Given("I am on the home page", function () {
  // The home page hosts the ChatWidget; rendering happens in the next step.
});

Before({ tags: "@streaming" }, function () {
  // Keep the stream open so the input/send-disabled state can be observed.
  globalThis.fetch = (async () => makeOpenStream()) as typeof fetch;
  scenarioFetchOverride = true;
});

Given("the chat widget is visible", function () {
  if (!scenarioFetchOverride) installStreamingFetch();
  rendered = render(React.createElement(ChatWidget));
});

Given("the API responds with a 429 rate limit error", function () {
  globalThis.fetch = (async () =>
    new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: { "Retry-After": "60" },
    })) as typeof fetch;
});

When("I click the chat toggle button", function () {
  fireEvent.click(toggleButton());
});

When("I click the chat close button", function () {
  fireEvent.click(toggleButton());
});

When("I type {string} into the chat input", function (text: string) {
  fireEvent.change(input(), { target: { value: text } });
  lastTyped = text;
});

When("I type a message longer than 500 characters into the chat input", async function () {
  const user = userEvent.setup({ delay: null });
  await user.type(input(), "A".repeat(600));
});

When("the chat input is empty", function () {
  assert.equal(input().value, "");
});

When("I submit the message", function () {
  sentMessages.push(lastTyped);
  fireEvent.click(sendButton());
});

When("I send the message {string}", async function (message: string) {
  await submitAndAwaitReply(message);
});

When("I wait for the response", async function () {
  await waitFor(() => assert.equal(input().disabled, false));
});

When("I click the clear chat button", function () {
  const clear = container().querySelector<HTMLButtonElement>('button[aria-label="Clear chat"]');
  assert.ok(clear, "Expected the clear chat button");
  fireEvent.click(clear);
});

Then("the chat panel should be open", function () {
  assert.ok(screen.getByRole("region", { name: /chat/i }), "Chat panel should be open");
});

Then("the chat panel should be closed", function () {
  assert.equal(screen.queryByRole("region", { name: /chat/i }), null, "Chat panel should be closed");
});

Then("my message should appear in the chat history", function () {
  assert.ok(screen.getByText(lastTyped), "Sent message should appear in the chat");
});

Then("I should see a streaming response from the assistant", async function () {
  await waitFor(() => assert.ok(screen.getByText(DEFAULT_REPLY)));
});

Then("the send button should be disabled while the response is loading", function () {
  assert.equal(sendButton().disabled, true, "Send button should be disabled while streaming");
});

Then("the input field should be disabled while the response is loading", function () {
  assert.equal(input().disabled, true, "Input should be disabled while streaming");
});

Then("the input should be truncated to 500 characters", function () {
  assert.equal(input().value.length, 500);
});

Then("the submit button should be enabled", function () {
  assert.equal(sendButton().disabled, false);
});

Then("the send button should be disabled", function () {
  assert.equal(sendButton().disabled, true);
});

Then("an error message should be displayed in the chat", async function () {
  await waitFor(() =>
    assert.ok(screen.getByText(/too many requests|try again/i), "Expected a rate-limit error message"),
  );
});

Then("the chat input should be re-enabled", function () {
  assert.equal(input().disabled, false);
});

Then("both messages should appear in the chat history", function () {
  for (const message of sentMessages) {
    assert.ok(screen.getByText(message), `Expected "${message}" in the chat history`);
  }
});

Then("both responses should appear in the chat history", function () {
  assert.ok(
    screen.getAllByText(DEFAULT_REPLY).length >= 2,
    "Expected a response for each turn",
  );
});

Then("the chat history should be empty", function () {
  for (const message of sentMessages) {
    assert.equal(screen.queryByText(message), null, `"${message}" should have been cleared`);
  }
});

Then("a welcome message should be displayed", function () {
  assert.ok(screen.getByText(/how can i help/i), "Expected the welcome message");
});

After(function () {
  closeOpenStream?.();
  closeOpenStream = null;
  scenarioFetchOverride = false;
  globalThis.fetch = originalFetch;
  rendered = null;
  lastTyped = "";
  sentMessages.length = 0;
});
