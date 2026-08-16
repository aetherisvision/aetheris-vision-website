import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = path.resolve(process.cwd(), "scripts/check-env.js");

const checkedKeys = [
  "DATABASE_URL",
  "ADMIN_PASSPHRASE",
  "NEXTAUTH_SECRET",
  "AUTH_SECRET",
  "RESEND_API_KEY",
  "CONTACT_VERIFICATION_SECRET",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "CRON_SECRET",
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "PREVIEW_PASSWORD",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "DOCUSEAL_API_KEY",
  "DOCUSEAL_WEBHOOK_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_BLOG_SUBSCRIBE_URL",
  "NEXT_PUBLIC_GISCUS_REPO",
  "NEXT_PUBLIC_GISCUS_REPO_ID",
  "NEXT_PUBLIC_GISCUS_CATEGORY",
  "NEXT_PUBLIC_GISCUS_CATEGORY_ID",
] as const;

const productionValues = {
  DATABASE_URL: "sentinel-database-value",
  ADMIN_PASSPHRASE: "sentinel-admin-value",
  NEXTAUTH_SECRET: "sentinel-auth-value",
  RESEND_API_KEY: "sentinel-resend-value",
  CONTACT_VERIFICATION_SECRET:
    "sentinel-contact-verification-secret-at-least-32-bytes",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "sentinel-turnstile-site-key",
  TURNSTILE_SECRET_KEY: "sentinel-turnstile-secret-key",
  UPSTASH_REDIS_REST_URL: "https://sentinel-upstash.example.test",
  UPSTASH_REDIS_REST_TOKEN: "sentinel-upstash-token",
  DOCUSEAL_API_KEY: "sentinel-docuseal-api-key",
  DOCUSEAL_WEBHOOK_SECRET: "sentinel-docuseal-webhook-secret",
  STRIPE_SECRET_KEY: "sentinel-stripe-secret-value",
  STRIPE_WEBHOOK_SECRET: "sentinel-stripe-webhook-value",
  CRON_SECRET: "sentinel-cron-value",
  GMAIL_CLIENT_ID: "sentinel-gmail-id-value",
  GMAIL_CLIENT_SECRET: "sentinel-gmail-secret-value",
} as const;

type EnvironmentOverrides = Record<string, string | undefined>;

function testEnvironment(
  overrides: EnvironmentOverrides = {}
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? "test",
    VERCEL_ENV: "preview",
  };

  for (const key of checkedKeys) {
    environment[key] = "";
  }

  return { ...environment, ...overrides };
}

function runPreflight(
  args: string[] = [],
  overrides: EnvironmentOverrides = {}
) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: "utf8",
    env: testEnvironment(overrides),
  });
}

describe("production environment preflight", () => {
  it("fails a production check and reports names, never values", () => {
    const result = runPreflight(["--production"], {
      DATABASE_URL: productionValues.DATABASE_URL,
    });
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain("ADMIN_PASSPHRASE");
    expect(output).toContain("NEXTAUTH_SECRET or AUTH_SECRET");
    expect(output).toContain("GMAIL_CLIENT_SECRET");
    expect(output).toContain("CONTACT_VERIFICATION_SECRET");
    expect(output).toContain("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    expect(output).toContain("UPSTASH_REDIS_REST_TOKEN");
    expect(output).toContain("DOCUSEAL_WEBHOOK_SECRET");
    expect(output).not.toContain(productionValues.DATABASE_URL);
  });

  it("passes when all required production variables are present", () => {
    const result = runPreflight(["--production"], productionValues);
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain("Required production configuration is present");
    for (const value of Object.values(productionValues)) {
      expect(output).not.toContain(value);
    }
  });

  it("accepts AUTH_SECRET as the supported client-auth alternative", () => {
    const result = runPreflight(["--production"], {
      ...productionValues,
      NEXTAUTH_SECRET: "",
      AUTH_SECRET: "sentinel-auth-alternative-value",
    });

    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).not.toContain(
      "sentinel-auth-alternative-value"
    );
  });

  it("does not block local or preview builds when production config is absent", () => {
    const result = runPreflight();

    expect(result.status).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "Production-only configuration is incomplete"
    );
  });

  it("automatically enforces production requirements on Vercel production", () => {
    const result = runPreflight([], { VERCEL_ENV: "production" });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "Production preflight failed"
    );
  });
});
