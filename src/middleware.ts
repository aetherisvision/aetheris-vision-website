import { NextRequest, NextResponse } from "next/server";

const PASSWORD = process.env.PREVIEW_PASSWORD ?? "marston-av";

export function middleware(request: NextRequest) {
  // Allow Next.js internals and static assets through unconditionally
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo/")
  ) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = Buffer.from(auth.slice(6), "base64").toString();
    const password = decoded.includes(":") ? decoded.split(":")[1] : decoded;
    if (password === PASSWORD) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Aetheris Vision Preview"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
