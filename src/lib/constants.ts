export const SITE = {
  name: "Aetheris Vision",
  legalName: "Aetheris Vision LLC",
  tagline: "Scientific consulting for weather, Earth-system, and geospatial decisions",
  url: "https://aetherisvision.com",
  logoUrl: "https://aetherisvision.com/logo/av-logo-horizontal-dark.png",
  email: "contact@aetherisvision.com",
  description:
    "Principal-led scientific and technical consulting for organizations making difficult weather, Earth-system, geospatial, and data-informed decisions.",
  ogDescription:
    "Principal-led consulting for weather, Earth-system, geospatial, applied-AI, and technical-delivery decisions. Veteran-owned and based in Oklahoma.",
} as const;

/** Public request flow for the current capability statement PDF. */
export const CAPABILITY_STATEMENT_REQUEST_HREF =
  "/contact?requirement=Capability%20Statement%20Request&topic=Please%20send%20me%20the%20Aetheris%20Vision%20capability%20statement.#contact-form";

/** Public AMS Weather and Climate Directory listing for Aetheris Vision LLC. */
export const AMS_PROFILE_URL =
  "https://wcdirectory.ametsoc.org/united-states/mustang/service-provider/aetheris-vision-llc";

/** Federal contracting registration data */
export const SAM = {
  uei: "ZM8QWJ4ABWZ9",
  cage: "20SQ1",
  naicsPrimary: "541690",
  setAside: "SDVOSB/VOSB and HUBZone certifications pending",
  // Single source of truth for set-aside status badges. Never state a
  // certification is held until VetCert / HUBZone certification is issued.
  setAsidePills: ["SDVOSB / VOSB — VetCert pending", "HUBZone Eligible"],
  samUrl: "https://sam.gov",
} as const;
