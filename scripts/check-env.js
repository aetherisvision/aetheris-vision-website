#!/usr/bin/env node

const requiredGroups = [
  {
    label: "Blog subscription",
    keys: ["NEXT_PUBLIC_BLOG_SUBSCRIBE_URL"],
  },
  {
    label: "Blog comments (Giscus)",
    keys: [
      "NEXT_PUBLIC_GISCUS_REPO",
      "NEXT_PUBLIC_GISCUS_REPO_ID",
      "NEXT_PUBLIC_GISCUS_CATEGORY",
      "NEXT_PUBLIC_GISCUS_CATEGORY_ID",
    ],
  },
];

const missingByGroup = requiredGroups
  .map((group) => ({
    label: group.label,
    missing: group.keys.filter((key) => {
      const value = process.env[key];
      return !value || value.trim().length === 0;
    }),
  }))
  .filter((group) => group.missing.length > 0);

if (missingByGroup.length === 0) {
  console.log("[env-check] Blog environment variables are configured.");
  process.exit(0);
}

console.warn("[env-check] Some optional blog environment variables are missing.");

for (const group of missingByGroup) {
  console.warn(`\n[env-check] ${group.label}:`);
  for (const key of group.missing) {
    console.warn(`  - ${key}`);
  }
}

console.warn(
  "\n[env-check] The site will still build, but subscription/comments may be hidden or fallback-only."
);

process.exit(0);