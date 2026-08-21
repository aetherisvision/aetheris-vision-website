"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import EmailVerificationStep from "@/components/EmailVerificationStep";
import FadeIn from "@/components/FadeIn";
import TurnstileWidget from "@/components/TurnstileWidget";
import { createSubmissionId } from "@/lib/client-submission-id";

const requirementTypes = [
  "Weather & Earth-System Consulting",
  "Geospatial Data & Analysis",
  "Applied AI & Technical Delivery",
  "Scientific Software & Data Pipelines",
  "Web & Digital Systems",
  "Ongoing Advisory or Support",
  "Capability Statement Request",
  "Other",
];

const NAME_MAX = 100;
const ORG_MAX = 200;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

interface Fields {
  name: string;
  email: string;
  organization: string;
  requirement: string;
  message: string;
  _gotcha: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  organization?: string;
  message?: string;
}

const EMPTY: Fields = {
  name: "", email: "", organization: "", requirement: "", message: "", _gotcha: "",
};

/** Validate a single field. Returns an error string or undefined. */
function validateField(key: keyof FieldErrors, value: string): string | undefined {
  switch (key) {
    case "name": {
      const v = value.trim();
      if (!v) return "Name is required.";
      if (v.length < 2) return "Name must be at least 2 characters.";
      if (v.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
      if (!/^[\p{L}\p{M}'\-\s.]+$/u.test(v)) return "Name contains invalid characters.";
      return undefined;
    }
    case "email": {
      const v = value.trim();
      if (!v) return "Email address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address.";
      if (v.length > 254) return "Email address is too long.";
      return undefined;
    }
    case "organization": {
      const v = value.trim();
      if (v.length > ORG_MAX) return `Organization name must be ${ORG_MAX} characters or fewer.`;
      return undefined;
    }
    case "message": {
      const v = value.trim();
      if (!v) return "Message is required.";
      if (v.length < MESSAGE_MIN) return `Message must be at least ${MESSAGE_MIN} characters.`;
      if (v.length > MESSAGE_MAX) return `Message must be ${MESSAGE_MAX.toLocaleString()} characters or fewer.`;
      return undefined;
    }
  }
}

function validateAll(fields: Fields): FieldErrors {
  const errs: FieldErrors = {};
  for (const key of ["name", "email", "organization", "message"] as const) {
    const err = validateField(key, fields[key]);
    if (err) errs[key] = err;
  }
  return errs;
}

export default function ContactForm() {
  // The form posts to /api/contact, which delivers the message by email via
  // Resend. Whether delivery is configured depends on the server-only
  // RESEND_API_KEY, so the client cannot know up front; if the API returns 503
  // we surface a clear "unavailable" notice with a scheduling alternative.

  // Optional prefill from query params so focused calls to action can open a
  // ready-to-send request while still letting the visitor add context.
  const searchParams = useSearchParams();
  const prefillTopic =
    searchParams.get("topic")?.trim() || searchParams.get("subject")?.trim() || "";
  const requestedRequirement = searchParams.get("requirement")?.trim() || "";
  const prefillRequirement = requirementTypes.includes(requestedRequirement)
    ? requestedRequirement
    : "";

  const [fields, setFields] = useState<Fields>(() =>
    prefillTopic || prefillRequirement
      ? { ...EMPTY, requirement: prefillRequirement, message: prefillTopic }
      : EMPTY,
  );
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "unavailable">("idle");
  const [step, setStep] = useState<"details" | "verification">("details");
  const [errorDetail, setErrorDetail] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [challengeId, setChallengeId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [humanAttestation, setHumanAttestation] = useState(false);
  const submissionIdRef = useRef<string | null>(null);
  const formStartedAtRef = useRef(Date.now());
  const requiresTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function submissionPayload() {
    return {
      name: fields.name.trim(),
      email: fields.email.trim(),
      organization: fields.organization.trim(),
      requirement: fields.requirement,
      message: fields.message.trim(),
      submissionId: submissionIdRef.current,
      humanAttestation,
      interactionDurationMs: Date.now() - formStartedAtRef.current,
      _gotcha: fields._gotcha,
    };
  }

  function resetTurnstile() {
    setTurnstileToken(null);
    setTurnstileResetKey((key) => key + 1);
  }

  function startOver() {
    setStep("details");
    setChallengeId("");
    setVerificationCode("");
    setErrorDetail("");
    setStatus("idle");
    setHumanAttestation(false);
    submissionIdRef.current = null;
    formStartedAtRef.current = Date.now();
    resetTurnstile();
  }

  function responseError(body: unknown, fallback: string): string {
    if (!body || typeof body !== "object") return fallback;
    const record = body as { error?: unknown; errors?: unknown };
    if (typeof record.error === "string") return record.error;
    if (Array.isArray(record.errors)) {
      const messages = record.errors
        .map((error) =>
          error && typeof error === "object" && "message" in error
            ? (error as { message?: unknown }).message
            : null,
        )
        .filter((message): message is string => typeof message === "string");
      if (messages.length > 0) return messages.join(", ");
    }
    return fallback;
  }

  function update(key: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    // Re-validate live once a field has been touched
    if (touched[key as keyof FieldErrors]) {
      const err = validateField(key as keyof FieldErrors, value);
      setFieldErrors((e) => ({ ...e, [key]: err }));
    }
  }

  function handleBlur(key: keyof FieldErrors) {
    setTouched((t) => ({ ...t, [key]: true }));
    const err = validateField(key, fields[key]);
    setFieldErrors((e) => ({ ...e, [key]: err }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fields._gotcha) return;

    // Mark all fields touched so errors show
    setTouched({ name: true, email: true, organization: true, message: true });

    const errs = validateAll(fields);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const form = e.currentTarget;
      form.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFieldErrors({});

    if (!humanAttestation) {
      setErrorDetail("Confirm that you are personally submitting this inquiry.");
      setStatus("error");
      return;
    }

    if (requiresTurnstile && !turnstileToken) {
      setErrorDetail("Please complete the human verification before submitting.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorDetail("");
    submissionIdRef.current ??= createSubmissionId();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionPayload(),
          turnstileToken,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (
        res.ok &&
        body?.stage === "verification" &&
        typeof body.challengeId === "string" &&
        body.challengeId.length > 0
      ) {
        setChallengeId(body.challengeId);
        setVerificationCode("");
        setStep("verification");
        setStatus("idle");
      } else if (res.status === 503) {
        setStatus("unavailable");
        resetTurnstile();
      } else if (res.status === 429) {
        setErrorDetail("Too many submissions. Please wait a few minutes and try again.");
        setStatus("error");
        resetTurnstile();
      } else {
        setErrorDetail(responseError(body, res.ok ? "The service returned an unexpected response." : `HTTP ${res.status}`));
        setStatus("error");
        resetTurnstile();
      }
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : "Network error");
      setStatus("error");
      resetTurnstile();
    }
  }

  async function handleVerificationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) {
      setErrorDetail("Enter the six-digit confirmation code from your email.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorDetail("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionPayload(),
          challengeId,
          verificationCode,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok && body?.stage === "submitted") {
        setStatus("success");
        setFields(EMPTY);
        setFieldErrors({});
        setTouched({});
        setChallengeId("");
        setVerificationCode("");
        setHumanAttestation(false);
        submissionIdRef.current = null;
      } else if (res.status === 503) {
        setStatus("unavailable");
      } else if (res.status === 429) {
        setErrorDetail("Too many attempts. Please wait a few minutes and try again.");
        setStatus("error");
      } else {
        setErrorDetail(responseError(body, res.ok ? "The service returned an unexpected response." : "The confirmation code could not be verified."));
        setStatus("error");
      }
    } catch {
      setErrorDetail("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  const messageLen = fields.message.trim().length;
  const messageLenColor =
    messageLen > MESSAGE_MAX ? "text-red-400" :
    messageLen > MESSAGE_MAX * 0.9 ? "text-yellow-400" :
    "text-gray-600";

  if (status === "success") {
    return (
      <FadeIn>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-10 text-center">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Message received</h3>
          <p className="text-gray-400 font-light text-sm">
            Thank you. Aetheris Vision will review your message and typically reply within one business day.
          </p>
        </div>
      </FadeIn>
    );
  }

  if (step === "verification") {
    return (
      <FadeIn>
        <form onSubmit={handleVerificationSubmit} noValidate>
          <EmailVerificationStep
            email={fields.email.trim()}
            code={verificationCode}
            onCodeChange={(code) => {
              setVerificationCode(code);
              if (status === "error") {
                setStatus("idle");
                setErrorDetail("");
              }
            }}
            onStartOver={startOver}
            submitting={status === "submitting"}
            unavailable={status === "unavailable"}
            error={status === "error" ? errorDetail : undefined}
          />
        </form>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
              Name <span className="text-blue-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={NAME_MAX}
              value={fields.name}
              onChange={(e) => update("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              data-error={fieldErrors.name ? true : undefined}
              placeholder="Your full name"
              className={`w-full rounded-lg border px-4 py-3 text-sm text-white placeholder:text-gray-600 bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] transition ${
                fieldErrors.name ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
              }`}
            />
            {fieldErrors.name && <p role="alert" className="mt-1.5 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
              Email <span className="text-blue-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={fields.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              data-error={fieldErrors.email ? true : undefined}
              placeholder="you@example.com"
              className={`w-full rounded-lg border px-4 py-3 text-sm text-white placeholder:text-gray-600 bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] transition ${
                fieldErrors.email ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
              }`}
            />
            {fieldErrors.email && <p role="alert" className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>}
          </div>
        </div>

        {/* Organization */}
        <div>
          <label htmlFor="organization" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
            Organization
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            autoComplete="organization"
            maxLength={ORG_MAX}
            value={fields.organization}
            onChange={(e) => update("organization", e.target.value)}
            onBlur={() => handleBlur("organization")}
            data-error={fieldErrors.organization ? true : undefined}
            placeholder="Agency, department, or company"
            className={`w-full rounded-lg border px-4 py-3 text-sm text-white placeholder:text-gray-600 bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] transition ${
              fieldErrors.organization ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
            }`}
          />
          {fieldErrors.organization && <p role="alert" className="mt-1.5 text-xs text-red-400">{fieldErrors.organization}</p>}
        </div>

        {/* Requirement */}
        <div>
          <label htmlFor="requirement" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
            What do you need help with?
          </label>
          <select
            id="requirement"
            name="requirement"
            value={fields.requirement}
            onChange={(e) => update("requirement", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition appearance-none"
          >
            <option value="">Select a category</option>
            {requirementTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="message" className="block text-xs font-medium text-gray-400 uppercase tracking-widest">
              Message <span className="text-blue-500">*</span>
            </label>
            {messageLen > 0 && (
              <span className={`text-xs ${messageLenColor}`}>
                {messageLen.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}
              </span>
            )}
          </div>
          <textarea
            id="message"
            name="message"
            rows={5}
            maxLength={MESSAGE_MAX}
            value={fields.message}
            onChange={(e) => update("message", e.target.value)}
            onBlur={() => handleBlur("message")}
            data-error={fieldErrors.message ? true : undefined}
            placeholder="Tell us what you are working on, the outcome you need, and any timing or constraints."
            className={`w-full rounded-lg border px-4 py-3 text-sm text-white placeholder:text-gray-600 bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] transition resize-none ${
              fieldErrors.message ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
            }`}
          />
          {fieldErrors.message && <p role="alert" className="mt-1.5 text-xs text-red-400">{fieldErrors.message}</p>}
        </div>

        {status === "unavailable" && (
          <div role="status" className="rounded-md border border-yellow-500/30 bg-yellow-500/[0.06] p-4 text-sm text-yellow-200">
            Our inquiry form isn&apos;t accepting submissions right now. Please try again later or{" "}
            <a href="/book#consultation" className="underline font-medium">book a consultation</a>.
          </div>
        )}

        {status === "error" && (
          <p role="alert" className="text-sm text-red-400">
            Something went wrong{errorDetail ? `: ${errorDetail.replace(/[.!?]+$/, "")}` : ""}. Please try again or{" "}
            <a href="/book#consultation" className="underline font-medium">book a consultation</a>.
          </p>
        )}

        {/* Honeypot */}
        <input
          type="text"
          name="_gotcha"
          value={fields._gotcha}
          onChange={(e) => update("_gotcha", e.target.value)}
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />

        <p className="text-xs leading-5 text-gray-500">
          We use your details only to respond to this inquiry. See our{" "}
          <a href="/privacy" className="text-gray-400 underline decoration-white/20 underline-offset-4 hover:text-white">
            Privacy Policy
          </a>
          . Do not submit classified information, CUI, credentials, or other sensitive records here.
        </p>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-gray-300">
          <input
            type="checkbox"
            required
            checked={humanAttestation}
            onChange={(event) => {
              setHumanAttestation(event.target.checked);
              if (event.target.checked && status === "error") {
                setStatus("idle");
                setErrorDetail("");
              }
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-blue-500"
          />
          <span>
            I confirm I am a person submitting this inquiry, not an automated agent or bot.
          </span>
        </label>

        <TurnstileWidget
          action="contact"
          onTokenChange={setTurnstileToken}
          resetKey={turnstileResetKey}
        />

        <button
          type="submit"
          disabled={
            status === "submitting" ||
            !humanAttestation ||
            (requiresTurnstile && !turnstileToken)
          }
          className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending…" : "Send inquiry"}
        </button>
      </form>
    </FadeIn>
  );
}
