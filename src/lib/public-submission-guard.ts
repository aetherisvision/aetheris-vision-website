const MINIMUM_INTERACTION_MS = 2_000;
const MAXIMUM_INTERACTION_MS = 24 * 60 * 60 * 1_000;

const AUTOMATED_USER_AGENT =
  /(?:bot(?:[\/;\s]|$)|crawler|spider|slurp|headlesschrome|phantomjs|selenium|playwright|puppeteer|chatgpt-user|claude-user|cohere-ai|curl\/|wget\/|python-requests|python-urllib|httpie\/|postmanruntime)/i;

export class PublicSubmissionGuardError extends Error {
  constructor() {
    super("Human submission confirmation is required.");
    this.name = "PublicSubmissionGuardError";
  }
}

export type PublicSubmissionGuardResult =
  | { automated: false }
  | {
      automated: true;
      reason: "honeypot" | "too-fast" | "automated-user-agent";
    };

/**
 * Adds low-cost automation signals around Turnstile and email verification.
 * These signals are defense-in-depth, not a substitute for challenge
 * verification or server-side rate limiting.
 */
export function evaluatePublicSubmissionGuard(
  request: Request,
  body: unknown,
): PublicSubmissionGuardResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new PublicSubmissionGuardError();
  }

  const data = body as Record<string, unknown>;
  const honeypot = data._gotcha;
  if (honeypot !== undefined && typeof honeypot !== "string") {
    throw new PublicSubmissionGuardError();
  }
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return { automated: true, reason: "honeypot" };
  }

  if (data.humanAttestation !== true) {
    throw new PublicSubmissionGuardError();
  }

  const interactionDurationMs = data.interactionDurationMs;
  if (
    typeof interactionDurationMs !== "number" ||
    !Number.isSafeInteger(interactionDurationMs) ||
    interactionDurationMs < 0 ||
    interactionDurationMs > MAXIMUM_INTERACTION_MS
  ) {
    throw new PublicSubmissionGuardError();
  }

  if (interactionDurationMs < MINIMUM_INTERACTION_MS) {
    return { automated: true, reason: "too-fast" };
  }

  const userAgent = request.headers.get("user-agent")?.trim();
  if (!userAgent || AUTOMATED_USER_AGENT.test(userAgent)) {
    return { automated: true, reason: "automated-user-agent" };
  }

  return { automated: false };
}
