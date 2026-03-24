"use client";

import { useState } from "react";
import FadeIn from "@/components/FadeIn";
import { SITE } from "@/lib/constants";

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID;

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

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!FORMSPREE_ID) {
      window.location.href = `mailto:${SITE.email}`;
      return;
    }

    setStatus("submitting");
    setErrorDetail("");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else if (res.status === 429) {
        setErrorDetail("Too many submissions — please wait a few minutes and try again.");
        setStatus("error");
      } else {
        const body = await res.json().catch(() => ({}));
        const msg = body?.errors?.map((err: { message: string }) => err.message).join(", ")
          || body?.error
          || `HTTP ${res.status}`;
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
              Name <span className="text-blue-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">
              Email <span className="text-blue-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition"
            />
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
            required
            rows={5}
            placeholder="Describe your requirement, timeline, and any relevant context..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition resize-none"
          />
        </div>

        {status === "error" && (
          <p className="text-sm text-red-400">
            Something went wrong{errorDetail ? `: ${errorDetail}` : ""}. Please try again or email us directly at{" "}
            <a href={`mailto:${SITE.email}`} className="underline">
              {SITE.email}
            </a>.
          </p>
        )}

        {/* Honeypot — hidden from humans, bots fill it in automatically */}
        <input type="text" name="_gotcha" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending…" : "Send Message"}
        </button>

        {!FORMSPREE_ID && (
          <p className="text-xs text-gray-600">
            — Will open your mail client (Formspree not configured)
          </p>
        )}
      </form>
    </FadeIn>
  );
}
