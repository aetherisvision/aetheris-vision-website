import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  putGcsReceipt: vi.fn(),
  isValidReceiptPathname: vi.fn((p: unknown) => typeof p === "string" && /^receipts\/[A-Za-z0-9._/-]{1,200}$/.test(p) && !p.includes("..")),
  isFirestoreExpenseStoreConfigured: vi.fn(() => false),
  recordFirestoreReceiptMetadata: vi.fn(),
}));

vi.mock("@/lib/receipt-gcs", () => ({
  putGcsReceipt: mocks.putGcsReceipt,
  isValidReceiptPathname: mocks.isValidReceiptPathname,
}));

vi.mock("@/lib/expense-firestore", () => ({
  isFirestoreExpenseStoreConfigured: mocks.isFirestoreExpenseStoreConfigured,
  recordFirestoreReceiptMetadata: mocks.recordFirestoreReceiptMetadata,
}));

let putReceipt: typeof import("@/lib/receipt-blob").putReceipt;

beforeEach(async () => {
  vi.resetModules();
  mocks.putGcsReceipt.mockReset();
  mocks.recordFirestoreReceiptMetadata.mockReset();
  mocks.isFirestoreExpenseStoreConfigured.mockReturnValue(false);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  ({ putReceipt } = await import("@/lib/receipt-blob"));
});

const PATH = "receipts/abc.pdf";

describe("putReceipt (GCS + Firestore metadata)", () => {
  it("stores privately in GCS and returns the gated viewer path", async () => {
    mocks.putGcsReceipt.mockResolvedValueOnce({
      bucket: "private-crm-test",
      objectPath: PATH,
      gcsUri: "gs://private-crm-test/receipts/abc.pdf",
      contentType: "application/pdf",
      sizeBytes: 1,
      sha256: "a".repeat(64),
    });

    const result = await putReceipt(PATH, Buffer.from("x"), "application/pdf");

    expect(mocks.putGcsReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.putGcsReceipt).toHaveBeenCalledWith(PATH, Buffer.from("x"), "application/pdf");
    expect(result).toEqual({
      reference: "/api/receipts/file?path=receipts%2Fabc.pdf",
      isPrivate: true,
      object: {
        bucket: "private-crm-test",
        objectPath: PATH,
        gcsUri: "gs://private-crm-test/receipts/abc.pdf",
        contentType: "application/pdf",
        sizeBytes: 1,
        sha256: "a".repeat(64),
      },
    });
    expect(mocks.recordFirestoreReceiptMetadata).not.toHaveBeenCalled();
  });

  it("records structured receipt metadata in Firestore when configured", async () => {
    mocks.isFirestoreExpenseStoreConfigured.mockReturnValue(true);
    mocks.putGcsReceipt.mockResolvedValueOnce({
      bucket: "private-crm-test",
      objectPath: PATH,
      gcsUri: "gs://private-crm-test/receipts/abc.pdf",
      contentType: "application/pdf",
      sizeBytes: 42,
      sha256: "b".repeat(64),
    });
    mocks.recordFirestoreReceiptMetadata.mockResolvedValueOnce({});

    const result = await putReceipt(PATH, Buffer.from("x"), "application/pdf", {
      source: "gmail-cron",
      gmailMessageId: "msg-123",
    });

    expect(result.isPrivate).toBe(true);
    expect(mocks.recordFirestoreReceiptMetadata).toHaveBeenCalledWith({
      object_path: PATH,
      bucket: "private-crm-test",
      gcs_uri: "gs://private-crm-test/receipts/abc.pdf",
      view_url: "/api/receipts/file?path=receipts%2Fabc.pdf",
      content_type: "application/pdf",
      size_bytes: 42,
      sha256: "b".repeat(64),
      source: "gmail-cron",
      gmail_message_id: "msg-123",
    });
  });

  it("rejects paths outside the receipts prefix before touching storage", async () => {
    for (const badPath of ["oauth/tokens.json", "../../secrets", "receipts/../oauth", ""]) {
      await expect(putReceipt(badPath, Buffer.from("x"), "application/pdf")).rejects.toThrow(
        "Invalid receipt path",
      );
    }
    expect(mocks.putGcsReceipt).not.toHaveBeenCalled();
  });

  it.each([
    ["a permission failure", Object.assign(new Error("Forbidden"), { code: 403 })],
    ["a storage outage", Object.assign(new Error("Service Unavailable"), { code: 503 })],
    ["a precondition collision", Object.assign(new Error("Precondition Failed"), { code: 412 })],
    ["an unknown failure", new Error("socket hang up")],
  ])("never downgrades a receipt to public on %s", async (_label, error) => {
    mocks.putGcsReceipt.mockRejectedValueOnce(error);
    await expect(putReceipt(PATH, Buffer.from("x"), "application/pdf")).rejects.toThrow();
    expect(mocks.putGcsReceipt).toHaveBeenCalledTimes(1);
  });
});
