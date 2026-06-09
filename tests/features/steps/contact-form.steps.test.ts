import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * BDD step definitions for contact-form.feature
 * These follow Given/When/Then structure matching the Gherkin scenarios.
 */

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

let POST: (req: Request) => Promise<Response>;

function makeFormRequest(
  fields: Record<string, string>,
  ip = "127.0.0.1"
): Request {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    body: JSON.stringify(fields),
    headers: { "x-forwarded-for": ip, "Content-Type": "application/json" },
  });
}

describe("Feature: Contact Form", () => {
  describe("Scenario: Visitor submits a valid contact request", () => {
    let response: Response;

    beforeEach(async () => {
      // Given the contact API is configured with Resend
      vi.resetModules();
      vi.stubEnv("RESEND_API_KEY", "re_test_key");
      sendMock.mockReset();
      sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });

      const mod = await import("@/app/api/contact/route");
      POST = mod.POST as unknown as (req: Request) => Promise<Response>;

      // When a visitor submits the form
      const req = makeFormRequest({
        name: "Jane Doe",
        email: "jane@agency.gov",
        message: "Need AI consulting",
      });
      response = await POST(req);
    });

    it("Then the response status should be 200", () => {
      expect(response.status).toBe(200);
    });

    it("And the submission should be emailed via Resend", () => {
      expect(sendMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Scenario: Bot triggers the honeypot", () => {
    let response: Response;

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv("RESEND_API_KEY", "re_test_key");
      sendMock.mockReset();
      sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });

      const mod = await import("@/app/api/contact/route");
      POST = mod.POST as unknown as (req: Request) => Promise<Response>;

      // When a bot submits the form with the honeypot field filled
      const req = makeFormRequest({
        name: "Bot",
        email: "bot@spam.com",
        message: "Buy now!!!",
        _gotcha: "i-am-a-bot",
      });
      response = await POST(req);
    });

    it("Then the response status should be 200", () => {
      expect(response.status).toBe(200);
    });

    it("And the submission should not be emailed via Resend", () => {
      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: Rate limiting kicks in after too many requests", () => {
    it("Then the 6th response from the same IP should be 429", async () => {
      vi.resetModules();
      vi.stubEnv("RESEND_API_KEY", "re_test_key");
      sendMock.mockReset();
      sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });

      const mod = await import("@/app/api/contact/route");
      const localPOST = mod.POST as unknown as (req: Request) => Promise<Response>;
      const ip = `bdd-rate-${Date.now()}`;

      for (let i = 0; i < 5; i++) {
        await localPOST(makeFormRequest({ name: "T", email: "t@t.com", message: `m${i}` }, ip));
      }

      const res = await localPOST(
        makeFormRequest({ name: "T", email: "t@t.com", message: "too many" }, ip)
      );
      expect(res.status).toBe(429);
    });
  });

  describe("Scenario: Form configuration missing", () => {
    it("Then the response status should be 503", async () => {
      vi.resetModules();
      vi.stubEnv("RESEND_API_KEY", "");

      const mod = await import("@/app/api/contact/route");
      const localPOST = mod.POST as unknown as (req: Request) => Promise<Response>;

      const req = makeFormRequest({
        name: "Test",
        email: "test@test.com",
        message: "Hello there",
      });
      const res = await localPOST(req);
      expect(res.status).toBe(503);
    });
  });
});
