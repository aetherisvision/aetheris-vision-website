import { AMS_PROFILE_URL, GITHUB_ORG_URL, SITE } from "./constants";

/**
 * Same-entity profiles Google uses to reconcile the site with the Google
 * Business Profile and other listings. Add the GBP/LinkedIn URLs when live.
 */
const SAME_AS = [AMS_PROFILE_URL, GITHUB_ORG_URL];

/** Full Organization entity — use in layout.tsx root JSON-LD */
export const organizationJsonLd = {
  "@context": "https://schema.org" as const,
  "@type": "Organization" as const,
  name: SITE.legalName,
  url: SITE.url,
  logo: SITE.logoUrl,
  description: SITE.description,
  sameAs: SAME_AS,
  knowsAbout: [
    "Applied meteorology",
    "AI weather forecasting",
    "Numerical weather prediction",
    "Geographic information systems (GIS)",
    "Geospatial regridding",
    "Coordinate reference system transformation",
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
  name: SITE.legalName,
  url: SITE.url,
};

export const websiteJsonLd = {
  "@context": "https://schema.org" as const,
  "@type": "WebSite" as const,
  name: SITE.name,
  url: SITE.url,
};

export const localBusinessJsonLd = {
  "@context": "https://schema.org" as const,
  // ProfessionalService is a LocalBusiness subtype — the specific type for a
  // consulting practice with a Google Business Profile.
  "@type": "ProfessionalService" as const,
  name: SITE.legalName,
  url: SITE.url,
  // Deliberately no telephone or email: contact routes through the verified
  // inquiry form or Cal.com booking, and JSON-LD is as scrapable as text.
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
};
