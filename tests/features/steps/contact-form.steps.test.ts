import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * BDD step definitions for contact-form.feature
 * These follow Given/When/Then structure matching the Gherkin scenarios.
 */

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
      // Given the contact API is configured with Formspree
      vi.resetModules();
      vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ID", "test123");
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      });
      vi.stubGlobal("fetch", mockFetch);

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
  });

  describe("Scenario: Bot triggers the honeypot", () => {
    let response: Response;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      vi.resetModules();
      vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ID", "test123");
      mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      });
      vi.stubGlobal("fetch", mockFetch);

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

    it("And the submission should not be forwarded to Formspree", () => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: Rate limiting kicks in after too many requests", () => {
    it("Then the 6th response from the same IP should be 429", async () => {
      vi.resetModules();
      vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ID", "test123");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        })
      );

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

      vi.unstubAllGlobals();
    });
  });

  describe("Scenario: Form configuration missing", () => {
    it("Then the response status should be 503", async () => {
      vi.resetModules();
      vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ID", "");

      const mod = await import("@/app/api/contact/route");
      const localPOST = mod.POST as unknown as (req: Request) => Promise<Response>;

      const req = makeFormRequest({
        name: "Test",
        email: "test@test.com",
        message: "Hello",
      });
      const res = await localPOST(req);
      expect(res.status).toBe(503);
    });
  });
});
