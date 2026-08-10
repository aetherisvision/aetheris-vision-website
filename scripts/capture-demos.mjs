// One-off capture script (slice 3): screenshots each portfolio demo route
// from the local dev server and writes optimized WebP card images.
// Usage: node scripts/capture-demos.mjs [baseUrl]
import { chromium } from "playwright-core";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = "public/images/portfolio";
const SLUGS = [
  "law-firm", "restaurant", "trades-contractor", "veteran-nonprofit",
  "analytics-dashboard", "international-market", "portal-pro", "healthcare",
  "wp-editorial", "real-estate", "fitness", "photography-studio",
];

mkdirSync(OUT, { recursive: true });
// Playwright resolves its own browser; set PW_CHROMIUM_PATH to override
// (e.g. to reuse a cached Chromium without running `npx playwright install`).
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const slug of SLUGS) {
  await page.goto(`${BASE}/portfolio/${slug}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500); // let fade-in animations settle
  // Strip page chrome that doesn't belong in card art: the demo banner
  // (innermost matching div) and the Next.js dev overlay.
  await page.waitForSelector('button[aria-label="Open chat"]', { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => {
    [...document.querySelectorAll("div")]
      .filter((d) => d.textContent?.trim().startsWith("✦ DEMO SITE"))
      .pop()
      ?.remove();
    document.querySelector('button[aria-label="Open chat"]')?.remove();
    document.querySelector("nextjs-portal")?.remove();
  });
  await page.waitForTimeout(200);
  const png = await page.screenshot({ type: "png" });
  const out = `${OUT}/${slug}.webp`;
  await sharp(png).resize(1200).webp({ quality: 78 }).toFile(out);
  console.log("captured", out);
}

await browser.close();
