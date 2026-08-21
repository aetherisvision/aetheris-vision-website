import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  isAdmin: mocks.isAdmin,
  unauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@vercel/blob", () => ({ get: mocks.get }));

let GET: (request: NextRequest) => Promise<Response>;

function requestFor(path: string | null): NextRequest {
  const url = new URL("http://localhost:3000/api/receipts/file");
  if (path !== null) url.searchParams.set("path", path);
  return new NextRequest(url);
}

beforeEach(async () => {
  vi.resetModules();
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.isAdmin.mockReturnValue(true);
  mocks.get.mockResolvedValue({
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
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("streams a private receipt to an administrator without caching it", async () => {
    const response = await GET(requestFor("receipts/abc.pdf"));
    expect(response.status).toBe(200);
    expect(mocks.get).toHaveBeenCalledWith("receipts/abc.pdf", { access: "private" });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("rejects paths outside the receipts prefix", async () => {
    for (const path of ["oauth/tokens.json", "../../secrets", "receipts/../oauth", ""]) {
      const response = await GET(requestFor(path));
      expect(response.status).toBe(400);
    }
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("reports a missing receipt as 404 rather than an error", async () => {
    mocks.get.mockResolvedValue(null);
    const response = await GET(requestFor("receipts/gone.pdf"));
    expect(response.status).toBe(404);
  });

  it("does not leak provider errors to the caller", async () => {
    mocks.get.mockRejectedValue(new Error("blob store exploded"));
    const response = await GET(requestFor("receipts/abc.pdf"));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Receipt unavailable" });
  });
});
