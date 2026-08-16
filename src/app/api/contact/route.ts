import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  beginEmailVerification,
  cancelEmailVerification,
  completeEmailChallenge,
  verifyEmailChallenge,
} from "@/lib/contact-verification";
import { SITE } from "@/lib/constants";
import { captureContactLead } from "@/lib/crm";
import { rateLimit } from "@/lib/rate-limit";
import {
  assertDistributedRateLimitAvailable,
  assertSameOrigin,
  createOpaqueAbuseKey,
  createOpaqueRateLimitKey,
  getTrustedClientIp,
  readJsonBody,
  RequestSecurityError,
} from "@/lib/request-security";
import {
  evaluatePublicSubmissionGuard,
  PublicSubmissionGuardError,
} from "@/lib/public-submission-guard";
import { TURNSTILE_ACTIONS, verifyTurnstileToken } from "@/lib/turnstile";
import { escapeHtml } from "@/lib/escape-html";

const FROM_ADDRESS = `${SITE.name} <system@aetherisvision.com>`;
const MAX_BODY_BYTES = 16 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const IP_RATE_LIMIT = 12;
const EMAIL_RATE_LIMIT = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBMISSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const CHALLENGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

const ALLOWED_FIELDS = new Set([
  "name",
  "email",
  "organization",
  "phone",
  "location",
  "requirement",
  "message",
  "submissionId",
  "turnstileToken",
  "challengeId",
  "verificationCode",
  "humanAttestation",
  "interactionDurationMs",
  "_gotcha",
]);

interface ContactSubmission {
  name: string;
  email: string;
  organization: string;
  phone: string;
  location: string;
  requirement: string;
  message: string;
  submissionId: string;
  turnstileToken: string;
  challengeId: string;
  verificationCode: string;
  honeypot: string;
}

class ValidationError extends Error {}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function readString(
  data: Record<string, unknown>,
  field: string,
  options: { required?: boolean; min?: number; max: number },
): string {
  const value = data[field];
  if (value === undefined || value === null) {
    if (options.required) throw new ValidationError(`${field} is required.`);
    return "";
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be text.`);
  }

  const normalized = value.trim();
  if (options.required && !normalized) {
    throw new ValidationError(`${field} is required.`);
  }
  if (normalized && options.min && normalized.length < options.min) {
    throw new ValidationError(`${field} is too short.`);
  }
  if (normalized.length > options.max) {
    throw new ValidationError(`${field} is too long.`);
  }
  return normalized;
}

function validateBody(parsed: unknown): ContactSubmission {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ValidationError("A valid message is required.");
  }

  const data = parsed as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new ValidationError("The submission contains an unsupported field.");
    }
  }

  const honeypot = readString(data, "_gotcha", { max: 500 });
  if (honeypot) {
    return {
      name: "",
      email: "",
      organization: "",
      phone: "",
      location: "",
      requirement: "",
      message: "",
      submissionId: "",
      turnstileToken: "",
      challengeId: "",
      verificationCode: "",
      honeypot,
    };
  }

  const email = readString(data, "email", { required: true, max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError("A valid email address is required.");
  }

  const submissionId = readString(data, "submissionId", {
    required: true,
    max: 128,
  });
  if (!SUBMISSION_ID_PATTERN.test(submissionId)) {
    throw new ValidationError("The submission identifier is invalid.");
  }

  const challengeId = readString(data, "challengeId", { max: 256 });
  const verificationCode = readString(data, "verificationCode", { max: 6 });
  if (Boolean(challengeId) !== Boolean(verificationCode)) {
    throw new ValidationError("The email confirmation is incomplete.");
  }
  if (challengeId && !CHALLENGE_ID_PATTERN.test(challengeId)) {
    throw new ValidationError("The email confirmation is invalid.");
  }
  if (verificationCode && !VERIFICATION_CODE_PATTERN.test(verificationCode)) {
    throw new ValidationError("The confirmation code must contain six digits.");
  }

  return {
    name: readString(data, "name", { required: true, min: 2, max: 100 }),
    email,
    organization: readString(data, "organization", { max: 200 }),
    phone: readString(data, "phone", { max: 50 }),
    location: readString(data, "location", { max: 160 }),
    requirement: readString(data, "requirement", { max: 200 }),
    message: readString(data, "message", { required: true, min: 10, max: 5000 }),
    submissionId,
    turnstileToken: readString(data, "turnstileToken", { max: 2048 }),
    challengeId,
    verificationCode,
    honeypot,
  };
}

function publicSecurityError(error: RequestSecurityError) {
  const messages: Record<RequestSecurityError["code"], string> = {
    "invalid-origin": "This request could not be accepted.",
    "invalid-content-type": "Content-Type must be application/json.",
    "invalid-body": "A valid message is required.",
    "body-too-large": "The message is too large.",
    "rate-limit-unavailable": "The contact service is temporarily unavailable.",
  };
  return json({ error: messages[error.code] }, { status: error.status });
}

async function enforceRateLimits(request: NextRequest, email: string) {
  assertDistributedRateLimitAvailable();
  const clientIp = getTrustedClientIp(request);
  const limits = await Promise.all([
    rateLimit(createOpaqueRateLimitKey("contact-ip", clientIp), {
      limit: IP_RATE_LIMIT,
      windowMs: WINDOW_MS,
      prefix: "contact-ip",
      requireDistributed: process.env.NODE_ENV === "production",
    }),
    rateLimit(createOpaqueAbuseKey("contact-email", email), {
      limit: EMAIL_RATE_LIMIT,
      windowMs: WINDOW_MS,
      prefix: "contact-email",
      requireDistributed: process.env.NODE_ENV === "production",
    }),
  ]);
  return limits.find((limit) => !limit.success) ?? null;
}

function verificationEmail(code: string) {
  return {
    from: FROM_ADDRESS,
    subject: "Confirm your Aetheris Vision inquiry",
    text: [
      "Confirm your email address to send your inquiry to Aetheris Vision.",
      "",
      `Confirmation code: ${code}`,
      "",
      "This code expires shortly. If you did not make this request, you may ignore this email.",
      "Confirming the address does not verify anyone's identity.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
        <h2 style="margin:0 0 16px;">Confirm your inquiry</h2>
        <p>Enter this code to confirm your email address and send your inquiry to Aetheris Vision.</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.18em;margin:24px 0;">${escapeHtml(code)}</p>
        <p style="color:#475569;">This code expires shortly. If you did not make this request, you may ignore this email.</p>
        <p style="color:#64748b;font-size:13px;">Confirming the address does not verify anyone's identity.</p>
      </div>
    `,
  };
}

function notificationEmail(formData: ContactSubmission) {
  const text = [
    "New verified website inquiry",
    "",
    `Name: ${formData.name}`,
    `Email: ${formData.email}`,
    formData.organization ? `Organization: ${formData.organization}` : "Organization: —",
    formData.phone ? `Phone: ${formData.phone}` : "Phone: —",
    formData.location ? `Location: ${formData.location}` : "Location: —",
    formData.requirement ? `Topic: ${formData.requirement}` : "Topic: —",
    "",
    "Message:",
    formData.message,
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
      <h2 style="margin:0 0 16px;">New verified website inquiry</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:4px 0;color:#64748b;width:120px;">Name</td><td style="padding:4px 0;">${escapeHtml(formData.name)}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(formData.email)}">${escapeHtml(formData.email)}</a></td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Organization</td><td style="padding:4px 0;">${formData.organization ? escapeHtml(formData.organization) : "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Phone</td><td style="padding:4px 0;">${formData.phone ? escapeHtml(formData.phone) : "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Location</td><td style="padding:4px 0;">${formData.location ? escapeHtml(formData.location) : "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Topic</td><td style="padding:4px 0;">${formData.requirement ? escapeHtml(formData.requirement) : "—"}</td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Message</h3>
      <p style="white-space:pre-wrap;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(formData.message)}</p>
    </div>
  `;
  return { text, html };
}

async function beginVerification(formData: ContactSubmission) {
  const challenge = await beginEmailVerification({
    purpose: "contact",
    email: formData.email,
    submissionId: formData.submissionId,
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    await cancelEmailVerification({
      challengeId: challenge.challengeId,
      purpose: "contact",
      email: formData.email,
      submissionId: formData.submissionId,
    });
    throw new Error("EmailProviderUnavailable");
  }

  try {
    const result = await new Resend(resendKey).emails.send(
      {
        ...verificationEmail(challenge.code),
        to: [formData.email],
      },
      { idempotencyKey: `contact-verify-${challenge.challengeId}` },
    );
    if (result.error) throw new Error("EmailProviderRejected");
  } catch (error) {
    try {
      await cancelEmailVerification({
        challengeId: challenge.challengeId,
        purpose: "contact",
        email: formData.email,
        submissionId: formData.submissionId,
      });
    } catch (cancelError) {
      console.error("Contact verification cancellation failed", {
        error: cancelError instanceof Error ? cancelError.name : "UnknownError",
      });
    }
    throw error;
  }

  return challenge.challengeId;
}

async function sendNotification(formData: ContactSubmission): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  try {
    const result = await new Resend(resendKey).emails.send(
      {
        from: FROM_ADDRESS,
        to: [SITE.email],
        replyTo: formData.email,
        subject: "New verified website inquiry",
        ...notificationEmail(formData),
      },
      { idempotencyKey: `contact-notify-${formData.submissionId}` },
    );
    if (result.error) console.error("Contact notification provider rejected the message");
  } catch (error) {
    console.error("Contact notification delivery failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
  }
}

export async function POST(request: NextRequest) {
  let parsed: unknown;
  try {
    assertSameOrigin(request);
    parsed = await readJsonBody(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestSecurityError) return publicSecurityError(error);
    return json({ error: "A valid message is required." }, { status: 400 });
  }

  let formData: ContactSubmission;
  try {
    const guard = evaluatePublicSubmissionGuard(request, parsed);
    if (guard.automated) {
      if (guard.reason === "too-fast") {
        return json(
          { error: "Please take a moment to review your inquiry before submitting." },
          { status: 400 },
        );
      }
      return json(
        {
          ok: true,
          stage: "verification",
          challengeId: randomUUID(),
          message: "Check your email for a six-digit confirmation code.",
        },
        { status: 202 },
      );
    }
    formData = validateBody(parsed);
  } catch (error) {
    if (error instanceof PublicSubmissionGuardError) {
      return json(
        { error: "Confirm that this is a human-submitted inquiry." },
        { status: 400 },
      );
    }
    if (error instanceof ValidationError) {
      return json({ error: error.message }, { status: 400 });
    }
    return json({ error: "A valid message is required." }, { status: 400 });
  }

  if (formData.honeypot) {
    return json(
      {
        ok: true,
        stage: "verification",
        challengeId: randomUUID(),
        message: "Check your email for a six-digit confirmation code.",
      },
      { status: 202 },
    );
  }

  try {
    const denied = await enforceRateLimits(request, formData.email);
    if (denied) {
      const response = json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 },
      );
      response.headers.set("Retry-After", String(denied.retryAfterSeconds));
      return response;
    }
  } catch (error) {
    if (error instanceof RequestSecurityError) return publicSecurityError(error);
    console.error("Contact request protection failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "The contact service is temporarily unavailable." }, { status: 503 });
  }

  if (!formData.challengeId) {
    if (!formData.turnstileToken) {
      return json({ error: "Please complete the anti-spam check." }, { status: 400 });
    }

    let turnstile;
    try {
      turnstile = await verifyTurnstileToken({
        token: formData.turnstileToken,
        expectedAction: TURNSTILE_ACTIONS.contact,
        expectedHostname: new URL(request.url).hostname,
      });
    } catch (error) {
      console.error("Contact anti-spam verification failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      return json({ error: "The contact service is temporarily unavailable." }, { status: 503 });
    }

    if (!turnstile.ok) {
      const unavailable =
        turnstile.reason === "unavailable" ||
        turnstile.reason === "misconfigured" ||
        turnstile.reason === "timeout";
      return json(
        {
          error: unavailable
            ? "The contact service is temporarily unavailable."
            : "The anti-spam check could not be verified.",
        },
        { status: unavailable ? 503 : 403 },
      );
    }

    try {
      const challengeId = await beginVerification(formData);
      return json(
        {
          ok: true,
          stage: "verification",
          challengeId,
          message: "Check your email for a six-digit confirmation code.",
        },
        { status: 202 },
      );
    } catch (error) {
      console.error("Contact verification delivery failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      return json({ error: "The contact service is temporarily unavailable." }, { status: 503 });
    }
  }

  let verification;
  try {
    verification = await verifyEmailChallenge({
      challengeId: formData.challengeId,
      code: formData.verificationCode,
      purpose: "contact",
      email: formData.email,
      submissionId: formData.submissionId,
    });
  } catch (error) {
    console.error("Contact email confirmation failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "The contact service is temporarily unavailable." }, { status: 503 });
  }

  if (!verification.ok) {
    if (verification.reason === "used") {
      return json(
        { ok: true, stage: "submitted", message: "Your inquiry has been received." },
        { status: 202 },
      );
    }
    return json(
      { error: "The confirmation code is invalid or expired." },
      { status: 400 },
    );
  }

  let captured;
  try {
    captured = await captureContactLead({
      name: formData.name,
      email: formData.email,
      message: formData.message,
      organization: formData.organization || undefined,
      phone: formData.phone || undefined,
      service: formData.requirement || undefined,
      source: "website_contact",
      externalRef: `website-contact:${formData.submissionId}`,
      coarseLocation: formData.location || null,
      emailVerifiedAt: verification.verifiedAt,
    });
  } catch (error) {
    console.error("Contact lead persistence failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "The contact service is temporarily unavailable." }, { status: 503 });
  }

  if (captured.created) await sendNotification(formData);

  try {
    const completion = await completeEmailChallenge({
      challengeId: formData.challengeId,
      purpose: "contact",
      email: formData.email,
      submissionId: formData.submissionId,
    });
    if (!completion.ok) {
      console.error("Contact email confirmation could not be completed");
      return json({ error: "The contact service is temporarily unavailable." }, { status: 503 });
    }
  } catch (error) {
    console.error("Contact email confirmation completion failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "The contact service is temporarily unavailable." }, { status: 503 });
  }

  return json(
    { ok: true, stage: "submitted", message: "Your inquiry has been received." },
    { status: 202 },
  );
}
