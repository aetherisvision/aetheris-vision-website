"use client";

import { useState } from "react";
import FadeIn from "@/components/FadeIn";
import { SITE } from "@/lib/constants";

const requirementTypes = [
  "New Website — Custom Build",
  "Website Redesign",
  "E-commerce / Online Store",
  "Client or Member Portal",
  "WordPress Development",
  "Website Maintenance",
  "Meteorology / AI Consulting",
  "Federal Contracting",
  "Other",
];

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
  message?: string;
}

const EMPTY: Fields = {
  name: "", email: "", organization: "", requirement: "", message: "", _gotcha: "",
};

function validate(fields: Fields): FieldErrors {
  const errs: FieldErrors = {};
  if (!fields.name.trim() || fields.name.trim().length < 2) errs.name = "Name is required.";
  if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errs.email = "Valid email address required.";
  if (!fields.message.trim() || fields.message.trim().length < 10) errs.message = "Message must be at least 10 characters.";
  return errs;
}

export default function ContactForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function update(key: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Honeypot
    if (fields._gotcha) return;

    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const form = e.currentTarget;
      const firstErr = form.querySelector("[data-error]");
      firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFieldErrors({});

    const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID;
    if (!FORMSPREE_ID) {
      window.location.href = `mailto:${SITE.email}`;
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
      } else if (res.status === 429) {
        setErrorDetail("Too many submissions — please wait a few minutes and try again.");
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
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
              Name <span className="text-blue-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={fields.name}
              onChange={(e) => update("name", e.target.value)}
              data-error={fieldErrors.name ? true : undefined}
              placeholder="Your name"
              className={`w-full rounded-lg border px-4 py-3 text-sm text-white placeholder:text-gray-600 bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] transition ${
                fieldErrors.name ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
              }`}
            />
            {fieldErrors.name && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
              Email <span className="text-blue-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={fields.email}
              onChange={(e) => update("email", e.target.value)}
              data-error={fieldErrors.email ? true : undefined}
              placeholder="you@company.com"
              className={`w-full rounded-lg border px-4 py-3 text-sm text-white placeholder:text-gray-600 bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] transition ${
                fieldErrors.email ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
              }`}
            />
            {fieldErrors.email && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="organization" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
            Organization
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            value={fields.organization}
            onChange={(e) => update("organization", e.target.value)}
            placeholder="Agency, department, or company"
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition"
          />
        </div>

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

        <div>
          <label htmlFor="message" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
            Message <span className="text-blue-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={fields.message}
            onChange={(e) => update("message", e.target.value)}
            data-error={fieldErrors.message ? true : undefined}
            placeholder="Describe your requirement, timeline, and any relevant context..."
            className={`w-full rounded-lg border px-4 py-3 text-sm text-white placeholder:text-gray-600 bg-white/[0.03] focus:outline-none focus:bg-white/[0.05] transition resize-none ${
              fieldErrors.message ? "border-red-500/60" : "border-white/10 focus:border-blue-500/50"
            }`}
          />
          {fieldErrors.message && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.message}</p>}
        </div>

        {status === "error" && (
          <p className="text-sm text-red-400">
            Something went wrong{errorDetail ? `: ${errorDetail}` : ""}. Please try again or email us at{" "}
            <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>.
          </p>
        )}

        {/* Honeypot — hidden from humans */}
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
