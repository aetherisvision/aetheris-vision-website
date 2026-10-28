import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SITE } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { getPublicHostname } from "@/lib/request-origin";
import {
  assertSameOrigin,
  createOpaqueAbuseKey,
  createOpaqueRateLimitKey,
  getTrustedClientIp,
  readJsonBody,
  RequestSecurityError,
} from "@/lib/request-security";
import { TURNSTILE_ACTIONS, verifyTurnstileToken } from "@/lib/turnstile";

const FROM_ADDRESS = `${SITE.name} <system@aetherisvision.com>`;
const MAX_BODY_BYTES = 4 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const ORG_MAX = 200;

// Limit repeated requests and notification spam to the principal.
const WINDOW_MS = 60 * 60 * 1000;
const IP_LIMIT = 5;
const EMAIL_LIMIT = 2;

/** Uniform reply. The caller never learns whether an address was rate limited. */
function accepted() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function failure(status: number, error: string) {
  const response = NextResponse.json({ error }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  let parsed: unknown;
  try {
    assertSameOrigin(request);
    parsed = await readJsonBody(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return failure(error.status, "Request rejected.");
    }
    return failure(400, "Invalid request.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    return failure(400, "Invalid request.");
  }
  const body = parsed as Record<string, unknown>;

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const organization =
    typeof body.organization === "string" ? body.organization.trim().slice(0, ORG_MAX) : "";
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";

  if (!email || email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    return failure(400, "Enter a valid email address.");
  }

  const verification = await verifyTurnstileToken({
    token: turnstileToken,
    expectedAction: TURNSTILE_ACTIONS.capabilityStatement,
    expectedHostname: getPublicHostname(request),
  });
  if (!verification.ok) {
    const status = verification.reason === "misconfigured" ? 503 : 403;
    return failure(status, "Verification failed. Please reload the page and try again.");
  }

  const clientIp = getTrustedClientIp(request);
  try {
    const byIp = await rateLimit(createOpaqueRateLimitKey("capstmt-ip", clientIp), {
      limit: IP_LIMIT,
      windowMs: WINDOW_MS,
      prefix: "capability-statement",
      requireDistributed: process.env.NODE_ENV === "production",
    });
    if (!byIp.success) return accepted();

    const byEmail = await rateLimit(createOpaqueAbuseKey("capstmt-email", email), {
      limit: EMAIL_LIMIT,
      windowMs: WINDOW_MS,
      prefix: "capability-statement",
      requireDistributed: process.env.NODE_ENV === "production",
    });
    if (!byEmail.success) return accepted();
  } catch (error) {
    // Either the shared limiter is unreachable or the key secret is missing.
    // Either way, refuse rather than accept unmetered notification spam.
    console.error("Capability statement rate limiting unavailable", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return failure(503, "This form is briefly unavailable. Please try again shortly.");
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("Capability statement request received but RESEND_API_KEY is unset");
    return failure(503, "Requests are temporarily unavailable. Please try again shortly.");
  }

  // Requests require Marston's review. Never email the requester or attach the
  // statement here; any response is prepared separately as an unsent Gmail draft.
  try {
    const result = await new Resend(resendKey).emails.send({
      from: FROM_ADDRESS,
      to: [SITE.email],
      replyTo: email,
      subject: "Capability statement request — review required",
      text: [
        "A website visitor requested the capability statement.",
        `Email: ${email}`,
        organization ? `Organization: ${organization}` : "",
        "",
        "No capability statement or confirmation email has been sent to the requester.",
        "Review this request before preparing a response. Any response must remain an unsent Gmail draft for Marston to review and send.",
      ].filter(Boolean).join("\n"),
    });
    if (result.error) {
      console.error("Capability statement request notification rejected by provider");
      return failure(502, "We could not submit your request. Please try again shortly.");
    }
  } catch (error) {
    console.error("Capability statement request notification failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return failure(502, "We could not submit your request. Please try again shortly.");
  }

  return accepted();
}
