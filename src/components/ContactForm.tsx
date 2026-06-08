"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import FadeIn from "@/components/FadeIn";

const CONTACT_PHONE = "(346) 381-9629";

const requirementTypes = [
  "New Website (Custom Build)",
  "Website Redesign",
  "E-commerce / Online Store",
  "Client or Member Portal",
  "WordPress Development",
  "Website Maintenance",
  "Meteorology / AI Consulting",
  "Federal Contracting",
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
  // The form posts to /api/contact, which forwards to Formspree. When
  // NEXT_PUBLIC_FORMSPREE_ID is not configured, the form cannot deliver
  // messages, so we surface a clear notice and point visitors to the phone /
  // scheduling alternatives instead of silently failing.
  const formEnabled = Boolean(process.env.NEXT_PUBLIC_FORMSPREE_ID);

  // Optional prefill of the message field from a ?topic= (or ?subject=)
  // query param, e.g. /contact?topic=Capabilities%20Statement%20PDF%20Request.
  const searchParams = useSearchParams();
  const prefillTopic =
    searchParams.get("topic")?.trim() || searchParams.get("subject")?.trim() || "";

  const [fields, setFields] = useState<Fields>(() =>
    prefillTopic ? { ...EMPTY, message: prefillTopic } : EMPTY,
  );
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "unavailable">("idle");
  const [errorDetail, setErrorDetail] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

    // Read at submit time so the gate reflects current configuration.
    if (!process.env.NEXT_PUBLIC_FORMSPREE_ID) {
      setStatus("unavailable");
      return;
    }

    setStatus("submitting");
    setErrorDetail("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          organization: fields.organization.trim(),
          requirement: fields.requirement,
          message: fields.message.trim(),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setFields(EMPTY);
        setFieldErrors({});
        setTouched({});
      } else if (res.status === 429) {
        setErrorDetail("Too many submissions. Please wait a few minutes and try again.");
        setStatus("error");
      } else {
        const body = await res.json().catch(() => ({}));
        const msg =
          body?.errors?.map((err: { message: string }) => err.message).join(", ") ||
          body?.error ||
          `HTTP ${res.status}`;
        setErrorDetail(msg);
        setStatus("error");
      }
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : "Network error");
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
          <h3 className="text-white font-semibold text-lg mb-2">Message Received</h3>
          <p className="text-gray-400 font-light text-sm">
            Thank you for reaching out. We will respond within one business day.
          </p>
        </div>
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
              placeholder="you@company.com"
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
            Requirement Type
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
            placeholder="Describe your requirement, timeline, and any relevant context..."
            className={`w-full rounded-lg border px-4 py-3 text-sm text-white placeholder:text-gray-600 bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] transition resize-none ${
              fieldErrors.message ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
            }`}
          />
          {fieldErrors.message && <p role="alert" className="mt-1.5 text-xs text-red-400">{fieldErrors.message}</p>}
        </div>

        {!formEnabled && (
          <div role="status" className="rounded-md border border-yellow-500/30 bg-yellow-500/[0.06] p-4 text-sm text-yellow-200">
            Our message form isn&apos;t accepting submissions right now. Please call or text{" "}
            <a href={`tel:+13463819629`} className="underline font-medium">{CONTACT_PHONE}</a>, or{" "}
            <a href="/book" className="underline font-medium">book a call</a> and we&apos;ll follow up.
          </div>
        )}

        {status === "unavailable" && (
          <p className="text-sm text-yellow-300">
            The form is temporarily unavailable. Please call or text {CONTACT_PHONE}, or book a call above.
          </p>
        )}

        {status === "error" && (
          <p className="text-sm text-red-400">
            Something went wrong{errorDetail ? `: ${errorDetail}` : ""}. Please try again, or call/text {CONTACT_PHONE}.
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

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending…" : "Send Message"}
        </button>
      </form>
    </FadeIn>
  );
}
