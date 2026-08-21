import { beforeEach, describe, expect, it, vi } from "vitest";

const put = vi.hoisted(() => vi.fn());

class BlobError extends Error {}
class BlobAccessError extends BlobError {}
class BlobServiceRateLimited extends BlobError {}
class BlobServiceNotAvailable extends BlobError {}
class BlobStoreSuspendedError extends BlobError {}
class BlobStoreNotFoundError extends BlobError {}
class BlobClientTokenExpiredError extends BlobError {}
class BlobPreconditionFailedError extends BlobError {}
class BlobRequestAbortedError extends BlobError {}

vi.mock("@vercel/blob", () => ({
  put,
  BlobAccessError,
  BlobServiceRateLimited,
  BlobServiceNotAvailable,
  BlobStoreSuspendedError,
  BlobStoreNotFoundError,
  BlobClientTokenExpiredError,
  BlobPreconditionFailedError,
  BlobRequestAbortedError,
}));

let putReceipt: typeof import("@/lib/receipt-blob").putReceipt;

beforeEach(async () => {
  vi.resetModules();
  put.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  ({ putReceipt } = await import("@/lib/receipt-blob"));
});

const PATH = "receipts/abc.pdf";

describe("putReceipt", () => {
  it("stores privately and returns the gated viewer path", async () => {
    put.mockResolvedValueOnce({ url: "https://blob.example/x" });
    const result = await putReceipt(PATH, Buffer.from("x"), "application/pdf");

    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0][2]).toMatchObject({ access: "private" });
    expect(result).toEqual({
      reference: "/api/receipts/file?path=receipts%2Fabc.pdf",
      isPrivate: true,
    });
  });

  it("falls back to public only when the store cannot do private at all", async () => {
    put
      .mockRejectedValueOnce(new BlobAccessError("private access is not enabled for this store"))
      .mockResolvedValueOnce({ url: "https://blob.example/receipts/abc-9f2.pdf" });

    const result = await putReceipt(PATH, Buffer.from("x"), "application/pdf");
    expect(put).toHaveBeenCalledTimes(2);
    expect(put.mock.calls[1][2]).toMatchObject({ access: "public", addRandomSuffix: true });
    expect(result).toEqual({
      reference: "https://blob.example/receipts/abc-9f2.pdf",
      isPrivate: false,
    });
  });

  it.each([
    ["a rate limit", new BlobServiceRateLimited("too many requests")],
    ["an outage", new BlobServiceNotAvailable("service unavailable")],
    ["a suspended store", new BlobStoreSuspendedError("store suspended")],
    ["a missing store", new BlobStoreNotFoundError("store not found")],
    ["an expired token", new BlobClientTokenExpiredError("token expired")],
    ["a pathname collision", new BlobPreconditionFailedError("blob already exists")],
    ["an aborted request", new BlobRequestAbortedError("aborted")],
    ["an unknown failure", new Error("socket hang up")],
  ])("never publishes a receipt because of %s", async (_label, error) => {
    put.mockRejectedValueOnce(error);
    await expect(putReceipt(PATH, Buffer.from("x"), "application/pdf")).rejects.toThrow();
    // Critically: no second, public write.
    expect(put).toHaveBeenCalledTimes(1);
  });

  it("does not treat an outage as a private-support problem even if it says 'private'", async () => {
    put.mockRejectedValueOnce(new BlobServiceNotAvailable("private store temporarily unavailable"));
    await expect(putReceipt(PATH, Buffer.from("x"))).rejects.toThrow();
    expect(put).toHaveBeenCalledTimes(1);
  });
});
