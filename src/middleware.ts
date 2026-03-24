import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Bypass auth for Next.js internals, API routes, and static assets
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const password = process.env.PREVIEW_PASSWORD ?? "marston-av";
  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [, pwd] = decoded.split(":");
      if (pwd === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Site preview — authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Aetheris Vision Preview"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
