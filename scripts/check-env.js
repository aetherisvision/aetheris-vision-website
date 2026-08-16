#!/usr/bin/env node

/**
 * Deployment environment preflight.
 *
 * Production mode is enabled explicitly with `--production` or automatically
 * for a Vercel production build. The check reports variable names only; it
 * never prints environment-variable values.
 */

const productionRequirements = [
  {
    label: "Database",
    allOf: ["DATABASE_URL"],
  },
  {
    label: "Admin authentication",
    allOf: ["ADMIN_PASSPHRASE"],
  },
  {
    label: "Client authentication",
    anyOf: ["NEXTAUTH_SECRET", "AUTH_SECRET"],
  },
  {
    label: "Transactional email",
    allOf: ["RESEND_API_KEY"],
  },
  {
    label: "Public form verification",
    allOf: [
      "CONTACT_VERIFICATION_SECRET",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "TURNSTILE_SECRET_KEY",
    ],
  },
  {
    label: "Distributed public-form rate limiting",
    allOf: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  },
  {
    label: "DocuSeal contract lifecycle",
    allOf: ["DOCUSEAL_API_KEY", "DOCUSEAL_WEBHOOK_SECRET"],
  },
  {
    label: "Stripe billing",
    allOf: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  },
  {
    label: "Scheduled receipt ingestion",
    allOf: ["CRON_SECRET", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET"],
  },
];

const optionalRequirements = [
  {
    label: "Public preview gate",
    allOf: ["PREVIEW_PASSWORD"],
  },
  {
    label: "Blog subscription",
    allOf: ["NEXT_PUBLIC_BLOG_SUBSCRIBE_URL"],
  },
  {
    label: "Blog comments (Giscus)",
    allOf: [
      "NEXT_PUBLIC_GISCUS_REPO",
      "NEXT_PUBLIC_GISCUS_REPO_ID",
      "NEXT_PUBLIC_GISCUS_CATEGORY",
      "NEXT_PUBLIC_GISCUS_CATEGORY_ID",
    ],
  },
];

function isConfigured(environment, key) {
  const value = environment[key];
  return typeof value === "string" && value.trim().length > 0;
}

function findMissing(requirements, environment) {
  return requirements
    .map((requirement) => {
      const missing = (requirement.allOf ?? []).filter(
        (key) => !isConfigured(environment, key)
      );
      const alternatives = requirement.anyOf ?? [];
      const missingAlternatives =
        alternatives.length > 0 &&
        !alternatives.some((key) => isConfigured(environment, key))
          ? alternatives
          : [];

      return {
        label: requirement.label,
        missing,
        missingAlternatives,
      };
    })
    .filter(
      (requirement) =>
        requirement.missing.length > 0 ||
        requirement.missingAlternatives.length > 0
    );
}

function printMissing(prefix, missingRequirements, logger) {
  for (const requirement of missingRequirements) {
    logger(`\n[env-check] ${prefix} ${requirement.label}:`);

    for (const key of requirement.missing) {
      logger(`  - ${key}`);
    }

    if (requirement.missingAlternatives.length > 0) {
      logger(`  - one of: ${requirement.missingAlternatives.join(" or ")}`);
    }
  }
}

function run(environment = process.env, args = process.argv.slice(2)) {
  const isProduction =
    args.includes("--production") || environment.VERCEL_ENV === "production";
  const missingProduction = findMissing(productionRequirements, environment);
  const missingOptional = findMissing(optionalRequirements, environment);

  if (isProduction && missingProduction.length > 0) {
    console.error(
      "[env-check] Production preflight failed. Required configuration is missing."
    );
    printMissing("Required for", missingProduction, console.error);
    console.error(
      "\n[env-check] Add the named variables to the production environment and retry."
    );
    return 1;
  }

  if (isProduction) {
    console.log("[env-check] Required production configuration is present.");
  } else if (missingProduction.length > 0) {
    console.warn(
      "[env-check] Production-only configuration is incomplete; local and preview builds remain available."
    );
    printMissing("Production", missingProduction, console.warn);
  }

  if (missingOptional.length > 0) {
    console.warn("\n[env-check] Optional feature configuration is incomplete.");
    printMissing("Optional", missingOptional, console.warn);
  } else {
    console.log("[env-check] Optional feature configuration is present.");
  }

  return 0;
}

if (require.main === module) {
  process.exitCode = run();
}

module.exports = {
  findMissing,
  isConfigured,
  optionalRequirements,
  productionRequirements,
  run,
};
