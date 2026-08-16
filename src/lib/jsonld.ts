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
  contactPoint: {
    "@type": "ContactPoint" as const,
    email: SITE.email,
    contactType: "sales",
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
  email: SITE.email,
  // Deliberately no telephone: contact routes through the verified inquiry
  // form or Cal.com booking, and JSON-LD is as scrapable as visible text.
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
