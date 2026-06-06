"use client";

import { useState } from "react";
import { ArrowDownTrayIcon, CheckIcon } from "@heroicons/react/24/outline";

type Status = "idle" | "open" | "sending" | "sent" | "error" | "unconfigured";

export default function CapabilityRequestForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message: "Requesting the Aetheris Vision capabilities statement PDF.",
          _subject: "Capabilities Statement PDF Request",
          _gotcha: honeypot,
        }),
      });
      if (res.ok) {
        setStatus("sent");
      } else if (res.status === 503) {
        setStatus("unconfigured");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm py-2">
        <CheckIcon className="h-4 w-4 shrink-0" />
        Request received. We&apos;ll send the PDF within one business day.
      </div>
    );
  }

  if (status === "idle") {
    return (
      <button
        onClick={() => setStatus("open")}
        className={
          compact
            ? "inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-5 text-sm text-gray-300 hover:bg-white/[0.07] transition shrink-0"
            : "inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
        }
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Request PDF
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      {/* Honeypot — hidden from real users, filled only by bots */}
      <input
        type="text"
        name="_gotcha"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />
      <input
        type="text"
        placeholder="Your name"
        aria-label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        maxLength={100}
        className="h-10 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-40"
      />
      <input
        type="email"
        placeholder="Your email"
        aria-label="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-10 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-52"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="h-10 rounded-md bg-white px-5 text-sm font-medium text-black hover:bg-gray-200 transition disabled:opacity-50 shrink-0"
      >
        {status === "sending" ? "Sending…" : "Send"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-xs w-full sm:w-auto self-center">
          Something went wrong.{" "}
          <a href="/contact" className="underline hover:text-red-300">
            Use the contact page.
          </a>
        </p>
      )}
      {status === "unconfigured" && (
        <p className="text-yellow-400 text-xs w-full sm:w-auto self-center">
          Form not configured yet.{" "}
          <a href="/contact" className="underline hover:text-yellow-300">
            Use the contact page.
          </a>
        </p>
      )}
    </form>
  );
}
