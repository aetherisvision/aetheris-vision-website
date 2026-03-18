import { NextRequest, NextResponse } from "next/server";

// Allowlist: only proxy images from these trusted satellite imagery hosts
const ALLOWED_HOSTS = new Set([
  "cdn.star.nesdis.noaa.gov",
  "epic.gsfc.nasa.gov",
  "himawari8.nict.go.jp",
  "view.eumetsat.int",
  "images-assets.nasa.gov",
  "images.nasa.gov",
]);

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(raw, {
      headers: {
        // Present a neutral browser-like User-Agent
        "User-Agent": "Mozilla/5.0 (compatible; AetherisBot/1.0)",
      },
      // 10-second timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const contentType =
      upstream.headers.get("content-type") ?? "image/jpeg";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 10 minutes — satellite imagery updates that frequently
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    });
  } catch (err) {
    console.error("[satellite proxy] fetch failed:", err);
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }
}
