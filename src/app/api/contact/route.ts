import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SITE } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

// Contact submissions are delivered by email through Resend — the same
// provider already used for magic-link sign-in and invoice delivery. This
// removes the Formspree login dependency and reuses our verified sending
// domain (aetherisvision.com).
const resend = new Resend(process.env.RESEND_API_KEY);

// Notifications are sent from the verified Resend domain; replies are routed
// back to the submitter via replyTo.
const FROM_ADDRESS = `${SITE.name} <system@aetherisvision.com>`;

// Rate limit: 5 submissions per IP per 10 minutes. Distributed across Vercel
// instances when Upstash/Vercel KV is configured, else in-memory (issue #12).
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** Safely read a string field from untrusted JSON (non-strings → ""). */
function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Collapse CR/LF so untrusted values cannot inject email header lines. */
function singleLine(value: string, max: number): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

/** Escape user-supplied text before interpolating it into the HTML email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  const { success } = await rateLimit(ip, {
    limit: RATE_LIMIT,
    windowMs: WINDOW_MS,
    prefix: "contact",
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429 }
    );
  }

  // ── Config check ───────────────────────────────────────────────────────────
  // Without a Resend API key the form cannot deliver mail; return 503 so the UI
  // shows its "form unavailable" notice instead of silently dropping messages.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Form not configured" }, { status: 503 });
  }

  const data: Record<string, unknown> = await req.json();

  // ── Honeypot check ─────────────────────────────────────────────────────────
  // Bots fill in hidden fields. Humans never see this field so it stays blank.
  if (asString(data._gotcha)) {
    // Return 200 to fool the bot into thinking it succeeded
    return NextResponse.json({ ok: true });
  }

  // ── Input validation ───────────────────────────────────────────────────────
  // Fields come from untrusted JSON; coerce non-strings to "" so a crafted
  // payload (e.g. name: 123) yields a 400 rather than throwing a 500.
  const name = asString(data.name).trim();
  const email = asString(data.email).trim();
  const message = asString(data.message).trim();
  const organization = asString(data.organization).trim();
  const requirement = asString(data.requirement).trim();

  if (!name || name.length < 2 || name.length > 200) {
    return NextResponse.json(
      { error: "Name must be between 2 and 200 characters." },
      { status: 400 }
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }

  if (!message || message.length < 10 || message.length > 5000) {
    return NextResponse.json(
      { error: "Message must be between 10 and 5000 characters." },
      { status: 400 }
    );
  }

  // ── Deliver via Resend ──────────────────────────────────────────────────────
  // Strip CR/LF and cap length before placing requirement in the subject so a
  // crafted value cannot inject additional email headers.
  const subjectRequirement = singleLine(requirement, 100);
  const subjectLine = subjectRequirement
    ? `New contact form submission — ${subjectRequirement}`
    : "New contact form submission";

  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    organization ? `Organization: ${organization}` : "Organization: —",
    requirement ? `Requirement: ${requirement}` : "Requirement: —",
    "",
    "Message:",
    message,
  ].join("\n");

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
      <h2 style="margin:0 0 16px;">New contact form submission</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:4px 0;color:#64748b;width:120px;">Name</td><td style="padding:4px 0;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Organization</td><td style="padding:4px 0;">${organization ? escapeHtml(organization) : "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Requirement</td><td style="padding:4px 0;">${requirement ? escapeHtml(requirement) : "—"}</td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Message</h3>
      <p style="white-space:pre-wrap;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(message)}</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [SITE.email],
    replyTo: email,
    subject: subjectLine,
    text: textBody,
    html: htmlBody,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
