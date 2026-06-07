import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Hoisted mocks for the Upstash client so we can drive the distributed path
// without a real Redis.
const { limitMock, fromEnvMock } = vi.hoisted(() => ({
  limitMock: vi.fn(),
  fromEnvMock: vi.fn(() => ({})),
}));

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: fromEnvMock },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static fixedWindow() {
      return {};
    }
    limit(id: string) {
      return limitMock(id);
    }
  },
}));

import {
  rateLimit,
  isRateLimitDistributed,
  __resetInMemoryRateLimit,
} from "@/lib/rate-limit";

const URL_KEY = "UPSTASH_REDIS_REST_URL";
const TOKEN_KEY = "UPSTASH_REDIS_REST_TOKEN";

function clearUpstashEnv() {
  delete process.env[URL_KEY];
  delete process.env[TOKEN_KEY];
}

function setUpstashEnv() {
  process.env[URL_KEY] = "https://example.upstash.io";
  process.env[TOKEN_KEY] = "test-token";
}

beforeEach(() => {
  __resetInMemoryRateLimit();
  limitMock.mockReset();
  clearUpstashEnv();
});

describe("rate-limit — in-memory fallback (no Upstash env)", () => {
  it("reports not-distributed when env vars are absent", () => {
    expect(isRateLimitDistributed()).toBe(false);
  });

  it("allows up to the limit, then blocks with a retry-after", async () => {
    const opts = { limit: 2, windowMs: 60_000, prefix: "test" };

    const r1 = await rateLimit("1.1.1.1", opts);
    const r2 = await rateLimit("1.1.1.1", opts);
    const r3 = await rateLimit("1.1.1.1", opts);

    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(0);
    expect(r3.success).toBe(false);
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);
    // Never touches the distributed backend.
    expect(limitMock).not.toHaveBeenCalled();
  });

  it("tracks identifiers and prefixes independently", async () => {
    const opts = { limit: 1, windowMs: 60_000, prefix: "a" };
    expect((await rateLimit("ip-a", opts)).success).toBe(true);
    expect((await rateLimit("ip-a", opts)).success).toBe(false);
    // Different IP — fresh budget.
    expect((await rateLimit("ip-b", opts)).success).toBe(true);
    // Same IP, different route prefix — fresh budget.
    expect(
      (await rateLimit("ip-a", { limit: 1, windowMs: 60_000, prefix: "b" })).success,
    ).toBe(true);
  });

  it("resets after the window elapses", async () => {
    vi.useFakeTimers();
    try {
      const opts = { limit: 1, windowMs: 1_000, prefix: "win" };
      expect((await rateLimit("ip", opts)).success).toBe(true);
      expect((await rateLimit("ip", opts)).success).toBe(false);
      vi.advanceTimersByTime(1_001);
      expect((await rateLimit("ip", opts)).success).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("rate-limit — distributed (Upstash env present)", () => {
  afterEach(clearUpstashEnv);

  it("reports distributed when env vars are present", () => {
    setUpstashEnv();
    expect(isRateLimitDistributed()).toBe(true);
  });

  it("delegates to the Upstash limiter and maps the result", async () => {
    setUpstashEnv();
    const reset = Date.now() + 30_000;
    limitMock.mockResolvedValue({ success: true, remaining: 7, reset });

    const r = await rateLimit("9.9.9.9", { limit: 10, windowMs: 60_000, prefix: "dist" });

    expect(limitMock).toHaveBeenCalledWith("9.9.9.9");
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(7);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
    expect(r.retryAfterSeconds).toBeLessThanOrEqual(30);
  });

  it("returns blocked when the distributed limiter denies", async () => {
    setUpstashEnv();
    limitMock.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 5_000,
    });

    const r = await rateLimit("9.9.9.9", { limit: 1, windowMs: 60_000, prefix: "dist2" });
    expect(r.success).toBe(false);
  });

  it("forces Retry-After >= 1 on denial even with clock skew (reset in past)", async () => {
    setUpstashEnv();
    limitMock.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() - 5_000, // skew: reset already elapsed locally
    });

    const r = await rateLimit("9.9.9.9", { limit: 1, windowMs: 60_000, prefix: "skew" });
    expect(r.success).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("falls back to in-memory when the distributed backend throws", async () => {
    setUpstashEnv();
    limitMock.mockRejectedValue(new Error("redis down"));

    const opts = { limit: 1, windowMs: 60_000, prefix: "fallback" };
    const r1 = await rateLimit("ip", opts);
    const r2 = await rateLimit("ip", opts);

    // First request allowed by the in-memory fallback, second blocked.
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(false);
  });
});
