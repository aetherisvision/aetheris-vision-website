"use client";

import { useEffect, useRef, useState } from "react";
import EmailVerificationStep from "@/components/EmailVerificationStep";
import TurnstileWidget from "@/components/TurnstileWidget";
import { createSubmissionId } from "@/lib/client-submission-id";

const NAME_MAX = 100;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

type FieldName = "name" | "email" | "message";

interface Fields {
  name: string;
  email: string;
  message: string;
  _gotcha: string;
}

type FieldErrors = Partial<Record<FieldName, string>>;

const EMPTY_FIELDS: Fields = {
  name: "",
  email: "",
  message: "",
  _gotcha: "",
};

function validateField(field: FieldName, value: string): string | undefined {
  const trimmed = value.trim();

  if (field === "name") {
    if (!trimmed) return "Enter your name.";
    if (trimmed.length < 2) return "Name must be at least 2 characters.";
    if (trimmed.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
  }

  if (field === "email") {
    if (!trimmed) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return "Enter a valid email address.";
  }

  if (field === "message") {
    if (!trimmed) return "Tell us briefly what you need.";
    if (trimmed.length < MESSAGE_MIN) return `Message must be at least ${MESSAGE_MIN} characters.`;
    if (trimmed.length > MESSAGE_MAX) return `Message must be ${MESSAGE_MAX.toLocaleString()} characters or fewer.`;
  }

  return undefined;
}

function validate(fields: Fields): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of ["name", "email", "message"] as const) {
    const error = validateField(field, fields[field]);
    if (error) errors[field] = error;
  }

  return errors;
}

export default function QuickContactForm() {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "unavailable">("idle");
  const [step, setStep] = useState<"details" | "verification">("details");
  const [errorDetail, setErrorDetail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [humanAttestation, setHumanAttestation] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const submissionIdRef = useRef<string | null>(null);
  const formStartedAtRef = useRef(Date.now());
  const requiresTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  function update(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    if (field !== "_gotcha" && touched[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  }

  function blur(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: validateField(field, fields[field]) }));
  }

  function submissionPayload() {
    return {
      name: fields.name.trim(),
      email: fields.email.trim(),
      organization: "",
      phone: "",
      requirement: "Homepage inquiry",
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
    const error = (body as { error?: unknown }).error;
    return typeof error === "string" ? error : fallback;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fields._gotcha) return;

    const nextErrors = validate(fields);
    setTouched({ name: true, email: true, message: true });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = nextErrors.name
        ? nameRef.current
        : nextErrors.email
          ? emailRef.current
          : nextErrors.message
            ? messageRef.current
            : null;
      firstInvalid?.focus();
      return;
    }

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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionPayload(),
          turnstileToken,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (
        response.ok &&
        body?.stage === "verification" &&
        typeof body.challengeId === "string" &&
        body.challengeId.length > 0
      ) {
        setChallengeId(body.challengeId);
        setVerificationCode("");
        setStep("verification");
        setStatus("idle");
      } else if (response.status === 503) {
        setStatus("unavailable");
        resetTurnstile();
      } else {
        setErrorDetail(responseError(body, response.ok ? "The service returned an unexpected response." : "We could not send your message."));
        setStatus("error");
        resetTurnstile();
      }
    } catch {
      setErrorDetail("Network error. Please check your connection and try again.");
      setStatus("error");
      resetTurnstile();
    }
  }

  async function submitVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) {
      setErrorDetail("Enter the six-digit confirmation code from your email.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorDetail("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionPayload(),
          challengeId,
          verificationCode,
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok && body?.stage === "submitted") {
        setFields(EMPTY_FIELDS);
        setErrors({});
        setTouched({});
        setChallengeId("");
        setVerificationCode("");
        setHumanAttestation(false);
        submissionIdRef.current = null;
        setStatus("success");
      } else if (response.status === 503) {
        setStatus("unavailable");
      } else if (response.status === 429) {
        setErrorDetail("Too many attempts. Please wait a few minutes and try again.");
        setStatus("error");
      } else {
        setErrorDetail(responseError(body, response.ok ? "The service returned an unexpected response." : "The confirmation code could not be verified."));
        setStatus("error");
      }
    } catch {
      setErrorDetail("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="border border-white/20 bg-white/[0.04] p-8 outline-none sm:p-10"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bc3df]">Message received</p>
        <p className="mt-4 font-serif text-3xl leading-tight text-white">
          Thank you. Aetheris Vision will review your message and typically reply within one business day.
        </p>
      </div>
    );
  }

  if (step === "verification") {
    return (
      <form onSubmit={submitVerification} noValidate className="border border-white/20 bg-white/[0.035] p-6 sm:p-8">
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
    );
  }

  return (
    <form onSubmit={submit} noValidate className="border border-white/20 bg-white/[0.035] p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="quick-contact-name" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/65">
            Name <span aria-hidden="true" className="text-[#9bc3df]">*</span>
          </label>
          <input
            ref={nameRef}
            id="quick-contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={NAME_MAX}
            value={fields.name}
            onChange={(event) => update("name", event.target.value)}
            onBlur={() => blur("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "quick-contact-name-error" : undefined}
            className="min-h-12 w-full border border-white/20 bg-[#0a1628] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#9bc3df] focus:ring-2 focus:ring-[#9bc3df]/25"
          />
          {errors.name && <p id="quick-contact-name-error" role="alert" className="mt-2 text-sm text-red-300">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="quick-contact-email" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/65">
            Email <span aria-hidden="true" className="text-[#9bc3df]">*</span>
          </label>
          <input
            ref={emailRef}
            id="quick-contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={fields.email}
            onChange={(event) => update("email", event.target.value)}
            onBlur={() => blur("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "quick-contact-email-error" : undefined}
            className="min-h-12 w-full border border-white/20 bg-[#0a1628] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#9bc3df] focus:ring-2 focus:ring-[#9bc3df]/25"
          />
          {errors.email && <p id="quick-contact-email-error" role="alert" className="mt-2 text-sm text-red-300">{errors.email}</p>}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="quick-contact-message" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/65">
          What can we help with? <span aria-hidden="true" className="text-[#9bc3df]">*</span>
        </label>
        <textarea
          ref={messageRef}
          id="quick-contact-message"
          name="message"
          rows={5}
          required
          maxLength={MESSAGE_MAX}
          value={fields.message}
          onChange={(event) => update("message", event.target.value)}
          onBlur={() => blur("message")}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "quick-contact-message-error" : "quick-contact-guidance"}
          placeholder="The outcome you need, the data or system involved, and any timing constraints."
          className="w-full resize-y border border-white/20 bg-[#0a1628] px-4 py-3 text-base leading-7 text-white outline-none transition placeholder:text-white/30 focus:border-[#9bc3df] focus:ring-2 focus:ring-[#9bc3df]/25"
        />
        <p id="quick-contact-guidance" className="mt-2 text-xs leading-5 text-white/45">A few sentences are enough.</p>
        {errors.message && <p id="quick-contact-message-error" role="alert" className="mt-2 text-sm text-red-300">{errors.message}</p>}
      </div>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="quick-contact-company-website">Company website</label>
        <input
          id="quick-contact-company-website"
          name="_gotcha"
          type="text"
          value={fields._gotcha}
          onChange={(event) => update("_gotcha", event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {status === "unavailable" && (
        <p role="status" className="mt-5 border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
          The form is temporarily unavailable. Please try again later or{" "}
          <a className="font-semibold underline" href="/book">book a consultation</a>.
        </p>
      )}

      {status === "error" && (
        <p role="alert" className="mt-5 border border-red-300/30 bg-red-300/10 p-4 text-sm leading-6 text-red-100">
          {errorDetail ? `${errorDetail.replace(/[.!?]+$/, "")}.` : "We could not send your message."} Please try again or{" "}
          <a className="font-semibold underline" href="/contact">use the project inquiry form</a>.
        </p>
      )}

      <p className="mt-5 text-xs leading-5 text-white/45">
        We use the information you provide to respond and manage your inquiry. See our{" "}
        <a href="/privacy" className="text-white/75 underline underline-offset-2 hover:text-white">Privacy Policy</a>. Do not submit classified information, CUI, credentials, or other sensitive records here.
      </p>

      <label className="mt-5 flex cursor-pointer items-start gap-3 border border-white/15 bg-white/[0.025] p-4 text-sm leading-6 text-white/75">
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
          className="mt-1 h-4 w-4 shrink-0 accent-[#9bc3df]"
        />
        <span>I confirm I am a person submitting this inquiry, not an automated agent or bot.</span>
      </label>

      <div className="mt-5">
        <TurnstileWidget
          action="contact"
          onTokenChange={setTurnstileToken}
          resetKey={turnstileResetKey}
        />
      </div>

      <button
        type="submit"
        disabled={
          status === "submitting" ||
          !humanAttestation ||
          (requiresTurnstile && !turnstileToken)
        }
        className="mt-6 inline-flex min-h-12 items-center justify-center bg-white px-7 text-sm font-semibold text-[#0a1628] transition hover:bg-[#dbe8f0] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
