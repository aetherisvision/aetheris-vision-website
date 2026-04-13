"use client";

import { useState } from "react";
import { SITE } from "@/lib/constants";

interface FormData {
  name: string;
  email: string;
  phone: string;
  projectDescription: string;
  budgetRange: string;
}

export default function ProjectIntakeForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    projectDescription: "",
    budgetRange: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: formData.name,
          contactEmail: formData.email,
          contactPhone: formData.phone,
          specialRequirements: formData.projectDescription,
          budgetRange: formData.budgetRange,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to submit form");
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-6">
          <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4">We&apos;ve got it!</h3>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto leading-relaxed">
          Thanks, {formData.name.split(" ")[0]}. We&apos;ll review your project details and reach out within one business day.
          Expect an email at <span className="text-white">{formData.email}</span>.
        </p>
        <a
          href="/book"
          className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition"
        >
          Book a call while you wait
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Name + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Your name *</label>
          <input
            type="text"
            required
            autoComplete="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Email address *</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="jane@yourbusiness.com"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Phone <span className="text-gray-500 font-normal">(optional — we&apos;ll call you)</span>
        </label>
        <input
          type="tel"
          autoComplete="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="(405) 555-1234"
        />
      </div>

      {/* Project Description */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">Tell us about your project *</label>
        <p className="text-xs text-gray-500 mb-2">
          What does your business do, what do you need built, and what problem are you trying to solve? No need to be technical — just tell us in plain English.
        </p>
        <textarea
          required
          value={formData.projectDescription}
          onChange={(e) => handleInputChange("projectDescription", e.target.value)}
          rows={5}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          placeholder="Example: I run a landscaping company in Edmond. I need a website that shows my work, lets customers request quotes, and comes up on Google when people search for landscapers nearby. I currently have nothing."
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Rough budget <span className="text-gray-500 font-normal">(optional — helps us right-size the proposal)</span>
        </label>
        <select
          value={formData.budgetRange}
          onChange={(e) => handleInputChange("budgetRange", e.target.value)}
          className="w-full rounded-md border border-white/10 bg-[#1a1a1f] px-3 py-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Not sure yet</option>
          <option value="under-2k">Under $2,000</option>
          <option value="2k-5k">$2,000 – $5,000</option>
          <option value="5k-15k">$5,000 – $15,000</option>
          <option value="15k-plus">$15,000+</option>
          <option value="flexible">Flexible — show me options</option>
        </select>
      </div>

      {/* Error state */}
      {submitStatus === "error" && (
        <div className="rounded-md bg-red-900/20 border border-red-500/20 p-4">
          <p className="text-red-400 text-sm">
            Something went wrong. Try again or email us directly at{" "}
            <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>.
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending…" : "Send Project Details"}
      </button>

      <p className="text-xs text-gray-600 text-center">
        We respond within one business day. No spam — ever.
      </p>
    </form>
  );
}
