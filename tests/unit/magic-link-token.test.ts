import { describe, it, expect } from "vitest";
import { hashMagicLinkToken } from "@/lib/magic-link-token";

/**
 * Guards #9: magic-link tokens are stored only as a SHA-256 hash. The mint path
 * (send-magic-link.ts) and the verify path (/api/auth/magic) both run the token
 * through this helper, so its determinism is what makes a login succeed while a
 * DB read of the stored hash stays useless to an attacker.
 */
describe("hashMagicLinkToken", () => {
  it("is deterministic for the same token (mint hash === verify hash)", () => {
    const token = "fixed-token-deadbeefdeadbeefdeadbeefdeadbeef";
    expect(hashMagicLinkToken(token)).toBe(hashMagicLinkToken(token));
  });

  it("produces a 64-char hex SHA-256 digest", () => {
    const hash = hashMagicLinkToken("any-token");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("matches a known SHA-256 vector", () => {
    // sha256("abc")
    expect(hashMagicLinkToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("does not return the plaintext token, and differs for different tokens", () => {
    const a = "token-aaaa1111aaaa1111aaaa1111aaaa1111";
    const b = "token-bbbb2222bbbb2222bbbb2222bbbb2222";
    expect(hashMagicLinkToken(a)).not.toBe(a);
    expect(hashMagicLinkToken(a)).not.toBe(hashMagicLinkToken(b));
  });
});
