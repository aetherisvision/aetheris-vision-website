export const SITE = {
  name: "Aetheris Vision",
  legalName: "Aetheris Vision LLC",
  tagline: "Applied meteorology, weather AI, GIS, and geospatial data",
  url: "https://aetherisvision.com",
  logoUrl: "https://aetherisvision.com/logo/av-logo-horizontal-dark.png",
  email: "contact@aetherisvision.com",
  // Business NAP — must stay byte-identical to the Google Business Profile
  // listing and SAM.gov ("PMB", never "#" or "Suite"). Deliberately no phone
  // constant: nothing public renders one.
  address: {
    street: "210 N Mustang Mall Terrace PMB 29",
    locality: "Mustang",
    region: "OK",
    postalCode: "73064",
    country: "US",
  },
  description:
    "Principal-led scientific consulting in applied meteorology, AI weather forecasting, GIS, geospatial regridding, Earth-system data, and scientific software.",
  ogDescription:
    "Applied meteorology, AI weather forecasting, GIS, geospatial regridding, and Earth-system data consulting. Veteran-owned and based in Oklahoma.",
} as const;

/** Public request flow for the current capability statement PDF. */
export const CAPABILITY_STATEMENT_REQUEST_HREF =
  "/contact?requirement=Capability%20Statement%20Request&topic=Please%20send%20me%20the%20Aetheris%20Vision%20capability%20statement.#contact-form";

/** Public AMS Weather and Climate Directory listing for Aetheris Vision LLC. */
export const AMS_PROFILE_URL =
  "https://wcdirectory.ametsoc.org/united-states/mustang/service-provider/aetheris-vision-llc";

/** Public GitHub organization for Aetheris Vision LLC. */
export const GITHUB_ORG_URL = "https://github.com/aetherisvision";

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
