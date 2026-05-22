export const SITE = {
  name: "Aetheris Vision",
  legalName: "Aetheris Vision LLC",
  tagline: "Custom Websites & AI Solutions for Oklahoma Businesses",
  url: "https://aetherisvision.com",
  logoUrl: "https://aetherisvision.com/logo/av-logo-horizontal-dark.png",
  email: "contact@aetherisvision.com",
  description:
    "Aetheris Vision builds custom websites, web applications, and AI-powered systems for Oklahoma businesses and government agencies. Veteran-owned. Based in Mustang, OK.",
  ogDescription:
    "Custom websites, web apps, and client portals for Oklahoma businesses — and AI-powered atmospheric intelligence for government agencies. No templates. No outsourcing. Veteran-owned, based in Mustang, OK.",
} as const;

/** Federal contracting registration data — update when CAGE is assigned */
export const SAM = {
  uei: "ZM8QWJ4ABWZ9",
  cage: null as string | null, // assigned after CAGE review completes
  naicsPrimary: "541690",
  setAside: "SDVOSB / VOSB",
  samUrl: "https://sam.gov",
  federalEmail: "marston@aetherisvision.com",
} as const;
