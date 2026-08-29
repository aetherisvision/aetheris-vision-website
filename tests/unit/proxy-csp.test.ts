import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

afterEach(() => {
  vi.unstubAllEnvs();
});

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
    expect(csp).toMatch(/connect-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    expect(csp).toMatch(/frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
  });
});

describe("proxy Insights publication lock", () => {
  it.each(["/blog", "/blog/graphcast"])("hard-blocks %s", async (path) => {
    const response = await proxy(new NextRequest(`https://aetherisvision.com${path}`));

    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    await expect(response.text()).resolves.toBe("Not Found");
  });
});
