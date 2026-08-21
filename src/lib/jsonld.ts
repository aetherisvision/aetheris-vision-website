import { AMS_PROFILE_URL, CCM_CREDENTIAL, GITHUB_ORG_URL, SITE } from "./constants";

/**
 * Same-entity profiles Google uses to reconcile the site with the Google
 * Business Profile and other listings. Add the GBP/LinkedIn URLs when live.
 */
const SAME_AS = [AMS_PROFILE_URL, GITHUB_ORG_URL];

/** Full Organization entity — use in layout.tsx root JSON-LD */
export const organizationJsonLd = {
  "@context": "https://schema.org" as const,
  "@type": ["Organization", "ProfessionalService"] as const,
  "@id": `${SITE.url}/#organization`,
  name: SITE.legalName,
  url: SITE.url,
  logo: SITE.logoUrl,
  image: SITE.logoUrl,
  description: SITE.description,
  sameAs: SAME_AS,
  address: {
    "@type": "PostalAddress" as const,
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.locality,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  },
  areaServed: "US",
  priceRange: "$$",
  founder: {
    "@type": "Person" as const,
    "@id": `${SITE.url}/about#marston-ward`,
    name: "Marston Ward, Ph.D., CCM",
    url: `${SITE.url}/about`,
    jobTitle: "Founder and Principal Consultant",
    sameAs: CCM_CREDENTIAL.profileUrl,
    hasCredential: {
      "@type": "EducationalOccupationalCredential" as const,
      name: CCM_CREDENTIAL.name,
      credentialCategory: "Professional certification",
      recognizedBy: {
        "@type": "Organization" as const,
        name: CCM_CREDENTIAL.issuer,
      },
    },
  },
  knowsAbout: [
    "Applied meteorology",
    "AI weather forecasting",
    "Numerical weather prediction",
    "Geographic information systems (GIS)",
    "Geospatial regridding",
    "Coordinate reference system transformation",
    "Weather and climate data analysis",
    "Bilinear interpolation",
    "Conservative regridding",
    "Elliptical Weighted Averaging (EWA)",
    "Satellite swath resampling",
    "Earth-system data",
    "Scientific data pipelines",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog" as const,
    name: "Scientific and technical consulting services",
    itemListElement: [
      {
        "@type": "Offer" as const,
        itemOffered: {
          "@type": "Service" as const,
          name: "AI weather forecasting and applied meteorology consulting",
          url: `${SITE.url}/services/weather-ai`,
        },
      },
      {
        "@type": "Offer" as const,
        itemOffered: {
          "@type": "Service" as const,
          name: "GIS and geospatial regridding services",
          url: `${SITE.url}/services/geospatial-regridding`,
        },
      },
      {
        "@type": "Offer" as const,
        itemOffered: {
          "@type": "Service" as const,
          name: "Scientific software and Earth-data pipelines",
          url: `${SITE.url}/services`,
        },
      },
    ],
  },
};

/** Minimal publisher reference — use inside BlogPosting, Service, etc. */
export const publisherRef = {
  "@type": "Organization" as const,
  "@id": `${SITE.url}/#organization`,
  name: SITE.legalName,
  url: SITE.url,
};

export const websiteJsonLd = {
  "@context": "https://schema.org" as const,
  "@type": "WebSite" as const,
  "@id": `${SITE.url}/#website`,
  name: SITE.name,
  url: SITE.url,
  inLanguage: "en-US",
  publisher: publisherRef,
};
