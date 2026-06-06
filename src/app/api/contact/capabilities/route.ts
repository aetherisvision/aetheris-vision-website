import { NextRequest, NextResponse } from "next/server";
import { SITE } from "@/lib/constants";

const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const ipMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // Use a dedicated Formspree form (configured to deliver to info@aetherisvision.com).
  // Falls back to the main form ID if the dedicated one isn't set yet.
  const FORMSPREE_ID =
    process.env.FORMSPREE_CAPABILITIES_ID ?? process.env.NEXT_PUBLIC_FORMSPREE_ID;
  if (!FORMSPREE_ID) {
    return NextResponse.json({ error: "Form not configured" }, { status: 503 });
  }

  const data: Record<string, string> = await req.json();
  if (data._gotcha) return NextResponse.json({ ok: true });
  delete data._gotcha;

  const name = data.name?.trim();
  const email = data.email?.trim();

  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      _replyto: email,
      _subject: "Capabilities Statement PDF Request",
      message: "Requesting the Aetheris Vision capabilities statement PDF.",
    }),
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
