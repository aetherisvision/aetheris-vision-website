import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the route handler's logic by importing and calling POST directly.
// Must mock fetch for Formspree calls.

// Reset module state between tests
let POST: (req: Request) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ID", "test123");

  // Mock NextRequest / NextResponse using the actual classes
  const mod = await import("@/app/api/contact/route");
  POST = mod.POST as unknown as (req: Request) => Promise<Response>;
});

function makeRequest(body: Record<string, string>, ip = "127.0.0.1"): Request {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "x-forwarded-for": ip,
      "Content-Type": "application/json",
    },
  });
}

describe("POST /api/contact", () => {
  it("returns 503 when FORMSPREE_ID is not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ID", "");
    vi.resetModules();
    const mod = await import("@/app/api/contact/route");
    const localPOST = mod.POST as unknown as (req: Request) => Promise<Response>;

    const req = makeRequest({ name: "Test", email: "test@test.com", message: "Hi" });
    const res = await localPOST(req);
    expect(res.status).toBe(503);
  });

  it("silently accepts honeypot submissions (returns 200)", async () => {
    const req = makeRequest({
      name: "Bot",
      email: "bot@bot.com",
      message: "spam",
      _gotcha: "filled-by-bot",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("forwards valid submissions to Formspree", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const req = makeRequest({
      name: "John",
      email: "john@agency.gov",
      message: "Need consulting services for our agency",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify Formspree was called
    expect(mockFetch).toHaveBeenCalledWith(
      "https://formspree.io/f/test123",
      expect.objectContaining({ method: "POST" })
    );

    vi.unstubAllGlobals();
  });

  it("rate limits after 5 requests from same IP", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    // Reset modules to get fresh rate limiter
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ID", "test123");
    const mod = await import("@/app/api/contact/route");
    const localPOST = mod.POST as unknown as (req: Request) => Promise<Response>;

    const testIp = `rate-limit-test-${Date.now()}`;

    // Send 5 requests (should all succeed)
    for (let i = 0; i < 5; i++) {
      const req = makeRequest({ name: "Test", email: "t@t.com", message: `Message number ${i} with enough length` }, testIp);
      const res = await localPOST(req);
      expect(res.status).toBe(200);
    }

    // 6th request should be rate limited
    const req = makeRequest({ name: "Test", email: "t@t.com", message: "This message is long enough now" }, testIp);
    const res = await localPOST(req);
    expect(res.status).toBe(429);

    vi.unstubAllGlobals();
  });

  it("rejects empty name", async () => {
    const req = makeRequest({ name: "", email: "a@b.com", message: "Valid message here" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/name/i);
  });

  it("rejects invalid email", async () => {
    const req = makeRequest({ name: "John", email: "not-an-email", message: "Valid message here" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it("rejects too-short message", async () => {
    const req = makeRequest({ name: "John", email: "a@b.com", message: "Hi" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/message/i);
  });
});
