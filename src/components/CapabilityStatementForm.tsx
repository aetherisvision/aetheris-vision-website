"use client";

import { useId, useState } from "react";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import TurnstileWidget from "@/components/TurnstileWidget";
import { CONVERSIONS, trackConversion } from "@/lib/analytics";

type Status = "idle" | "sending" | "sent" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Submits a capability statement request for the principal to review. */
export default function CapabilityStatementForm() {
  const emailId = useId();
  const orgId = useId();
  const statusId = useId();

  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setStatus("error");
      setError("Enter a valid email address.");
      return;
    }
    if (!token) {
      setStatus("error");
      setError("Please complete the verification check.");
      return;
    }

    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/capability-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          organization: organization.trim(),
          turnstileToken: token,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setError(payload?.error ?? "Something went wrong. Please try again.");
        setToken(null);
        setResetKey(key => key + 1);
        return;
      }

      setStatus("sent");
      trackConversion(CONVERSIONS.capabilityStatementRequested);
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
      setToken(null);
      setResetKey(key => key + 1);
    }
  }

  if (status === "sent") {
    return (
      <div
        className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6"
        role="status"
      >
        <CheckCircleIcon className="mb-3 h-6 w-6 text-emerald-400" aria-hidden="true" />
        <p className="font-medium text-white">Request received.</p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          We will review your request and follow up at{" "}
          <span className="text-white">{email.trim()}</span>. The capability statement is provided after review.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-white">
          Work email
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          aria-describedby={statusId}
          className="min-h-12 w-full border border-white/20 bg-[#0a1628] px-4 text-base text-white outline-none transition placeholder:text-white/55 focus:border-[#9bc3df] focus:ring-2 focus:ring-[#9bc3df]/25"
        />
      </div>

      <div>
        <label htmlFor={orgId} className="mb-1.5 block text-sm font-medium text-white">
          Organization <span className="text-white/60">(optional)</span>
        </label>
        <input
          id={orgId}
          type="text"
          name="organization"
          autoComplete="organization"
          maxLength={200}
          value={organization}
          onChange={event => setOrganization(event.target.value)}
          placeholder="Agency, office, or company"
          className="min-h-12 w-full border border-white/20 bg-[#0a1628] px-4 text-base text-white outline-none transition placeholder:text-white/55 focus:border-[#9bc3df] focus:ring-2 focus:ring-[#9bc3df]/25"
        />
      </div>

      <TurnstileWidget
        // Must match TURNSTILE_ACTIONS.capabilityStatement on the server.
        action="capability-statement"
        onTokenChange={setToken}
        resetKey={resetKey}
      />

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? "Sending…" : "Request the capability statement"}
        {status !== "sending" && <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />}
      </button>

      <p id={statusId} className="text-xs leading-5 text-white/60" role="status">
        {status === "error" && error ? (
          <span className="text-red-300">{error}</span>
        ) : (
          "We use your address to review and respond to your request."
        )}
      </p>
    </form>
  );
}
