/**
 * BDD Step Definitions: AI Chat Widget
 *
 * Covers: chat.feature
 * Framework: Vitest + @testing-library/react
 *
 * These steps test the ChatWidget component in isolation (unit/integration level).
 * For full end-to-end browser tests, see the Playwright e2e suite.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the fetch API used by ChatWidget to call /api/chat
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper: simulate a successful streaming response
function makeStreamResponse(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.split(" ").map((word) => word + " ");
  let index = 0;

  const stream = new ReadableStream({
    async pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Helper: simulate a 429 rate-limit response
function makeRateLimitResponse() {
  return new Response("Too many requests. Please try again later.", {
    status: 429,
    headers: { "Retry-After": "60" },
  });
}

// ---------------------------------------------------------------------------
// Lazy import so mocks are set up before module loads
// ---------------------------------------------------------------------------
async function getChatWidget() {
  const mod = await import("@/components/ChatWidget");
  return mod.default;
}

// ---------------------------------------------------------------------------
// Feature: AI Chat Widget
// ---------------------------------------------------------------------------

describe("Feature: AI Chat Widget", () => {
  let ChatWidget: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    ChatWidget = await getChatWidget();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Scenario: Opening and closing the chat widget
  // -------------------------------------------------------------------------
  describe("Scenario: Opening and closing the chat widget", () => {
    it("opens the chat panel when the toggle is clicked", async () => {
      // Given: I am on the home page and the chat widget is visible
      render(<ChatWidget />);
      const toggle = screen.getByRole("button", { name: /open chat|chat/i });
      expect(toggle).toBeInTheDocument();

      // When: I click the chat toggle button
      await userEvent.click(toggle);

      // Then: the chat panel should be open
      expect(screen.getByRole("region", { name: /chat/i })).toBeVisible();
    });

    it("closes the chat panel when the close button is clicked", async () => {
      render(<ChatWidget />);
      const toggle = screen.getByRole("button", { name: /open chat|chat/i });

      // When: I open then close
      await userEvent.click(toggle);
      const closeBtn = screen.getByRole("button", { name: /close/i });
      await userEvent.click(closeBtn);

      // Then: the chat panel should be closed
      expect(screen.queryByRole("region", { name: /chat/i })).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Sending a message and receiving a response
  // -------------------------------------------------------------------------
  describe("Scenario: Sending a message and receiving a response", () => {
    it("shows user message and streams assistant response", async () => {
      mockFetch.mockResolvedValueOnce(
        makeStreamResponse("We offer fractional executive and consulting services.")
      );

      render(<ChatWidget />);
      await userEvent.click(screen.getByRole("button", { name: /open chat|chat/i }));

      // When: I type and submit a message
      const input = screen.getByRole("textbox");
      await userEvent.type(input, "What services do you offer?");
      await userEvent.click(screen.getByRole("button", { name: /send/i }));

      // Then: my message should appear
      expect(screen.getByText("What services do you offer?")).toBeInTheDocument();

      // And: I should see a streamed response
      await waitFor(() => {
        expect(screen.getByText(/fractional executive/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Chat input is disabled while a response is streaming
  // -------------------------------------------------------------------------
  describe("Scenario: Chat input is disabled while a response is streaming", () => {
    it("disables input and send button during streaming", async () => {
      // Slow stream that stays open long enough to assert disabled state
      let resolveStream!: () => void;
      const streamPromise = new Promise<void>((res) => (resolveStream = res));

      mockFetch.mockImplementationOnce(async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(encoder.encode("Thinking..."));
            await streamPromise;
            controller.close();
          },
        });
        return new Response(stream, { status: 200 });
      });

      render(<ChatWidget />);
      await userEvent.click(screen.getByRole("button", { name: /open chat|chat/i }));

      const input = screen.getByRole("textbox");
      await userEvent.type(input, "Tell me about your pricing");
      await userEvent.click(screen.getByRole("button", { name: /send/i }));

      // Then: input and send should be disabled while streaming
      expect(input).toBeDisabled();
      expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();

      // Cleanup: resolve the stream
      resolveStream();
      await waitFor(() => expect(input).not.toBeDisabled());
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Message input enforces character limit
  // -------------------------------------------------------------------------
  describe("Scenario: Message input enforces character limit", () => {
    it("truncates input at 500 characters", async () => {
      render(<ChatWidget />);
      await userEvent.click(screen.getByRole("button", { name: /open chat|chat/i }));

      const input = screen.getByRole("textbox") as HTMLInputElement;
      const longMessage = "A".repeat(600);

      await userEvent.type(input, longMessage);

      // Then: value should be capped at 500
      expect(input.value.length).toBeLessThanOrEqual(500);

      // And: send button should be enabled (non-empty message)
      expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Empty messages cannot be submitted
  // -------------------------------------------------------------------------
  describe("Scenario: Empty messages cannot be submitted", () => {
    it("keeps send button disabled when input is empty", async () => {
      render(<ChatWidget />);
      await userEvent.click(screen.getByRole("button", { name: /open chat|chat/i }));

      // Then: send button disabled on empty input
      expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Rate limit error is handled gracefully
  // -------------------------------------------------------------------------
  describe("Scenario: Rate limit error is handled gracefully", () => {
    it("displays an error message on 429 and re-enables the input", async () => {
      mockFetch.mockResolvedValueOnce(makeRateLimitResponse());

      render(<ChatWidget />);
      await userEvent.click(screen.getByRole("button", { name: /open chat|chat/i }));

      const input = screen.getByRole("textbox");
      await userEvent.type(input, "Hello");
      await userEvent.click(screen.getByRole("button", { name: /send/i }));

      // Then: an error message should appear
      await waitFor(() => {
        expect(screen.getByText(/too many requests|rate limit|try again/i)).toBeInTheDocument();
      });

      // And: input should be re-enabled
      expect(input).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Conversation history is maintained across turns
  // -------------------------------------------------------------------------
  describe("Scenario: Conversation history is maintained across turns", () => {
    it("shows all messages and responses from multiple turns", async () => {
      mockFetch
        .mockResolvedValueOnce(
          makeStreamResponse("I have 35 years of meteorological experience including work at SMHI.")
        )
        .mockResolvedValueOnce(
          makeStreamResponse("AI models like GraphCast and Pangu-Weather outperform traditional NWP.")
        );

      render(<ChatWidget />);
      await userEvent.click(screen.getByRole("button", { name: /open chat|chat/i }));

      // Turn 1
      const input = screen.getByRole("textbox");
      await userEvent.type(input, "What is your background in meteorology?");
      await userEvent.click(screen.getByRole("button", { name: /send/i }));
      await waitFor(() => screen.getByText(/SMHI/i));

      // Turn 2
      await userEvent.type(input, "Can you elaborate on the AI weather models?");
      await userEvent.click(screen.getByRole("button", { name: /send/i }));
      await waitFor(() => screen.getByText(/GraphCast/i));

      // Both messages in history
      expect(screen.getByText("What is your background in meteorology?")).toBeInTheDocument();
      expect(screen.getByText("Can you elaborate on the AI weather models?")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Scenario: Chat clears on reset
  // -------------------------------------------------------------------------
  describe("Scenario: Chat clears on reset", () => {
    it("empties the chat history when the clear button is clicked", async () => {
      mockFetch.mockResolvedValueOnce(makeStreamResponse("Hello! How can I help you?"));

      render(<ChatWidget />);
      await userEvent.click(screen.getByRole("button", { name: /open chat|chat/i }));

      const input = screen.getByRole("textbox");
      await userEvent.type(input, "Hello");
      await userEvent.click(screen.getByRole("button", { name: /send/i }));
      await waitFor(() => screen.getByText(/Hello! How can I help/i));

      // When: I click clear
      await userEvent.click(screen.getByRole("button", { name: /clear|reset/i }));

      // Then: history should be gone
      expect(screen.queryByText("Hello")).not.toBeInTheDocument();

      // And: a welcome message should be shown
      expect(
        screen.getByText(/how can I help|welcome|ask me/i)
      ).toBeInTheDocument();
    });
  });
});
