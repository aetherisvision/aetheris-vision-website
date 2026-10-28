import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  getGcsReceipt: vi.fn(),
  isValidReceiptPathname: vi.fn(
    (p: unknown) =>
      typeof p === "string" &&
      !p.includes("..") &&
      !p.startsWith("receipts//") &&
      /^receipts\/[A-Za-z0-9._/-]{1,200}$/.test(p),
  ),
}));

vi.mock("@/lib/admin-auth", () => ({
  isAdmin: mocks.isAdmin,
  unauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/receipt-gcs", () => ({
  getGcsReceipt: mocks.getGcsReceipt,
  isValidReceiptPathname: mocks.isValidReceiptPathname,
}));

let GET: (request: NextRequest) => Promise<Response>;

function requestFor(path: string | null): NextRequest {
  const url = new URL("http://localhost:3000/api/receipts/file");
  if (path !== null) url.searchParams.set("path", path);
  return new NextRequest(url);
}

beforeEach(async () => {
  vi.resetModules();
  mocks.isAdmin.mockReset();
  mocks.getGcsReceipt.mockReset();
  mocks.isAdmin.mockReturnValue(true);
  mocks.getGcsReceipt.mockResolvedValue({
    stream: new ReadableStream(),
    blob: { contentType: "application/pdf" },
  });
  ({ GET } = await import("@/app/api/receipts/file/route"));
});

describe("GET /api/receipts/file", () => {
  it("refuses a caller without an admin session", async () => {
    mocks.isAdmin.mockReturnValue(false);
    const response = await GET(requestFor("receipts/abc.pdf"));
    expect(response.status).toBe(401);
    expect(mocks.getGcsReceipt).not.toHaveBeenCalled();
  });

  it("streams a private GCS receipt to an administrator without caching it", async () => {
    const response = await GET(requestFor("receipts/abc.pdf"));
    expect(response.status).toBe(200);
    expect(mocks.getGcsReceipt).toHaveBeenCalledWith("receipts/abc.pdf");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("rejects paths outside the receipts prefix", async () => {
    for (const path of ["oauth/tokens.json", "../../secrets", "receipts/../oauth", ""]) {
      const response = await GET(requestFor(path));
      expect(response.status).toBe(400);
    }
    expect(mocks.getGcsReceipt).not.toHaveBeenCalled();
  });

  it("reports a missing receipt as 404 rather than an error", async () => {
    mocks.getGcsReceipt.mockResolvedValue(null);
    const response = await GET(requestFor("receipts/gone.pdf"));
    expect(response.status).toBe(404);
  });

  it("does not leak provider errors to the caller", async () => {
    mocks.getGcsReceipt.mockRejectedValue(new Error("gcs bucket exploded"));
    const response = await GET(requestFor("receipts/abc.pdf"));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Receipt unavailable" });
  });
});
