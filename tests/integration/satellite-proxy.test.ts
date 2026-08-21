import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

let GET: (request: NextRequest) => Promise<Response>;
const fetchMock = vi.fn();

function requestFor(url: string | null): NextRequest {
  const target = new URL("http://localhost:3000/api/satellite");
  if (url !== null) target.searchParams.set("url", url);
  return new NextRequest(target);
}

function imageResponse() {
  return new Response(new ArrayBuffer(1024), {
    status: 200,
    headers: { "Content-Type": "image/jpeg", "Content-Length": "1024" },
  });
}

function redirectTo(location: string, status = 301) {
  return new Response(null, { status, headers: { Location: location } });
}

beforeEach(async () => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  ({ GET } = await import("@/app/api/satellite/route"));
});

const GOES16 = "https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/678x678.jpg";
const GOES19 = "https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/678x678.jpg";

describe("GET /api/satellite", () => {
  it("proxies an allowlisted image", async () => {
    fetchMock.mockResolvedValueOnce(imageResponse());
    const response = await GET(requestFor(GOES19));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("follows a retired-satellite redirect within the allowlist", async () => {
    // NOAA permanently redirects GOES16 to GOES19; refusing this killed the
    // homepage GOES East panel.
    fetchMock.mockResolvedValueOnce(redirectTo(GOES19)).mockResolvedValueOnce(imageResponse());
    const response = await GET(requestFor(GOES16));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(GOES19);
  });

  it("refuses a redirect that leaves the allowlist", async () => {
    fetchMock.mockResolvedValueOnce(redirectTo("https://evil.example/payload.jpg"));
    const response = await GET(requestFor(GOES19));
    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses a redirect that downgrades to http", async () => {
    fetchMock.mockResolvedValueOnce(redirectTo("http://cdn.star.nesdis.noaa.gov/x.jpg"));
    const response = await GET(requestFor(GOES19));
    expect(response.status).toBe(403);
  });

  it("stops after a bounded number of redirects", async () => {
    fetchMock.mockResolvedValue(redirectTo(GOES19));
    const response = await GET(requestFor(GOES16));
    expect(response.status).toBe(502);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(5);
  });

  it("rejects a host that is not allowlisted", async () => {
    const response = await GET(requestFor("https://evil.example/a.jpg"));
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an upstream response that is not an image", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>", { status: 200, headers: { "Content-Type": "text/html" } }),
    );
    const response = await GET(requestFor(GOES19));
    expect(response.status).toBe(502);
  });
});
