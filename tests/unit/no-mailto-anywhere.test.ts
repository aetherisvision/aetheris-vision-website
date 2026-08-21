import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

/**
 * Anti-scraping contract, whole-site edition. The feature test covers Footer
 * and Privacy; this walks every public page, component, and content file so a
 * demo page or a new route cannot reintroduce a mailto: link or a live-looking
 * address. Admin screens and outbound transactional email (src/app/admin,
 * src/app/api) are operator-facing and exempt.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mdx?)$/.test(name)) out.push(p);
  }
  return out;
}

const ROOT = join(__dirname, "..", "..", "src");
const EXEMPT = [`${sep}app${sep}admin${sep}`, `${sep}app${sep}api${sep}`];
// src/lib holds outbound-mail helpers with legitimate From/Reply-To addresses;
// only its rendered content (articles, portfolio data) is in scope.
const files = [
  ...walk(join(ROOT, "app")),
  ...walk(join(ROOT, "components")),
  ...walk(join(ROOT, "lib", "insights")),
  join(ROOT, "lib", "portfolio-data.ts"),
].filter((f) => !EXEMPT.some((e) => f.includes(e)));

describe("no scrapeable email on the public site", () => {
  it("renders no mailto: links", () => {
    const mailtoHref = /href=\s*(["'`{]|\{`)\s*mailto:/i;
    const offenders = files.filter((f) => mailtoHref.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("renders no address on a real-looking domain (demo addresses use example.com)", () => {
    const email = /\b[A-Za-z0-9._%+-]+@(?!example\.com\b)[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[a-z]{2,}\b/;
    const offenders = files.filter((f) => email.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
