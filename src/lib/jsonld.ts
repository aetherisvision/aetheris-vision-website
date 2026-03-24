import { SITE } from "./constants";

/** Full Organization entity — use in layout.tsx root JSON-LD */
export const organizationJsonLd = {
  "@context": "https://schema.org" as const,
  "@type": "Organization" as const,
  name: SITE.legalName,
  url: SITE.url,
  logo: SITE.logoUrl,
  description: SITE.description,
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
  "@type": "LocalBusiness" as const,
  name: SITE.legalName,
  url: SITE.url,
  email: SITE.email,
  telephone: "+13463819629",
  logo: SITE.logoUrl,
  description: SITE.description,
  address: {
    "@type": "PostalAddress" as const,
    streetAddress: "210 N Mustang Mall Terrace PMB 29",
    addressLocality: "Mustang",
    addressRegion: "OK",
    postalCode: "73064",
    addressCountry: "US",
  },
  areaServed: "US",
  priceRange: "$$",
};
