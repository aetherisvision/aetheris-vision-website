import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  CAPABILITY_STATEMENT_FILENAME,
  loadEncodedCapabilityStatement,
} from "@/lib/capability-statement";
import { SAM, SITE } from "@/lib/constants";
import { escapeHtml } from "@/lib/escape-html";
import { rateLimit } from "@/lib/rate-limit";
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

// The document is emailed to whatever address is typed in, so the abuse case is
// using this endpoint to mail an unsolicited 2.5 MB attachment at someone.
// Both budgets are deliberately tight; a real requester needs one send.
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

function deliveryEmail(): { subject: string; html: string; text: string } {
  const subject = `${SITE.name} — Capability Statement`;
  const text = [
    `The ${SITE.legalName} capability statement is attached.`,
    "",
    `UEI ${SAM.uei}  ·  CAGE ${SAM.cage}  ·  NAICS ${SAM.naicsPrimary}`,
    "",
    "If you have a requirement you would like to discuss, reply to this message",
    "and it will reach the principal directly.",
    "",
    SITE.legalName,
    SITE.url,
  ].join("\n");

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111;">
      <p>The ${escapeHtml(SITE.legalName)} capability statement is attached.</p>
      <p style="color:#444;">
        If you have a requirement you would like to discuss, reply to this message
        and it will reach the principal directly.
      </p>
      <p style="color:#666;font-size:13px;">
        ${escapeHtml(SITE.legalName)}<br />
        <a href="${escapeHtml(SITE.url)}" style="color:#1d4ed8;">${escapeHtml(SITE.url)}</a>
      </p>
    </div>
  `.trim();

  return { subject, html, text };
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
    expectedHostname: new URL(request.url).hostname,
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
    // Either way, refuse rather than run this endpoint unmetered — it mails
    // attachments to arbitrary addresses.
    console.error("Capability statement rate limiting unavailable", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return failure(503, "This form is briefly unavailable. Please try again shortly.");
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("Capability statement request received but RESEND_API_KEY is unset");
    return failure(503, "Delivery is temporarily unavailable. Please try again shortly.");
  }

  let pdf: string;
  try {
    pdf = await loadEncodedCapabilityStatement();
  } catch (error) {
    console.error("Capability statement PDF could not be read", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return failure(503, "Delivery is temporarily unavailable. Please try again shortly.");
  }

  const resend = new Resend(resendKey);
  const message = deliveryEmail();
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [email],
      replyTo: SITE.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: [{ filename: CAPABILITY_STATEMENT_FILENAME, content: pdf }],
    });
    if (result.error) {
      console.error("Capability statement delivery rejected by provider");
      return failure(502, "We could not send to that address. Please check it and try again.");
    }
  } catch (error) {
    console.error("Capability statement delivery failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return failure(502, "We could not send to that address. Please check it and try again.");
  }

  // Notify the principal. A failure here must not affect the requester.
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: [SITE.email],
      replyTo: email,
      subject: "Capability statement requested",
      text: [
        "The capability statement was sent to:",
        `  ${email}`,
        organization ? `  Organization: ${organization}` : "",
        "",
        "Reply to this message to reach the requester.",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch (error) {
    console.error("Capability statement notification failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return accepted();
}
