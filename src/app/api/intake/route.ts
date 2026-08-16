import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  generateComplianceScoping,
  REGULATED_FRAMEWORKS,
} from "@/lib/compliance-agent";
import {
  beginEmailVerification,
  cancelEmailVerification,
  completeEmailChallenge,
  verifyEmailChallenge,
} from "@/lib/contact-verification";
import { SITE } from "@/lib/constants";
import { createOrLinkIntakeGraph } from "@/lib/crm";
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

const FROM_ADDRESS = `${SITE.name} <system@aetherisvision.com>`;
const PROJECTS_FROM_ADDRESS = `${SITE.name} <projects@aetherisvision.com>`;
const MAX_BODY_BYTES = 128 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const IP_RATE_LIMIT = 12;
const EMAIL_RATE_LIMIT = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBMISSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const CHALLENGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

const STRING_FIELDS = {
  companyName: { required: true, min: 2, max: 200 },
  industry: { required: true, min: 2, max: 150 },
  currentWebsite: { max: 500 },
  location: { required: true, min: 2, max: 200 },
  revenue: { max: 100 },
  contactName: { required: true, min: 2, max: 100 },
  contactTitle: { required: true, min: 2, max: 150 },
  contactEmail: { required: true, min: 3, max: 254 },
  contactPhone: { max: 50 },
  successMetrics: { required: true, min: 5, max: 5000 },
  primaryAudience: { required: true, min: 2, max: 2000 },
  secondaryAudience: { max: 2000 },
  geographicFocus: { max: 1000 },
  portfolioReference: { required: true, min: 1, max: 100 },
  visualStyle: { max: 100 },
  referenceWebsites: { max: 5000 },
  estimatedPages: { max: 100 },
  dataComplexity: { max: 100 },
  trafficExpectations: { max: 100 },
  geographicReach: { max: 500 },
  uptimeRequirements: { max: 100 },
  backupNeeds: { max: 2000 },
  supportRequirements: { max: 2000 },
  platformPreference: { max: 100 },
  timeline: { required: true, min: 1, max: 100 },
  targetDate: { max: 100 },
  budgetRange: { required: true, min: 1, max: 100 },
  maintenancePreference: { max: 100 },
  specialRequirements: { max: 5000 },
  questionsForUs: { max: 5000 },
} as const;

const ARRAY_FIELDS = [
  "objectives",
  "contentPages",
  "interactiveFeatures",
  "ecommerceFeatures",
  "userAccountFeatures",
  "integrations",
  "contentManagement",
  "performancePriorities",
  "securityRequirements",
  "complianceNeeds",
] as const;

const ALLOWED_FIELDS = new Set<string>([
  ...Object.keys(STRING_FIELDS),
  ...ARRAY_FIELDS,
  "submissionId",
  "turnstileToken",
  "challengeId",
  "verificationCode",
  "humanAttestation",
  "interactionDurationMs",
  "_gotcha",
]);

type StringField = keyof typeof STRING_FIELDS;
type ArrayField = (typeof ARRAY_FIELDS)[number];
type IntakeFormData = Record<StringField, string> &
  Record<ArrayField, string[]> & {
    submissionId: string;
  };

type ParsedIntake =
  | { honeypot: true }
  | {
      honeypot: false;
      formData: IntakeFormData;
      turnstileToken: string;
      challengeId: string;
      verificationCode: string;
    };

class ValidationError extends Error {}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function readString(
  data: Record<string, unknown>,
  field: StringField,
  rules: (typeof STRING_FIELDS)[StringField],
): string {
  const value = data[field];
  if (value === undefined || value === null) {
    if ("required" in rules && rules.required) {
      throw new ValidationError(`${field} is required.`);
    }
    return "";
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be text.`);
  }

  const normalized = value.trim();
  if (
    "required" in rules &&
    rules.required &&
    normalized.length < ("min" in rules ? rules.min : 1)
  ) {
    throw new ValidationError(`${field} is required.`);
  }
  if ("min" in rules && normalized && normalized.length < rules.min) {
    throw new ValidationError(`${field} is too short.`);
  }
  if (normalized.length > rules.max) {
    throw new ValidationError(`${field} is too long.`);
  }
  return normalized;
}

function readAuxiliaryString(
  data: Record<string, unknown>,
  field: string,
  options: { required?: boolean; max: number },
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
  if (normalized.length > options.max) {
    throw new ValidationError(`${field} is too long.`);
  }
  return normalized;
}

function readStringArray(
  data: Record<string, unknown>,
  field: ArrayField,
): string[] {
  const value = data[field];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 50) {
    throw new ValidationError(`${field} must be a valid selection.`);
  }

  const normalized = value.map((item) => {
    if (typeof item !== "string") {
      throw new ValidationError(`${field} must contain text selections.`);
    }
    const text = item.trim();
    if (text.length > 200) {
      throw new ValidationError(`${field} contains a selection that is too long.`);
    }
    return text;
  });
  return [...new Set(normalized.filter(Boolean))];
}

function validateBody(parsed: unknown): ParsedIntake {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ValidationError("A valid project submission is required.");
  }

  const data = parsed as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new ValidationError("The submission contains an unsupported field.");
    }
  }

  if (readAuxiliaryString(data, "_gotcha", { max: 500 })) {
    return { honeypot: true };
  }

  const strings = {} as Record<StringField, string>;
  for (const field of Object.keys(STRING_FIELDS) as StringField[]) {
    strings[field] = readString(data, field, STRING_FIELDS[field]);
  }

  const arrays = {} as Record<ArrayField, string[]>;
  for (const field of ARRAY_FIELDS) arrays[field] = readStringArray(data, field);

  strings.contactEmail = strings.contactEmail.toLowerCase();
  if (!EMAIL_PATTERN.test(strings.contactEmail)) {
    throw new ValidationError("A valid email address is required.");
  }
  if (arrays.objectives.length === 0) {
    throw new ValidationError("Select at least one project objective.");
  }

  const submissionId = readAuxiliaryString(data, "submissionId", {
    required: true,
    max: 128,
  });
  if (!SUBMISSION_ID_PATTERN.test(submissionId)) {
    throw new ValidationError("The submission identifier is invalid.");
  }

  const challengeId = readAuxiliaryString(data, "challengeId", { max: 256 });
  const verificationCode = readAuxiliaryString(data, "verificationCode", {
    max: 6,
  });
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
    honeypot: false,
    formData: { ...strings, ...arrays, submissionId },
    turnstileToken: readAuxiliaryString(data, "turnstileToken", { max: 2048 }),
    challengeId,
    verificationCode,
  };
}

function publicSecurityError(error: RequestSecurityError) {
  const messages: Record<RequestSecurityError["code"], string> = {
    "invalid-origin": "This request could not be accepted.",
    "invalid-content-type": "Content-Type must be application/json.",
    "invalid-body": "A valid project submission is required.",
    "body-too-large": "The project submission is too large.",
    "rate-limit-unavailable": "The project inquiry service is temporarily unavailable.",
  };
  return json({ error: messages[error.code] }, { status: error.status });
}

async function enforceRateLimits(request: NextRequest, email: string) {
  assertDistributedRateLimitAvailable();
  const clientIp = getTrustedClientIp(request);
  const limits = await Promise.all([
    rateLimit(createOpaqueRateLimitKey("intake-ip", clientIp), {
      limit: IP_RATE_LIMIT,
      windowMs: WINDOW_MS,
      prefix: "intake-ip",
      requireDistributed: process.env.NODE_ENV === "production",
    }),
    rateLimit(createOpaqueAbuseKey("intake-email", email), {
      limit: EMAIL_RATE_LIMIT,
      windowMs: WINDOW_MS,
      prefix: "intake-email",
      requireDistributed: process.env.NODE_ENV === "production",
    }),
  ]);
  return limits.find((limit) => !limit.success) ?? null;
}

function verificationEmail(code: string) {
  return {
    from: FROM_ADDRESS,
    subject: "Confirm your Aetheris Vision project inquiry",
    text: [
      "Confirm your email address to send your project inquiry to Aetheris Vision.",
      "",
      `Confirmation code: ${code}`,
      "",
      "This code expires shortly. If you did not make this request, you may ignore this email.",
      "Confirming the address does not verify anyone's identity.",
    ].join("\n"),
  };
}

async function beginVerification(formData: IntakeFormData): Promise<string> {
  const challenge = await beginEmailVerification({
    purpose: "intake",
    email: formData.contactEmail,
    submissionId: formData.submissionId,
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    await cancelEmailVerification({
      challengeId: challenge.challengeId,
      purpose: "intake",
      email: formData.contactEmail,
      submissionId: formData.submissionId,
    });
    throw new Error("EmailProviderUnavailable");
  }

  try {
    const result = await new Resend(resendKey).emails.send(
      {
        ...verificationEmail(challenge.code),
        to: [formData.contactEmail],
      },
      { idempotencyKey: `intake-verify-${challenge.challengeId}` },
    );
    if (result.error) throw new Error("EmailProviderRejected");
  } catch (error) {
    try {
      await cancelEmailVerification({
        challengeId: challenge.challengeId,
        purpose: "intake",
        email: formData.contactEmail,
        submissionId: formData.submissionId,
      });
    } catch (cancelError) {
      console.error("Intake verification cancellation failed", {
        error: cancelError instanceof Error ? cancelError.name : "UnknownError",
      });
    }
    throw error;
  }

  return challenge.challengeId;
}

function notificationText(formData: IntakeFormData): string {
  return [
    "New verified project intake",
    "",
    `Company: ${formData.companyName}`,
    `Industry: ${formData.industry}`,
    `Location: ${formData.location}`,
    `Contact: ${formData.contactName}`,
    `Title: ${formData.contactTitle}`,
    `Email: ${formData.contactEmail}`,
    formData.contactPhone ? `Phone: ${formData.contactPhone}` : "Phone: —",
    `Budget range: ${formData.budgetRange}`,
    `Timeline: ${formData.timeline}`,
    `Portfolio reference: ${formData.portfolioReference}`,
    `Objectives: ${formData.objectives.join(", ")}`,
    "",
    "Success measures",
    formData.successMetrics,
    "",
    "Primary audience",
    formData.primaryAudience,
    "",
    "Additional requirements",
    formData.specialRequirements || "—",
    "",
    "Questions",
    formData.questionsForUs || "—",
  ].join("\n");
}

async function sendNotifications(formData: IntakeFormData): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const resend = new Resend(resendKey);
  try {
    const result = await resend.emails.send(
      {
        from: FROM_ADDRESS,
        to: [SITE.email],
        replyTo: formData.contactEmail,
        subject: "New verified project intake",
        text: notificationText(formData),
      },
      { idempotencyKey: `intake-notify-${formData.submissionId}` },
    );
    if (result.error) console.error("Intake notification provider rejected the message");
  } catch (error) {
    console.error("Intake notification delivery failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
  }

  try {
    const result = await resend.emails.send(
      {
        from: PROJECTS_FROM_ADDRESS,
        to: [formData.contactEmail],
        replyTo: SITE.email,
        subject: "Your project details were received",
        text: [
          `Hello ${formData.contactName},`,
          "",
          "Aetheris Vision received your project details and will review them before following up about the appropriate next step.",
          "",
          "Thank you,",
          SITE.name,
        ].join("\n"),
      },
      { idempotencyKey: `intake-confirm-${formData.submissionId}` },
    );
    if (result.error) console.error("Intake confirmation provider rejected the message");
  } catch (error) {
    console.error("Intake confirmation delivery failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
  }
}

async function sendComplianceBrief(formData: IntakeFormData): Promise<void> {
  const triggeredFrameworks = formData.complianceNeeds.filter((framework) =>
    (REGULATED_FRAMEWORKS as readonly string[]).includes(framework),
  );
  const resendKey = process.env.RESEND_API_KEY;
  if (
    triggeredFrameworks.length === 0 ||
    !process.env.ANTHROPIC_API_KEY ||
    !resendKey
  ) {
    return;
  }

  try {
    const scopingBrief = await generateComplianceScoping({
      companyName: formData.companyName,
      industry: formData.industry,
      revenue: formData.revenue,
      location: formData.location,
      primaryAudience: formData.primaryAudience,
      budgetRange: formData.budgetRange,
      specialRequirements: formData.specialRequirements,
      objectives: formData.objectives,
      complianceNeeds: formData.complianceNeeds,
    });
    if (!scopingBrief) return;

    const result = await new Resend(resendKey).emails.send(
      {
        from: FROM_ADDRESS,
        to: [SITE.email],
        subject: "Verified intake requires compliance scoping",
        text: [
          `Client: ${formData.companyName}`,
          `Frameworks: ${triggeredFrameworks.join(", ").toUpperCase()}`,
          "",
          scopingBrief,
        ].join("\n"),
      },
      { idempotencyKey: `intake-compliance-${formData.submissionId}` },
    );
    if (result.error) console.error("Compliance brief provider rejected the message");
  } catch (error) {
    console.error("Compliance scoping failed", {
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
    return json({ error: "A valid project submission is required." }, { status: 400 });
  }

  let submission: ParsedIntake;
  try {
    const guard = evaluatePublicSubmissionGuard(request, parsed);
    if (guard.automated) {
      if (guard.reason === "too-fast") {
        return json(
          { error: "Please take a moment to review your project details before submitting." },
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
    submission = validateBody(parsed);
  } catch (error) {
    if (error instanceof PublicSubmissionGuardError) {
      return json(
        { error: "Confirm that this is a human-submitted project request." },
        { status: 400 },
      );
    }
    if (error instanceof ValidationError) {
      return json({ error: error.message }, { status: 400 });
    }
    return json({ error: "A valid project submission is required." }, { status: 400 });
  }

  if (submission.honeypot) {
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

  const { formData } = submission;
  try {
    const denied = await enforceRateLimits(request, formData.contactEmail);
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
    console.error("Intake request protection failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json(
      { error: "The project inquiry service is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!submission.challengeId) {
    if (!submission.turnstileToken) {
      return json({ error: "Please complete the anti-spam check." }, { status: 400 });
    }

    let turnstile;
    try {
      turnstile = await verifyTurnstileToken({
        token: submission.turnstileToken,
        expectedAction: TURNSTILE_ACTIONS.intake,
        expectedHostname: new URL(request.url).hostname,
      });
    } catch (error) {
      console.error("Intake anti-spam verification failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      return json(
        { error: "The project inquiry service is temporarily unavailable." },
        { status: 503 },
      );
    }

    if (!turnstile.ok) {
      const unavailable =
        turnstile.reason === "unavailable" ||
        turnstile.reason === "misconfigured" ||
        turnstile.reason === "timeout";
      return json(
        {
          error: unavailable
            ? "The project inquiry service is temporarily unavailable."
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
      console.error("Intake verification delivery failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      return json(
        { error: "The project inquiry service is temporarily unavailable." },
        { status: 503 },
      );
    }
  }

  let verification;
  try {
    verification = await verifyEmailChallenge({
      challengeId: submission.challengeId,
      code: submission.verificationCode,
      purpose: "intake",
      email: formData.contactEmail,
      submissionId: formData.submissionId,
    });
  } catch (error) {
    console.error("Intake email confirmation failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json(
      { error: "The project inquiry service is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!verification.ok) {
    if (verification.reason === "used") {
      return json(
        {
          ok: true,
          stage: "submitted",
          message: "Your project inquiry has been received.",
        },
        { status: 202 },
      );
    }
    return json(
      { error: "The confirmation code is invalid or expired." },
      { status: 400 },
    );
  }

  let intake;
  try {
    intake = await createOrLinkIntakeGraph({
      externalRef: `website-intake:${formData.submissionId}`,
      companyName: formData.companyName,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      projectName: `${formData.companyName} — Website project`,
      source: "website_intake",
      industry: formData.industry,
      location: formData.location,
      revenue: formData.revenue || null,
      contactTitle: formData.contactTitle,
      contactPhone: formData.contactPhone || null,
      budgetRange: formData.budgetRange,
      timeline: formData.timeline,
      objectives: formData.objectives,
      specialRequirements: formData.specialRequirements || null,
      questionsForUs: formData.questionsForUs || null,
      platformPreference: formData.platformPreference || null,
      service: "Website project",
      message: formData.objectives.join(", ").slice(0, 5000),
      rawData: formData,
      emailVerifiedAt: verification.verifiedAt,
    });
  } catch (error) {
    console.error("Intake persistence failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json(
      { error: "The project inquiry service is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (intake.created) {
    await sendNotifications(formData);
    await sendComplianceBrief(formData);
  }

  try {
    const completion = await completeEmailChallenge({
      challengeId: submission.challengeId,
      purpose: "intake",
      email: formData.contactEmail,
      submissionId: formData.submissionId,
    });
    if (!completion.ok) {
      console.error("Intake email confirmation could not be completed");
      return json(
        { error: "The project inquiry service is temporarily unavailable." },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Intake email confirmation completion failed", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return json(
      { error: "The project inquiry service is temporarily unavailable." },
      { status: 503 },
    );
  }

  return json(
    {
      ok: true,
      stage: "submitted",
      message: "Your project inquiry has been received.",
    },
    { status: 202 },
  );
}
