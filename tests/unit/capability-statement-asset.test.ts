import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CAPABILITY_STATEMENT_REQUEST_HREF } from "@/lib/constants";

const ROOT = join(__dirname, "..", "..");

describe("capability statement asset", () => {
  it("is present for the API route to read", () => {
    expect(existsSync(join(ROOT, "private", "capability-statement.pdf"))).toBe(true);
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
