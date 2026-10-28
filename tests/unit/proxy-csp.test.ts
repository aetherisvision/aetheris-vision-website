import { createHash, createHmac, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";
import { __resetInMemoryRateLimit } from "@/lib/rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
  __resetInMemoryRateLimit();
});

function sessionCookie(passphrase: string): string {
  const key = createHash("sha256").update(`av-admin-session-key|${passphrase}`).digest("hex");
  const sid = randomBytes(16).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const sig = createHmac("sha256", key).update(`${sid}.${exp}`).digest("hex");
  return `av-admin-session=${sid}.${exp}.${sig}`;
}

describe("proxy Content Security Policy", () => {
  it("allows every Cloudflare Turnstile resource type", async () => {
    vi.stubEnv("PREVIEW_PASSWORD", "");

    const response = await proxy(new NextRequest("https://aetherisvision.com/contact"));
    const csp = response.headers.get("Content-Security-Policy");
    const forwardedCsp = response.headers.get(
      "x-middleware-request-content-security-policy",
    );

    expect(csp).toBeTruthy();
    expect(forwardedCsp).toBe(csp);
    expect(csp).toMatch(/script-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    expect(csp).toMatch(/worker-src 'self' blob:/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    expect(csp).toMatch(/frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    expect(response.headers.get("Permissions-Policy")).toContain("browsing-topics=()");
    expect(response.headers.get("Permissions-Policy")).toContain("interest-cohort=()");
    expect(response.headers.get("X-CSP-Nonce")).toBeNull();
  });

  it("forwards x-privacy-opt-out when Brave Sec-GPC or Firefox DNT is set", async () => {
    vi.stubEnv("PREVIEW_PASSWORD", "");

    const gpcResponse = await proxy(
      new NextRequest("https://aetherisvision.com/services", {
        headers: { "sec-gpc": "1" },
      }),
    );
    expect(gpcResponse.headers.get("x-middleware-request-x-privacy-opt-out")).toBe("1");

    const dntResponse = await proxy(
      new NextRequest("https://aetherisvision.com/services", {
        headers: { dnt: "1" },
      }),
    );
    expect(dntResponse.headers.get("x-middleware-request-x-privacy-opt-out")).toBe("1");
  });
});

describe("proxy static asset bypass", () => {
  it.each([
    "/earth-textures/hero-poster-512.webp",
    "/earth-textures/hero-poster.webp",
    "/logo/av-logo-horizontal-dark.png",
    "/images/book/plans-review.webp",
    "/favicon.ico",
    "/_next/image?url=%2Flogo%2Fav-logo.png&w=64&q=75",
  ])("skips the nonce, CSP, and rate limit for %s even while site-locked", async (path) => {
    vi.stubEnv("PREVIEW_PASSWORD", "preview-secret");

    const response = await proxy(new NextRequest(`https://aetherisvision.com${path}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-nonce")).toBeNull();
    expect(response.headers.get("X-Request-ID")).toBeNull();
    expect(response.headers.get("X-Rate-Limit-Remaining")).toBeNull();
  });

  it("still applies the nonce path to pages and crawler meta files", async () => {
    vi.stubEnv("PREVIEW_PASSWORD", "");

    for (const path of ["/about", "/manifest.json", "/robots.txt"]) {
      const response = await proxy(new NextRequest(`https://aetherisvision.com${path}`));
      expect(response.headers.get("Content-Security-Policy")).toMatch(/'nonce-[0-9a-f-]{36}'/);
      expect(response.headers.get("X-Request-ID")).toBeTruthy();
    }
  });
});

describe("proxy Insights publication lock", () => {
  it.each(["/blog", "/blog/graphcast"])("hard-blocks %s", async (path) => {
    const response = await proxy(new NextRequest(`https://aetherisvision.com${path}`));

    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(response.headers.get("Content-Security-Policy")).toMatch(
      /script-src[^;]*'nonce-[0-9a-f-]{36}'/,
    );
    expect(response.headers.get("X-CSP-Nonce")).toBeNull();
    await expect(response.text()).resolves.toBe("Not Found");
  });
});

describe("proxy cron and admin mutation guards", () => {
  const passphrase = "proxy-test-passphrase";

  function apiRequest(
    path: string,
    init?: { method?: string; headers?: Record<string, string>; admin?: boolean },
  ) {
    const headers = new Headers(init?.headers);
    if (!headers.has("x-forwarded-for")) headers.set("x-forwarded-for", "203.0.113.44");
    if (init?.admin) headers.set("cookie", sessionCookie(passphrase));
    return new NextRequest(`https://aetherisvision.com${path}`, {
      method: init?.method ?? "GET",
      headers,
    });
  }

  it("rate limits cron calls and still accepts the bearer secret", async () => {
    vi.stubEnv("PREVIEW_PASSWORD", "preview-secret");
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    vi.stubEnv("ADMIN_PASSPHRASE", passphrase);
    vi.stubEnv("ADMIN_SESSION_SECRET", "");

    const headers = { "x-forwarded-for": "203.0.113.10" };
    for (let attempt = 0; attempt < 100; attempt++) {
      const denied = await proxy(apiRequest("/api/cron/receipts", { headers }));
      expect(denied.status).toBe(401);
    }
    const limited = await proxy(apiRequest("/api/cron/receipts", { headers }));
    expect(limited.status).toBe(429);

    const scheduled = await proxy(
      apiRequest("/api/cron/lead-correspondence", {
        headers: {
          "x-forwarded-for": "203.0.113.10",
          authorization: "Bearer test-cron-secret",
        },
      }),
    );
    expect(scheduled.status).toBe(200);
    expect(scheduled.headers.get("location")).toBeNull();
    expect(scheduled.headers.get("X-Rate-Limit-Remaining")).toBeTruthy();
  });

  it("rejects a signed-in GET and accepts a same-origin admin POST", async () => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    vi.stubEnv("ADMIN_PASSPHRASE", passphrase);
    vi.stubEnv("ADMIN_SESSION_SECRET", "");

    const clicked = await proxy(
      apiRequest("/api/cron/receipts", { admin: true, headers: { "x-forwarded-for": "203.0.113.12" } }),
    );
    expect(clicked.status).toBe(401);

    const manual = await proxy(
      apiRequest("/api/cron/receipts", {
        method: "POST",
        admin: true,
        headers: {
          "x-forwarded-for": "203.0.113.13",
          origin: "https://aetherisvision.com",
          "sec-fetch-site": "same-origin",
        },
      }),
    );
    expect(manual.status).toBe(200);

    const crossSite = await proxy(
      apiRequest("/api/cron/lead-correspondence", {
        method: "POST",
        admin: true,
        headers: {
          "x-forwarded-for": "203.0.113.14",
          origin: "https://evil.example",
          "sec-fetch-site": "cross-site",
        },
      }),
    );
    expect(crossSite.status).toBe(403);
  });

  it("requires the same origin on admin mutations", async () => {
    vi.stubEnv("ADMIN_PASSPHRASE", passphrase);
    vi.stubEnv("ADMIN_SESSION_SECRET", "");

    const missing = await proxy(
      apiRequest("/api/admin/leads", {
        method: "PATCH",
        admin: true,
        headers: { "x-forwarded-for": "203.0.113.15" },
      }),
    );
    expect(missing.status).toBe(403);

    const foreign = await proxy(
      apiRequest("/api/expenses", {
        method: "POST",
        admin: true,
        headers: {
          "x-forwarded-for": "203.0.113.16",
          origin: "https://evil.example",
        },
      }),
    );
    expect(foreign.status).toBe(403);

    const allowed = await proxy(
      apiRequest("/api/admin/auth", {
        method: "POST",
        headers: {
          "x-forwarded-for": "203.0.113.17",
          origin: "https://aetherisvision.com",
          "sec-fetch-site": "same-origin",
        },
      }),
    );
    expect(allowed.status).toBe(200);

    const read = await proxy(
      apiRequest("/api/admin/leads", { headers: { "x-forwarded-for": "203.0.113.18" } }),
    );
    expect(read.status).toBe(401);
  });
});
