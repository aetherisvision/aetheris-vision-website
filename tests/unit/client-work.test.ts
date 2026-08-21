import { describe, it, expect } from "vitest";
import { clientWork } from "@/lib/client-work";

describe("client-work", () => {
  it("lists at least one delivered engagement", () => {
    expect(clientWork.length).toBeGreaterThan(0);
  });

  it("each case study has required fields and a live https URL", () => {
    for (const cs of clientWork) {
      expect(cs.title).toBeTruthy();
      expect(cs.client).toBeTruthy();
      expect(cs.desc).toBeTruthy();
      expect(cs.stack).toBeTruthy();
      expect(cs.industry).toBeTruthy();
      expect(cs.image).toMatch(/^\/images\/portfolio\/.+\.webp$/);
      expect(cs.url).toMatch(/^https:\/\//);
    }
  });

  it("contains no fabricated demo entries", () => {
    // The retired demo catalogue used invented business names. Guard against
    // any of them creeping back in as if they were real client work.
    const retired = [
      "Mitchell & Associates",
      "Casa Verde",
      "Summit Ridge",
      "Okonkwo",
    ];
    for (const cs of clientWork) {
      for (const name of retired) {
        expect(cs.client.toLowerCase()).not.toContain(name.toLowerCase());
      }
    }
  });
});
