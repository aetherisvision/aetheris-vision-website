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

// Full-disk GOES frames run 1–3 MB; anything larger is not a satellite image.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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
      // An open redirect on an allowlisted host must not become an SSRF pivot.
      redirect: "error",
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
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Upstream is not an image", { status: 502 });
    }
    const declared = Number(upstream.headers.get("content-length") ?? 0);
    if (declared > MAX_IMAGE_BYTES) {
      return new NextResponse("Upstream image too large", { status: 502 });
    }
    const body = await upstream.arrayBuffer();
    if (body.byteLength > MAX_IMAGE_BYTES) {
      return new NextResponse("Upstream image too large", { status: 502 });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Upstream is a trusted CDN, but never let a served SVG be treated as
        // active content by a browser that sniffs.
        "X-Content-Type-Options": "nosniff",
        // Cache for 10 minutes — satellite imagery updates that frequently
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    });
  } catch (err) {
    console.error("[satellite proxy] fetch failed:", err);
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }
}
