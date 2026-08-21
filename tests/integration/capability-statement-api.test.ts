import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  turnstile: vi.fn(),
  send: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimitDistributed: () => true,
  rateLimit: mocks.rateLimit,
}));

vi.mock("@/lib/turnstile", () => ({
  TURNSTILE_ACTIONS: {
    contact: "contact",
    intake: "intake",
    review: "review",
    capabilityStatement: "capability-statement",
  },
  verifyTurnstileToken: mocks.turnstile,
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));

vi.mock("node:fs/promises", () => ({
  default: { readFile: mocks.readFile },
  readFile: mocks.readFile,
}));

let POST: (request: NextRequest) => Promise<Response>;

function requestFor(
  body: unknown,
  options: { origin?: string | null; raw?: boolean } = {},
): NextRequest {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 Chrome/127.0.0.0 Safari/537.36",
    "x-forwarded-for": "198.51.100.10",
  });
  if (options.origin !== null) {
    headers.set("Origin", options.origin ?? "http://localhost:3000");
  }
  return new NextRequest("http://localhost:3000/api/capability-statement", {
    method: "POST",
    body: options.raw ? String(body) : JSON.stringify(body),
    headers,
  });
}

const valid = {
  email: "Contracting.Officer@EXAMPLE.COM",
  organization: "Example Agency",
  turnstileToken: "turnstile-token",
};

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  // Opaque rate-limit keys are HMACed with this secret.
  vi.stubEnv("CONTACT_VERIFICATION_SECRET", "test-contact-secret-that-is-at-least-32-bytes");

  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.rateLimit.mockResolvedValue({ success: true, remaining: 4, retryAfterSeconds: 0 });
  mocks.turnstile.mockResolvedValue({ ok: true });
  mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null });
  mocks.readFile.mockResolvedValue(Buffer.from("%PDF-1.7 test"));

  ({ POST } = await import("@/app/api/capability-statement/route"));
});

describe("POST /api/capability-statement", () => {
  it("emails the statement as an attachment to the address supplied", async () => {
    const response = await POST(requestFor(valid));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });

    const delivery = mocks.send.mock.calls[0][0];
    expect(delivery.to).toEqual(["contracting.officer@example.com"]);
    expect(delivery.attachments).toHaveLength(1);
    expect(delivery.attachments[0].filename).toMatch(/\.pdf$/);
    expect(delivery.attachments[0].content).toBe(Buffer.from("%PDF-1.7 test").toString("base64"));
  });

  it("notifies the principal with the requester as reply-to", async () => {
    await POST(requestFor(valid));
    const notification = mocks.send.mock.calls[1][0];
    expect(notification.replyTo).toBe("contracting.officer@example.com");
    expect(notification.text).toContain("Example Agency");
  });

  it("rejects a cross-origin submission", async () => {
    const response = await POST(requestFor(valid, { origin: "https://evil.example" }));
    expect(response.status).toBe(403);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects a malformed address before doing any work", async () => {
    const response = await POST(requestFor({ ...valid, email: "not-an-address" }));
    expect(response.status).toBe(400);
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("refuses when the Turnstile check fails", async () => {
    mocks.turnstile.mockResolvedValue({ ok: false, reason: "invalid" });
    const response = await POST(requestFor(valid));
    expect(response.status).toBe(403);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("does not reveal that an address was rate limited", async () => {
    mocks.rateLimit.mockResolvedValue({ success: false, remaining: 0, retryAfterSeconds: 900 });
    const response = await POST(requestFor(valid));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("fails closed when the shared rate limiter is unreachable", async () => {
    mocks.rateLimit.mockRejectedValue(new Error("redis down"));
    const response = await POST(requestFor(valid));
    expect(response.status).toBe(503);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("does not send when the document cannot be read", async () => {
    mocks.readFile.mockRejectedValue(new Error("ENOENT"));
    const response = await POST(requestFor(valid));
    expect(response.status).toBe(503);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("caps the request body", async () => {
    const response = await POST(requestFor({ ...valid, organization: "x".repeat(20_000) }));
    expect(response.status).toBe(413);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
