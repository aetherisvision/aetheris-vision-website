import { createHmac } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

const previewPassword = process.env.PREVIEW_PASSWORD;
const previewCookies = previewPassword
  ? [
      {
        name: "av-preview-session",
        value: createHmac("sha256", previewPassword)
          .update("preview-session")
          .digest("hex"),
        domain: "127.0.0.1",
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
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
