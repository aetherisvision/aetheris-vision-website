import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CAPABILITY_STATEMENT_REQUEST_HREF } from "@/lib/constants";

const ROOT = join(__dirname, "..", "..");
const CAPABILITY_STATEMENT_PATH = join(ROOT, "private", "capability-statement.pdf");
const CURRENT_CERTIFIED_RELEASE_SHA256 =
  "336fd8a83d9a46045515ea9673fe0f34db534888273608a1c3362be129bfa29e";

describe("capability statement asset", () => {
  it("is present for the API route to read", () => {
    expect(existsSync(CAPABILITY_STATEMENT_PATH)).toBe(true);
  });

  it("is the current SBA-certified release", () => {
    const digest = createHash("sha256")
      .update(readFileSync(CAPABILITY_STATEMENT_PATH))
      .digest("hex");

    expect(digest).toBe(CURRENT_CERTIFIED_RELEASE_SHA256);
  });

  it("is never served as a static file", () => {
    // Publishing it under public/ would make it directly fetchable and would
    // bypass both the delivery record and the site lock.
    expect(existsSync(join(ROOT, "public", "capability-statement.pdf"))).toBe(false);
    expect(existsSync(join(ROOT, "public", "aetheris-vision-capability-statement.pdf"))).toBe(false);
  });

  it("routes visitors to the on-site request form", () => {
    expect(CAPABILITY_STATEMENT_REQUEST_HREF).toBe("/capabilities#capability-statement");
  });
});
