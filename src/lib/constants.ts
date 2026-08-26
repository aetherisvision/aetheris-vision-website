export const SITE = {
  name: "Aetheris Vision",
  legalName: "Aetheris Vision LLC",
  tagline: "Applied meteorology, weather AI, GIS, and geospatial data",
  url: "https://aetherisvision.com",
  logoUrl: "https://aetherisvision.com/logo/av-logo-horizontal-color-rgb.png",
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

/**
 * Search topics shared by the pages that substantively cover them. These are
 * supporting metadata signals; visible page copy and structured data carry
 * the primary search meaning.
 */
export const CORE_SEO_KEYWORDS = [
  "Aetheris Vision",
  "Certified Consulting Meteorologist (CCM)",
  "American Meteorological Society (AMS)",
  "applied meteorology consulting",
  "weather consulting",
  "weather AI",
  "AI weather forecasting",
  "weather and climate data",
  "GIS consulting",
  "geospatial consulting",
  "geospatial regridding",
  "Earth-system data engineering",
  "scientific software engineering",
] as const;

export const WEATHER_SEO_KEYWORDS = [
  "AI weather forecasting",
  "weather AI consulting",
  "applied meteorology consulting",
  "Certified Consulting Meteorologist (CCM)",
  "AMS Certified Consulting Meteorologist",
  "numerical weather prediction",
  "NWP machine learning",
  "forecast verification",
  "weather and climate data",
  "meteorological data pipelines",
  "forecast uncertainty",
] as const;

export const GEOSPATIAL_SEO_KEYWORDS = [
  "GIS consulting",
  "geospatial consulting",
  "geospatial regridding",
  "CRS transformation",
  "coordinate reference system transformation",
  "map reprojection",
  "bilinear interpolation",
  "nearest-neighbor resampling",
  "conservative regridding",
  "Elliptical Weighted Averaging",
  "EWA resampling",
  "satellite swath resampling",
  "weather and climate data",
  "GRIB NetCDF HDF",
] as const;

export const CREDENTIAL_SEO_KEYWORDS = [
  "Marston Ward CCM",
  "Certified Consulting Meteorologist (CCM)",
  "AMS Certified Consulting Meteorologist",
  "American Meteorological Society (AMS)",
  "applied meteorologist",
  "weather consulting",
] as const;

/**
 * Where visitors go to receive the capability statement.
 *
 * The PDF is emailed on request rather than linked directly: contracting
 * officers expect to receive and forward the document by email, and keeping it
 * off the public path means the address stays with us instead of being
 * harvested from a static file listing.
 */
export const CAPABILITY_STATEMENT_REQUEST_HREF = "/capabilities#capability-statement";

/** Revision date of private/capability-statement.pdf. Update both together. */
export const CAPABILITY_STATEMENT_REVISION = "August 25, 2026";

/** Public AMS Weather and Climate Directory listing for Aetheris Vision LLC. */
export const AMS_PROFILE_URL =
  "https://wcdirectory.ametsoc.org/united-states/mustang/service-provider/aetheris-vision-llc";

export const CCM_CREDENTIAL = {
  name: "Certified Consulting Meteorologist (CCM)",
  issuer: "American Meteorological Society (AMS)",
  profileUrl: AMS_PROFILE_URL,
} as const;

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
