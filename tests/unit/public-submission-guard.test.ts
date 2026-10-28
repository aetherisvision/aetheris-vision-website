import { describe, expect, it } from "vitest";
import {
  evaluatePublicSubmissionGuard,
  PublicSubmissionGuardError,
} from "@/lib/public-submission-guard";

function requestFor(userAgent = "Mozilla/5.0 Chrome/127.0.0.0 Safari/537.36") {
  return new Request("https://aetherisvision.com/api/contact", {
    headers: userAgent ? { "User-Agent": userAgent } : undefined,
  });
}

function validSignals(overrides: Record<string, unknown> = {}) {
  return {
    _gotcha: "",
    humanAttestation: true,
    interactionDurationMs: 5_000,
    ...overrides,
  };
}

describe("evaluatePublicSubmissionGuard", () => {
  it("accepts an attested browser submission with plausible interaction time", () => {
    expect(evaluatePublicSubmissionGuard(requestFor(), validSignals())).toEqual({
      automated: false,
    });
  });

  it("traps a filled honeypot before requiring other signals", () => {
    expect(
      evaluatePublicSubmissionGuard(requestFor("ClaudeBot/1.0"), {
        _gotcha: "please contact me",
      }),
    ).toEqual({ automated: true, reason: "honeypot" });
  });

  it("traps an implausibly fast submission", () => {
    expect(
      evaluatePublicSubmissionGuard(
        requestFor(),
        validSignals({ interactionDurationMs: 1_999 }),
      ),
    ).toEqual({ automated: true, reason: "too-fast" });
  });

  it.each([
    "ClaudeBot/1.0",
    "ChatGPT-User/1.0",
    "Googlebot/2.1",
    "HeadlessChrome/127.0.0.0",
    "curl/8.7.1",
    "python-requests/2.32.0",
    "",
  ])("traps the automated or missing user agent %j", (userAgent) => {
    expect(
      evaluatePublicSubmissionGuard(requestFor(userAgent), validSignals()),
    ).toEqual({ automated: true, reason: "automated-user-agent" });
  });

  it.each([
    [
      "Brave on macOS",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    ],
    [
      "Opera on desktop",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0",
    ],
    [
      "Firefox on Linux",
      "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
    ],
    [
      "Open-source Chromium on Linux",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/130.0.6723.58 Safari/537.36",
    ],
  ])("accepts real %s user agent strings", (_browser, userAgent) => {
    expect(
      evaluatePublicSubmissionGuard(requestFor(userAgent), validSignals()),
    ).toEqual({ automated: false });
  });

  it.each([
    ["missing attestation", { humanAttestation: undefined }],
    ["false attestation", { humanAttestation: false }],
    ["fractional duration", { interactionDurationMs: 2_000.5 }],
    ["negative duration", { interactionDurationMs: -1 }],
    ["excessive duration", { interactionDurationMs: 86_400_001 }],
    ["non-text honeypot", { _gotcha: 42 }],
  ])("rejects malformed signals: %s", (_label, overrides) => {
    expect(() =>
      evaluatePublicSubmissionGuard(requestFor(), validSignals(overrides)),
    ).toThrow(PublicSubmissionGuardError);
  });
});
