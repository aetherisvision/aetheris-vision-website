import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the route handler's logic by importing and calling POST directly.
// The route delivers submissions through Resend, so we mock the SDK and assert
// against the mocked `emails.send`.

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

let POST: (req: Request) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });

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
  it("returns 503 when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.resetModules();
    const mod = await import("@/app/api/contact/route");
    const localPOST = mod.POST as unknown as (req: Request) => Promise<Response>;

    const req = makeRequest({ name: "Test", email: "test@test.com", message: "Hi there friend" });
    const res = await localPOST(req);
    expect(res.status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions (returns 200) without sending email", async () => {
    const req = makeRequest({
      name: "Bot",
      email: "bot@bot.com",
      message: "spam message here",
      _gotcha: "filled-by-bot",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends valid submissions via Resend", async () => {
    const req = makeRequest({
      name: "John",
      email: "john@agency.gov",
      organization: "Acme Agency",
      requirement: "Federal Contracting",
      message: "Need consulting services for our agency",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    // Replies route back to the submitter
    expect(payload.replyTo).toBe("john@agency.gov");
    // Delivered to the canonical contact inbox
    expect(payload.to).toContain("contact@aetherisvision.com");
    // From the verified Resend domain
    expect(payload.from).toMatch(/@aetherisvision\.com/);
    // Body carries the submission details
    expect(payload.text).toContain("john@agency.gov");
    expect(payload.text).toContain("Acme Agency");
    expect(payload.text).toContain("Federal Contracting");
    expect(payload.text).toContain("Need consulting services for our agency");
  });

  it("returns 502 when Resend reports an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    const req = makeRequest({
      name: "John",
      email: "john@agency.gov",
      message: "Need consulting services for our agency",
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it("rate limits after 5 requests from same IP", async () => {
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    const mod = await import("@/app/api/contact/route");
    const localPOST = mod.POST as unknown as (req: Request) => Promise<Response>;

    const testIp = `rate-limit-test-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      const req = makeRequest({ name: "Test", email: "t@t.com", message: `Message number ${i} with enough length` }, testIp);
      const res = await localPOST(req);
      expect(res.status).toBe(200);
    }

    const req = makeRequest({ name: "Test", email: "t@t.com", message: "This message is long enough now" }, testIp);
    const res = await localPOST(req);
    expect(res.status).toBe(429);
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

  it("returns 400 (not 500) for non-string field values", async () => {
    // Crafted payload with a numeric name — must not throw.
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      body: JSON.stringify({ name: 123, email: "a@b.com", message: "Valid message here" }),
      headers: { "x-forwarded-for": "127.0.0.1", "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
