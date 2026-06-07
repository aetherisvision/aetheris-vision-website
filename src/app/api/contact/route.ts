import { NextRequest, NextResponse } from "next/server";
import { SITE } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

// Rate limit: 5 submissions per IP per 10 minutes. Distributed across Vercel
// instances when Upstash/Vercel KV is configured, else in-memory (issue #12).
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

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
  const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID;
  if (!FORMSPREE_ID) {
    return NextResponse.json({ error: "Form not configured" }, { status: 503 });
  }

  const data: Record<string, string> = await req.json();

  // ── Honeypot check ─────────────────────────────────────────────────────────
  // Bots fill in hidden fields. Humans never see this field so it stays blank.
  if (data._gotcha) {
    // Return 200 to fool the bot into thinking it succeeded
    return NextResponse.json({ ok: true });
  }
  delete data._gotcha;

  // ── Input validation ───────────────────────────────────────────────────────
  const name = data.name?.trim();
  const email = data.email?.trim();
  const message = data.message?.trim();

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

  // ── Forward to Formspree ───────────────────────────────────────────────────
  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Referer: SITE.url,
      Origin: SITE.url,
    },
  });

  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}
