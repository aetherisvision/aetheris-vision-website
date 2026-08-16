import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  begin: vi.fn(),
  cancel: vi.fn(),
  complete: vi.fn(),
  createGraph: vi.fn(),
  generateCompliance: vi.fn(),
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

vi.mock("@/lib/crm", () => ({ createOrLinkIntakeGraph: mocks.createGraph }));

vi.mock("@/lib/compliance-agent", () => ({
  generateComplianceScoping: mocks.generateCompliance,
  REGULATED_FRAMEWORKS: ["hipaa", "cmmc"],
}));

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

const CHALLENGE_ID = "22222222-2222-4222-8222-222222222222";
const VERIFIED_AT = "2026-08-16T15:00:00.000Z";
const SUBMITTED = {
  ok: true,
  stage: "submitted",
  message: "Your project inquiry has been received.",
};

let POST: (request: Request) => Promise<Response>;

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "Northwind Weather",
    industry: "Environmental services",
    currentWebsite: "https://northwind.example",
    location: "Oklahoma City, Oklahoma",
    contactName: "Jane Smith",
    contactTitle: "Program Director",
    contactEmail: "JANE@NORTHWIND.EXAMPLE",
    contactPhone: "+1 405 555 0100",
    successMetrics: "A dependable project-ready delivery",
    primaryAudience: "Operations and research staff",
    portfolioReference: "scientific-consulting",
    timeline: "Within three months",
    budgetRange: "To be discussed",
    objectives: ["Curate geospatial data", "Prepare model output"],
    complianceNeeds: [],
    submissionId: "intake-test-0001",
    turnstileToken: "turnstile-token",
    humanAttestation: true,
    interactionDurationMs: 5_000,
    ...overrides,
  };
}

function confirmedPayload(overrides: Record<string, unknown> = {}) {
  return validPayload({
    challengeId: CHALLENGE_ID,
    verificationCode: "654321",
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
  return new Request("http://localhost:3000/api/intake", {
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
  vi.stubEnv("ANTHROPIC_API_KEY", "");

  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.begin.mockResolvedValue({
    challengeId: CHALLENGE_ID,
    code: "654321",
    expiresAt: "2026-08-16T15:10:00.000Z",
  });
  mocks.cancel.mockResolvedValue(undefined);
  mocks.complete.mockResolvedValue({
    ok: true,
    completedAt: VERIFIED_AT,
    completedNow: true,
  });
  mocks.createGraph.mockResolvedValue({
    leadId: 11,
    clientId: 22,
    projectId: 33,
    intakeId: 44,
    leadStage: "qualified",
    projectStatus: "proposal",
    created: true,
  });
  mocks.generateCompliance.mockResolvedValue(null);
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

  const route = await import("@/app/api/intake/route");
  POST = route.POST as unknown as (request: Request) => Promise<Response>;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("POST /api/intake", () => {
  it("starts email verification with no CRM, notification, or AI work", async () => {
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
      expectedAction: "intake",
      expectedHostname: "localhost",
    });
    expect(mocks.begin).toHaveBeenCalledWith({
      purpose: "intake",
      email: "jane@northwind.example",
      submissionId: "intake-test-0001",
    });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: ["jane@northwind.example"],
        subject: "Confirm your Aetheris Vision project inquiry",
      }),
    );
    expect(mocks.send.mock.calls[0][0]).not.toHaveProperty("replyTo");
    expect(mocks.send.mock.calls[0][1]).toEqual({
      idempotencyKey: `intake-verify-${CHALLENGE_ID}`,
    });
    expect(mocks.createGraph).not.toHaveBeenCalled();
    expect(mocks.generateCompliance).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("rejects failed Turnstile without protected side effects", async () => {
    mocks.turnstile.mockResolvedValueOnce({ ok: false, reason: "invalid" });

    const response = await POST(requestFor(validPayload()));

    expect(response.status).toBe(403);
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.createGraph).not.toHaveBeenCalled();
  });

  it("cancels a challenge when the verification email fails", async () => {
    mocks.send.mockRejectedValueOnce(new Error("provider secret detail"));

    const response = await POST(requestFor(validPayload()));

    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("provider secret detail");
    expect(mocks.cancel).toHaveBeenCalledWith({
      challengeId: CHALLENGE_ID,
      purpose: "intake",
      email: "jane@northwind.example",
      submissionId: "intake-test-0001",
    });
    expect(mocks.createGraph).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it.each(["invalid", "expired", "attempts"])(
    "rejects a %s confirmation without CRM, notification, or AI work",
    async (reason) => {
      mocks.verifyChallenge.mockResolvedValueOnce({ ok: false, reason });

      const response = await POST(requestFor(confirmedPayload()));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "The confirmation code is invalid or expired.",
      });
      expect(mocks.createGraph).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
      expect(mocks.generateCompliance).not.toHaveBeenCalled();
      expect(mocks.complete).not.toHaveBeenCalled();
      expect(mocks.turnstile).not.toHaveBeenCalled();
    },
  );

  it("persists the CRM graph and sends fixed-subject mail only after verification", async () => {
    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual(SUBMITTED);
    expect(mocks.verifyChallenge).toHaveBeenCalledWith({
      challengeId: CHALLENGE_ID,
      code: "654321",
      purpose: "intake",
      email: "jane@northwind.example",
      submissionId: "intake-test-0001",
    });
    expect(mocks.createGraph).toHaveBeenCalledWith(
      expect.objectContaining({
        externalRef: "website-intake:intake-test-0001",
        contactEmail: "jane@northwind.example",
        location: "Oklahoma City, Oklahoma",
        emailVerifiedAt: VERIFIED_AT,
      }),
    );
    expect(mocks.createGraph.mock.calls[0][0]).not.toHaveProperty("coarseLocation");
    const graphInput = mocks.createGraph.mock.calls[0][0];
    expect(graphInput.rawData).toEqual(
      expect.objectContaining({
        contactEmail: "jane@northwind.example",
        submissionId: "intake-test-0001",
        contentPages: [],
        integrations: [],
      }),
    );
    expect(JSON.stringify(graphInput.rawData)).not.toMatch(
      /turnstile|challenge|verificationCode|userAgent|referrer|198\.51\.100/i,
    );
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        replyTo: "jane@northwind.example",
        subject: "New verified project intake",
      }),
    );
    expect(mocks.send.mock.calls[0][1]).toEqual({
      idempotencyKey: "intake-notify-intake-test-0001",
    });
    expect(mocks.send.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        to: ["jane@northwind.example"],
        subject: "Your project details were received",
      }),
    );
    expect(mocks.send.mock.calls[1][1]).toEqual({
      idempotencyKey: "intake-confirm-intake-test-0001",
    });
    expect(mocks.complete).toHaveBeenCalledOnce();
    expect(mocks.createGraph.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.send.mock.invocationCallOrder[0],
    );
  });

  it("does not duplicate mail or AI work when the CRM graph already exists", async () => {
    mocks.createGraph.mockResolvedValueOnce({ created: false });

    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual(SUBMITTED);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.generateCompliance).not.toHaveBeenCalled();
    expect(mocks.complete).toHaveBeenCalledOnce();
  });

  it("returns generic success for an already completed challenge", async () => {
    mocks.verifyChallenge.mockResolvedValueOnce({ ok: false, reason: "used" });

    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual(SUBMITTED);
    expect(mocks.createGraph).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("returns generic 503 when CRM persistence throws and leaks no PII", async () => {
    mocks.createGraph.mockRejectedValueOnce(
      new Error("database secret jane@northwind.example"),
    );

    const response = await POST(requestFor(confirmedPayload()));
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).not.toContain("database secret");
    expect(body).not.toContain("jane@northwind.example");
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "jane@northwind.example",
    );
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.generateCompliance).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("keeps the persisted intake successful if notification delivery throws", async () => {
    mocks.send.mockRejectedValue(new Error("provider timeout"));

    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual(SUBMITTED);
    expect(mocks.complete).toHaveBeenCalledOnce();
  });

  it("runs regulated compliance scoping only after verified persistence", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    mocks.generateCompliance.mockResolvedValueOnce("Review the HIPAA scope.");

    const response = await POST(
      requestFor(confirmedPayload({ complianceNeeds: ["hipaa"] })),
    );

    expect(response.status).toBe(202);
    expect(mocks.generateCompliance).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "Northwind Weather",
        complianceNeeds: ["hipaa"],
      }),
    );
    expect(mocks.send).toHaveBeenCalledTimes(3);
    expect(mocks.send.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        subject: "Verified intake requires compliance scoping",
      }),
    );
    expect(mocks.send.mock.calls[2][1]).toEqual({
      idempotencyKey: "intake-compliance-intake-test-0001",
    });
  });

  it("does not claim success when challenge completion fails", async () => {
    mocks.complete.mockResolvedValueOnce({ ok: false, reason: "expired" });

    const response = await POST(requestFor(confirmedPayload()));

    expect(response.status).toBe(503);
  });

  it("rate limits before Turnstile or persistence", async () => {
    mocks.rateLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      retryAfterSeconds: 37,
    });

    const response = await POST(requestFor(validPayload()));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("37");
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.createGraph).not.toHaveBeenCalled();
  });

  it("uses opaque rate-limit keys", async () => {
    await POST(requestFor(validPayload()));

    expect(mocks.rateLimit).toHaveBeenCalledTimes(2);
    for (const [key] of mocks.rateLimit.mock.calls) {
      expect(key).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(key).not.toContain("198.51.100.10");
      expect(key).not.toContain("jane@northwind.example");
    }
  });

  it("gives honeypot submissions a plausible response without side effects", async () => {
    const response = await POST(requestFor({ _gotcha: "filled by bot" }));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({ ok: true, stage: "verification" });
    expect(body.challengeId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.createGraph).not.toHaveBeenCalled();
  });

  it("rejects a missing human attestation before any protected work", async () => {
    const response = await POST(
      requestFor(validPayload({ humanAttestation: undefined })),
    );

    expect(response.status).toBe(400);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.createGraph).not.toHaveBeenCalled();
  });

  it("rejects an implausibly fast submission before any protected work", async () => {
    const response = await POST(
      requestFor(validPayload({ interactionDurationMs: 250 })),
    );

    expect(response.status).toBe(400);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.createGraph).not.toHaveBeenCalled();
  });

  it("gives known automated agents a plausible response without side effects", async () => {
    const response = await POST(
      requestFor(validPayload(), {
        headers: { "User-Agent": "ChatGPT-User/1.0" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({ ok: true, stage: "verification" });
    expect(body.challengeId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.turnstile).not.toHaveBeenCalled();
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.createGraph).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed JSON", () => requestFor("{bad-json", { raw: true }), 400],
    ["wrong content type", () => requestFor(validPayload(), { contentType: "text/plain" }), 415],
    ["missing origin", () => requestFor(validPayload(), { origin: null }), 403],
    ["cross-site origin", () => requestFor(validPayload(), { origin: "https://attacker.example" }), 403],
    ["unknown field", () => requestFor(validPayload({ internalRole: "admin" })), 400],
    ["oversized body", () => requestFor(validPayload({ specialRequirements: "x".repeat(132_000) })), 413],
  ])("rejects %s at the request boundary", async (_label, makeRequest, status) => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(status);
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.createGraph).not.toHaveBeenCalled();
  });

  it.each([
    ["missing required text", { companyName: undefined }],
    ["invalid email", { contactEmail: "not-an-email" }],
    ["missing objective", { objectives: [] }],
    ["non-text objective", { objectives: [42] }],
    ["oversized selection list", { objectives: Array(51).fill("item") }],
    ["invalid submission ID", { submissionId: "bad id" }],
    ["wrong text type", { timeline: 30 }],
    ["missing Turnstile token", { turnstileToken: undefined }],
    ["partial confirmation", { challengeId: CHALLENGE_ID }],
    ["invalid challenge", { challengeId: "not-a-uuid", verificationCode: "654321" }],
    ["invalid code", { challengeId: CHALLENGE_ID, verificationCode: "12345a" }],
  ])("rejects %s", async (_label, overrides) => {
    const response = await POST(requestFor(validPayload(overrides)));

    expect(response.status).toBe(400);
    expect(mocks.createGraph).not.toHaveBeenCalled();
  });
});
