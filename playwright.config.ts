import { createHmac } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

const previewPassword = process.env.PREVIEW_PASSWORD;
const chromiumChannel =
  process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1" ? "chrome" : "chromium";
const previewCookies = previewPassword
  ? [
      {
        name: "av-preview-session",
        value: createHmac("sha256", previewPassword)
          .update("preview-session")
          .digest("hex"),
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
        expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    ]
  : [];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    storageState: { cookies: previewCookies, origins: [] },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: chromiumChannel },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], channel: chromiumChannel },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "compact-phone",
      use: {
        ...devices["Desktop Chrome"],
        channel: chromiumChannel,
        viewport: { width: 320, height: 568 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        channel: chromiumChannel,
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
