import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

// The submit/status routes call out to og-server via omni-gridder-client
// (WIF-authenticated fetches to a real Cloud Run service) — mock that
// boundary the same way contact-api.test.ts mocks the Resend SDK, so these
// tests exercise only this app's request-handling logic (allowlists, dedupe,
// chaining) without a live og-server.
const { submitJobMock, getJobStatusMock, triggerWorkerRunMock } = vi.hoisted(() => ({
  submitJobMock: vi.fn(),
  getJobStatusMock: vi.fn(),
  triggerWorkerRunMock: vi.fn(),
}));

vi.mock("@/lib/omni-gridder-client", () => ({
  submitJob: submitJobMock,
  getJobStatus: getJobStatusMock,
  triggerWorkerRun: triggerWorkerRunMock,
}));

const TEST_PASSPHRASE = "super-secret-test-passphrase";
const TEST_BUCKET = "test-staging-bucket";
const TEST_INPUT_URI = "gs://esmai-dev-esmai-objects/demo/hgt500_2026070706_f006.nc";

function hmacToken(passphrase: string): string {
  return createHmac("sha256", passphrase).update("admin-session").digest("hex");
}

function adminHeaders(ip: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Cookie: `av-admin-session=${hmacToken(TEST_PASSPHRASE)}`,
    "x-forwarded-for": ip,
  };
}

function makeSubmitRequest(body: Record<string, unknown>, ip: string): NextRequest {
  return new NextRequest("http://localhost/api/admin/omni-gridder/submit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: adminHeaders(ip),
  });
}

async function importSubmitRoute() {
  return import("@/app/api/admin/omni-gridder/submit/route");
}

async function importStatusRoute() {
  return import("@/app/api/admin/omni-gridder/status/[jobId]/route");
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("ADMIN_PASSPHRASE", TEST_PASSPHRASE);
  vi.stubEnv("OG_GCS_STAGING_BUCKET", TEST_BUCKET);
  vi.stubEnv("OG_DEMO_INPUT_URIS", TEST_INPUT_URI);
  submitJobMock.mockReset();
  submitJobMock.mockResolvedValue(undefined);
  getJobStatusMock.mockReset();
  triggerWorkerRunMock.mockReset();
  triggerWorkerRunMock.mockResolvedValue({ triggered: true });
});

describe("POST /api/admin/omni-gridder/submit", () => {
  it("rejects an invalid method with 400", async () => {
    const { POST } = await importSubmitRoute();
    const req = makeSubmitRequest({ methods: ["not-a-real-method"] }, "1.1.1.1");
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid method/i);
    expect(submitJobMock).not.toHaveBeenCalled();
  });

  it("dedupes duplicate methods into a single job per unique method", async () => {
    const { POST } = await importSubmitRoute();
    const req = makeSubmitRequest(
      { methods: ["bilinear", "bilinear", "nearest", "bilinear"] },
      "1.1.1.2",
    );
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { jobs: { jobId: string; method: string }[] };
    // One job per unique method, not one per requested entry.
    expect(body.jobs).toHaveLength(2);
    expect(body.jobs.map((j) => j.method).sort()).toEqual(["bilinear", "nearest"]);

    // Job IDs are unique — the earlier bug submitted the same jobId twice.
    const jobIds = body.jobs.map((j) => j.jobId);
    expect(new Set(jobIds).size).toBe(jobIds.length);

    // og-server only sees the deduped set (2 calls), not 4.
    expect(submitJobMock).toHaveBeenCalledTimes(2);
  });

  it("does not treat a deduped list as 'too many methods'", async () => {
    // Every valid method repeated — dedupes down to 3 (<= VALID_METHODS.length)
    // and must not trip the "too many methods" guard.
    const { POST } = await importSubmitRoute();
    const req = makeSubmitRequest(
      {
        methods: [
          "bilinear",
          "bilinear",
          "nearest",
          "nearest",
          "conservative",
          "conservative",
        ],
      },
      "1.1.1.3",
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { jobs: { jobId: string; method: string }[] };
    expect(body.jobs).toHaveLength(3);
  });

  it("rejects a non-allowlisted input URI with 400", async () => {
    const { POST } = await importSubmitRoute();
    const req = makeSubmitRequest(
      { methods: ["bilinear"], inputUri: "gs://someone-elses-bucket/arbitrary.nc" },
      "1.1.1.4",
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/allowlist/i);
    expect(submitJobMock).not.toHaveBeenCalled();
  });

  it("accepts an allowlisted input URI", async () => {
    const { POST } = await importSubmitRoute();
    const req = makeSubmitRequest(
      { methods: ["bilinear"], inputUri: TEST_INPUT_URI },
      "1.1.1.5",
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inputUri).toBe(TEST_INPUT_URI);
  });

  it("returns 401 without a valid admin cookie", async () => {
    const { POST } = await importSubmitRoute();
    const req = new NextRequest("http://localhost/api/admin/omni-gridder/submit", {
      method: "POST",
      body: JSON.stringify({ methods: ["bilinear"] }),
      headers: { "Content-Type": "application/json", "x-forwarded-for": "1.1.1.6" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(submitJobMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/omni-gridder/status/[jobId] — chainPlot gating", () => {
  const baseStatus = {
    job_id: "demo-batch-bilinear",
    processor_type: "regrid",
    status: "succeeded" as const,
    submitted_at: Date.now(),
    result_uri: "https://signed.example/output.nc",
    error_message: null,
    diagnostics: null,
  };

  it("chains exactly one Plot job when chainPlot=1 and the regrid job succeeded", async () => {
    getJobStatusMock.mockResolvedValue(baseStatus);
    const { GET } = await importStatusRoute();

    const req = new NextRequest(
      `http://localhost/api/admin/omni-gridder/status/${baseStatus.job_id}?chainPlot=1`,
      { headers: adminHeaders("1.1.2.1") },
    );
    const res = await GET(req, { params: Promise.resolve({ jobId: baseStatus.job_id }) });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { nextJobId?: string };
    expect(body.nextJobId).toBe(`${baseStatus.job_id}-plot`);

    // Exactly one plot job submitted for this poller — the mechanism that
    // keeps a 3-method comparison batch to one rendered plot.
    expect(submitJobMock).toHaveBeenCalledTimes(1);
    expect(submitJobMock).toHaveBeenCalledWith(
      expect.objectContaining({ job_id: `${baseStatus.job_id}-plot`, processor_type: "plot" }),
    );
  });

  it("does not chain a Plot job when chainPlot is not requested", async () => {
    getJobStatusMock.mockResolvedValue(baseStatus);
    const { GET } = await importStatusRoute();

    const req = new NextRequest(
      `http://localhost/api/admin/omni-gridder/status/${baseStatus.job_id}`,
      { headers: adminHeaders("1.1.2.2") },
    );
    const res = await GET(req, { params: Promise.resolve({ jobId: baseStatus.job_id }) });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { nextJobId?: string };
    expect(body.nextJobId).toBeUndefined();
    expect(submitJobMock).not.toHaveBeenCalled();
  });

  it("does not chain a Plot job for a still-processing regrid job even with chainPlot=1", async () => {
    getJobStatusMock.mockResolvedValue({ ...baseStatus, status: "processing", result_uri: null });
    const { GET } = await importStatusRoute();

    const req = new NextRequest(
      `http://localhost/api/admin/omni-gridder/status/${baseStatus.job_id}?chainPlot=1`,
      { headers: adminHeaders("1.1.2.3") },
    );
    const res = await GET(req, { params: Promise.resolve({ jobId: baseStatus.job_id }) });
    expect(res.status).toBe(200);
    expect(submitJobMock).not.toHaveBeenCalled();
  });
});
