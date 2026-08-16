import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  begin: vi.fn(),
  cancel: vi.fn(),
  capture: vi.fn(),
  complete: vi.fn(),
  rateLimit: vi.fn(),
  send: vi.fn(),
  turnstile: vi.fn(),
  verifyChallenge: vi.fn(),
}));

vi.mock("@/lib/contact-verification", () => ({
  beginEmailVerification: mocks.begin,
  cancelEmailVerification: mocks.cancel,
  completeEmailChallenge: mocks.complete,
  verifyEmailChallenge: mocks.verifyChallenge,
}));

vi.mock("@/lib/crm", () => ({ captureContactLead: mocks.capture }));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimitDistributed: () => true,
  rateLimit: mocks.rateLimit,
}));

vi.mock("@/lib/turnstile", () => ({
  TURNSTILE_ACTIONS: { contact: "contact", intake: "intake", review: "review" },
  verifyTurnstileToken: mocks.turnstile,
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));

const CHALLENGE_ID = "11111111-1111-4111-8111-111111111111";
const VERIFIED_AT = "2026-08-16T15:00:00.000Z";
const SUBMITTED = {
  ok: true,
  stage: "submitted",
  message: "Your inquiry has been received.",
};

let POST: (request: Request) => Promise<Response>;

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "John Carter",
    email: "JOHN@EXAMPLE.COM",
    organization: "Northwind Weather",
    phone: "+1 405 555 0100",
    location: "Oklahoma City, Oklahoma",
    requirement: "Geospatial data curation",
    message: "We need project-ready meteorological data for an operational workflow.",
    submissionId: "contact-test-0001",
    turnstileToken: "turnstile-token",
    humanAttestation: true,
    interactionDurationMs: 5_000,
    ...overrides,
  };
}

function confirmedPayload(overrides: Record<string, unknown> = {}) {
  return validPayload({
    challengeId: CHALLENGE_ID,
    verificationCode: "123456",
    ...overrides,
  });
}

function requestFor(
  body: unknown,
  options: {
    contentType?: string | null;
    headers?: Record<string, string>;
    origin?: string | null;
    raw?: boolean;
  } = {},
): Request {
  const headers = new Headers({
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 Chrome/127.0.0.0 Safari/537.36",
    "x-forwarded-for": "198.51.100.10",
    ...options.headers,
  });
  if (options.contentType !== null) {
    headers.set("Content-Type", options.contentType ?? "application/json");
  }
  if (options.origin !== null) {
    headers.set("Origin", options.origin ?? "http://localhost:3000");
  }
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    body: options.raw ? String(body) : JSON.stringify(body),
    headers,
  });
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("CONTACT_VERIFICATION_SECRET", "test-contact-secret-that-is-at-least-32-bytes");
  vi.stubEnv("RESEND_API_KEY", "re_test_key");

  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.begin.mockResolvedValue({
    challengeId: CHALLENGE_ID,
    code: "123456",
    expiresAt: "2026-08-16T15:10:00.000Z",
  });
  mocks.cancel.mockResolvedValue(undefined);
  mocks.capture.mockResolvedValue({ created: true, leadId: 42 });
  mocks.complete.mockResolvedValue({
    ok: true,
    completedAt: VERIFIED_AT,
    completedNow: true,
  });
  mocks.rateLimit.mockResolvedValue({
    success: true,
    remaining: 4,
    retryAfterSeconds: 0,
  });
  mocks.send.mockResolvedValue({ data: { id: "email_123" }, error: null });
  mocks.turnstile.mockResolvedValue({ ok: true });
  mocks.verifyChallenge.mockResolvedValue({
    ok: true,
    verifiedAt: VERIFIED_AT,
    completed: false,
  });
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  const route = await import("@/app/api/contact/route");
  POST = route.POST as unknown as (request: Request) => Promise<Response>;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("POST /api/contact", () => {
  it("starts email verification without creating CRM or notification side effects", async () => {
    const response = await POST(requestFor(validPayload()));

    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: true,
      stage: "verification",
      challengeId: CHALLENGE_ID,
      message: "Check your email for a six-digit confirmation code.",
    });
    expect(mocks.turnstile).toHaveBeenCalledWith({
      token: "turnstile-token",
      expectedAction: "contact",
      expectedHostname: "localhost",
    });
    expect(mocks.begin).toHaveBeenCalledWith({
      purpose: "contact",
      email: "john@example.com",
      submissionId: "contact-test-0001",
    });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: ["john@example.com"],
        subject: "Confirm your Aetheris Vision inquiry",
      }),
    );
    expect(mocks.send.mock.calls[0][0]).not.toHaveProperty("replyTo");
    expect(mocks.send.mock.calls[0][1]).toEqual({
      idempotencyKey: `contact-verify-${CHALLENGE_ID}`,
    });
    expect(mocks.capture).not.toHaveBeenCalled();
    expect(mocks.verifyChallenge).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("uses opaque rate-limit keys rather than raw IP or email", async () => {
    await POST(requestFor(validPayload()));

    expect(mocks.rateLimit).toHaveBeenCalledTimes(2);
    for (const [key] of mocks.rateLimit.mock.calls) {
      expect(key).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(key).not.toContain("198.51.100.10");
      expect(key).not.toContain("john@example.com");
    }
  });

  it("rejects a failed anti-spam check without side effects", async () => {
    mocks.turnstile.mockResolvedValueOnce({ ok: false, reason: "invalid" });

    const response = await POST(requestFor(validPayload()));

    expect(response.status).toBe(403);
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it.each(["unavailable", "misconfigured", "timeout"])(
    "returns 503 when Turnstile is %s",
    async (reason) => {
      mocks.turnstile.mockResolvedValueOnce({ ok: false, reason });

      const response = await POST(requestFor(validPayload()));

      expect(response.status).toBe(503);
      expect(mocks.begin).not.toHaveBeenCalled();
    },
  );

  it("cancels a challenge when the confirmation email cannot be sent", async () => {
    mocks.send.mockRejectedValueOnce(new Error("provider secret detail"));

    const response = await POST(requestFor(validPayload()));

    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("provider secret detail");
    expect(mocks.cancel).toHaveBeenCalledWith({
      challengeId: CHALLENGE_ID,
      purpose: "contact",
      email: "john@example.com",
      submissionId: "contact-test-0001",
    });
    expect(mocks.capture).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it.each(["invalid", "expired", "attempts"])(
    "rejects a %s confirmation without protected side effects",
    async (reason) => {
      mocks.verifyChallenge.mockResolvedValueOnce({ ok: false, reason });

      const response = await POST(requestFor(confirmedPayload()));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "The confirmation code is invalid or expired.",
      });
      expect(mocks.capture).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
      expect(mocks.complete).not.toHaveBeenCalled();
      expect(mocks.turnstile).not.toHaveBeenCalled();
    },
  );

  it("persists and notifies only after successful email confirmation", async () => {
    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual(SUBMITTED);
    expect(mocks.verifyChallenge).toHaveBeenCalledWith({
      challengeId: CHALLENGE_ID,
      code: "123456",
      purpose: "contact",
      email: "john@example.com",
      submissionId: "contact-test-0001",
    });
    expect(mocks.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        externalRef: "website-contact:contact-test-0001",
        email: "john@example.com",
        coarseLocation: "Oklahoma City, Oklahoma",
        emailVerifiedAt: VERIFIED_AT,
      }),
    );
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        replyTo: "john@example.com",
        subject: "New verified website inquiry",
      }),
    );
    expect(mocks.send.mock.calls[0][1]).toEqual({
      idempotencyKey: "contact-notify-contact-test-0001",
    });
    expect(mocks.complete).toHaveBeenCalledWith({
      challengeId: CHALLENGE_ID,
      purpose: "contact",
      email: "john@example.com",
      submissionId: "contact-test-0001",
    });
    expect(mocks.capture.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.send.mock.invocationCallOrder[0],
    );
  });

  it("does not resend notifications when the idempotent CRM record already exists", async () => {
    mocks.capture.mockResolvedValueOnce({ created: false, leadId: 42 });

    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual(SUBMITTED);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.complete).toHaveBeenCalledOnce();
  });

  it("returns a generic success for an already completed challenge", async () => {
    mocks.verifyChallenge.mockResolvedValueOnce({ ok: false, reason: "used" });

    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual(SUBMITTED);
    expect(mocks.capture).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("returns a generic 503 and does not expose or log CRM details", async () => {
    mocks.capture.mockRejectedValueOnce(new Error("database secret john@example.com"));

    const response = await POST(requestFor(confirmedPayload()));
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).not.toContain("database secret");
    expect(body).not.toContain("john@example.com");
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "john@example.com",
    );
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("completes the challenge when the post-persistence notification throws", async () => {
    mocks.send.mockRejectedValueOnce(new Error("provider timeout"));

    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual(SUBMITTED);
    expect(mocks.complete).toHaveBeenCalledOnce();
  });

  it("does not claim success when challenge completion fails", async () => {
    mocks.complete.mockResolvedValueOnce({ ok: false, reason: "expired" });

    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(503);
  });

  it("returns 429 before anti-spam or persistence work", async () => {
    mocks.rateLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      retryAfterSeconds: 37,
    });

    const response = await POST(requestFor(validPayload()));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("37");
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it("gives honeypot submissions a plausible response and no side effects", async () => {
    const response = await POST(requestFor({ _gotcha: "filled by bot" }));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({ ok: true, stage: "verification" });
    expect(body.challengeId).toMatch(CHALLENGE_ID_PATTERN_FOR_TESTS);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it("rejects a missing human attestation before any protected work", async () => {
    const response = await POST(
      requestFor(validPayload({ humanAttestation: undefined })),
    );

    expect(response.status).toBe(400);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it("rejects an implausibly fast submission before any protected work", async () => {
    const response = await POST(
      requestFor(validPayload({ interactionDurationMs: 250 })),
    );

    expect(response.status).toBe(400);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it("gives known automated agents a plausible response without side effects", async () => {
    const response = await POST(
      requestFor(validPayload(), {
        headers: { "User-Agent": "ClaudeBot/1.0" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({ ok: true, stage: "verification" });
    expect(body.challengeId).toMatch(CHALLENGE_ID_PATTERN_FOR_TESTS);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed JSON", () => requestFor("{bad-json", { raw: true }), 400],
    ["wrong content type", () => requestFor(validPayload(), { contentType: "text/plain" }), 415],
    ["missing origin", () => requestFor(validPayload(), { origin: null }), 403],
    ["cross-site origin", () => requestFor(validPayload(), { origin: "https://attacker.example" }), 403],
    ["unsupported field", () => requestFor(validPayload({ internalRole: "admin" })), 400],
    ["oversized body", () => requestFor(validPayload({ message: "x".repeat(17_000) })), 413],
  ])("rejects %s at the request boundary", async (_label, makeRequest, status) => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(status);
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it.each([
    ["missing submission ID", { submissionId: undefined }],
    ["invalid email", { email: "not-an-email" }],
    ["short message", { message: "too short" }],
    ["non-string name", { name: 42 }],
    ["missing Turnstile token", { turnstileToken: undefined }],
    ["partial confirmation", { challengeId: CHALLENGE_ID }],
    ["invalid challenge ID", { challengeId: "not-a-uuid", verificationCode: "123456" }],
    ["invalid code", { challengeId: CHALLENGE_ID, verificationCode: "12345a" }],
    ["oversized location", { location: "x".repeat(161) }],
  ])("rejects %s", async (_label, overrides) => {
    const response = await POST(requestFor(validPayload(overrides)));

    expect(response.status).toBe(400);
    expect(mocks.capture).not.toHaveBeenCalled();
  });
});

const CHALLENGE_ID_PATTERN_FOR_TESTS =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
