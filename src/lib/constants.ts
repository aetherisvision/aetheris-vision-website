export const BRAND_POSITIONING = {
  text: "Weather AI & Geospatial Consulting",
  lines: ["Weather AI &", "Geospatial Consulting"],
} as const;

export const SITE = {
  name: "Aetheris Vision",
  legalName: "Aetheris Vision LLC",
  tagline: BRAND_POSITIONING.text,
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
  "atmospheric science consulting",
  "weather and climate research",
  "climate model evaluation",
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

export const FEDERAL_SEO_KEYWORDS = [
  "SDVOSB weather consulting",
  "HUBZone meteorology",
  "veteran-owned weather consulting",
  "federal meteorology consulting",
  "defense weather support",
  "METOC support",
  "Navy METOC support",
  "naval oceanography data",
  "meteorological and oceanographic services",
  "Air Force weather veteran",
  "Air Force Weather experience",
  "AI weather forecasting for defense",
  "atmospheric research support",
  "weather data engineering",
  "NAICS 541690",
  "PSC R427",
] as const;

/** Principal's military service, stated the same way everywhere it appears. */
export const FOUNDER = {
  militaryService: "Former U.S. Air Force weather forecaster (1988–1998)",
} as const;

export const CREDENTIAL_SEO_KEYWORDS = [
  "Marston Ward CCM",
  "Certified Consulting Meteorologist (CCM)",
  "AMS Certified Consulting Meteorologist",
  "American Meteorological Society (AMS)",
  "applied meteorologist",
  "weather consulting",
  "Air Force weather forecaster",
  "veteran meteorologist",
] as const;

/** Request form for owner-reviewed capability statement requests. */
export const CAPABILITY_STATEMENT_REQUEST_HREF = "/capabilities#capability-statement";

/** Revision date of private/capability-statement.pdf. Update both together. */
export const CAPABILITY_STATEMENT_REVISION = "October 30, 2026 (V28)";

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

/** SBA certifications held. Adding one here updates badges, copy, and JSON-LD. */
const SBA_CERTIFICATIONS = [
  { abbr: "SDVOSB", name: "Service-Disabled Veteran-Owned Small Business (SDVOSB)" },
  { abbr: "VOSB", name: "Veteran-Owned Small Business (VOSB)" },
  { abbr: "HUBZone", name: "HUBZone small business" },
] as const;

/** "A, B, and C" from the certification abbreviations. */
const certificationList = (() => {
  const abbrs = SBA_CERTIFICATIONS.map((c) => c.abbr);
  return abbrs.length < 3
    ? abbrs.join(" and ")
    : `${abbrs.slice(0, -1).join(", ")}, and ${abbrs[abbrs.length - 1]}`;
})();

/**
 * NAICS codes registered in SAM.gov, with official 2022 NAICS titles.
 * Keep in step with the SAM.gov entity record; do not list a code here first.
 */
const NAICS_CODES = [
  { code: "541690", description: "Other Scientific and Technical Consulting Services", primary: true },
  { code: "541511", description: "Custom Computer Programming Services", primary: false },
  { code: "541512", description: "Computer Systems Design Services", primary: false },
  { code: "541519", description: "Other Computer Related Services", primary: false },
  { code: "541360", description: "Geophysical Surveying and Mapping Services", primary: false },
  { code: "541618", description: "Other Management Consulting Services", primary: false },
  { code: "541620", description: "Environmental Consulting Services", primary: false },
] as const;

/** PSC codes, with titles exactly as in the GSA PSC Manual (FY2025 edition). */
const PSC_CODES = [
  { code: "R427", description: "Support- Professional: Weather Reporting/Observation" },
  { code: "R425", description: "Support- Professional: Engineering/Technical" },
  { code: "R408", description: "Support- Professional: Program Management/Support" },
  { code: "R405", description: "Support- Professional: Operations Research/Quantitative Analysis" },
  { code: "DA01", description: "IT and Telecom - Business Application/Application Development Support Services (Labor)" },
  { code: "DA10", description: "IT and Telecom - Business Application/Application Development Software as a Service" },
  { code: "DB02", description: "IT and Telecom - Compute Support Services, Non-HPC (Labor)" },
  { code: "B510", description: "Special Studies/Analysis- Environmental Assessments" },
  { code: "B524", description: "Special Studies/Analysis- Mathematical/Statistical" },
  { code: "B526", description: "Special Studies/Analysis- Oceanological" },
  { code: "B529", description: "Special Studies/Analysis- Scientific Data" },
  { code: "B544", description: "Special Studies/Analysis- Technology" },
] as const;

/** Federal contracting registration data */
export const SAM = {
  uei: "ZM8QWJ4ABWZ9",
  cage: "20SQ1",
  naicsPrimary: "541690",
  setAside: `SBA-certified ${certificationList} small business`,
  /** "SDVOSB, VOSB, and HUBZone" for running copy. */
  certificationList,
  certificationTerm: "Active August 28, 2026 through August 27, 2029",
  // Single source of truth for public set-aside status badges.
  setAsidePills: SBA_CERTIFICATIONS.map((c) => `${c.abbr} — Active`),
  certifications: SBA_CERTIFICATIONS,
  naics: NAICS_CODES,
  psc: PSC_CODES,
  clearanceNote: "Active U.S. Government Secret clearance held by the principal",
  samUrl: "https://sam.gov",
} as const;
