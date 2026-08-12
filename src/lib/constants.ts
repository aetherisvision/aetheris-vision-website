export const SITE = {
  name: "Aetheris Vision",
  legalName: "Aetheris Vision LLC",
  tagline: "Agentic Regridding for Earth-Observation Data",
  url: "https://aetherisvision.com",
  logoUrl: "https://aetherisvision.com/logo/av-logo-horizontal-dark.png",
  email: "contact@aetherisvision.com",
  phone: "(346) 381-9629",
  phoneHref: "tel:+13463819629",
  description:
    "Aetheris Vision builds Agentic OG, a cloud-native regridding engine for satellite and NWP data, backed by 35 years of operational atmospheric-science experience. Veteran-owned. Based in Mustang, OK.",
  ogDescription:
    "Agentic OG: a cloud-native, agentic regridding engine for Earth-observation and model data — built by a career atmospheric scientist, not just engineers guessing at grids. Veteran-owned, based in Mustang, OK.",
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
  setAside: "SDVOSB / VOSB",
  samUrl: "https://sam.gov",
  federalEmail: SITE.email,
} as const;
