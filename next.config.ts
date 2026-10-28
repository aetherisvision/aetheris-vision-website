import type { NextConfig } from "next";
import { cacheControlHeaderRules } from "./src/lib/cache-headers";

// Security headers applied to all responses
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // The legacy auditor is disabled on purpose: "1; mode=block" can open
  // side channels in old browsers, and the nonce-based CSP does the real work.
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Security-First Configuration
  poweredByHeader: false, // Hide Next.js signature
  compress: true, // Enable gzip compression
  devIndicators: false, // Keep local client previews free of the Next.js dev badge

  // Keep JSDOM's runtime assets beside the package instead of relocating them
  // into individual server bundles. The PDF route still sanitizes with DOMPurify.
  serverExternalPackages: ["isomorphic-dompurify"],

  // Keep the statement private and available only to the authenticated Gmail
  // draft route. Use a wildcard because tracing patterns treat [id] as a glob.
  outputFileTracingIncludes: {
    "/api/admin/leads/*/draft-email": ["./private/capability-statement.pdf"],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "epic.gsfc.nasa.gov",
      },
    ],
    // Security: Prevent unauthorized image sources
    dangerouslyAllowSVG: false,
  },
  
  async redirects() {
    return [
      // The demo-site catalogue was retired in August 2026. Invented reference
      // work does not belong under a scientific consultancy's name; the one real
      // engagement now lives on the web services page.
      {
        source: "/portfolio",
        destination: "/services/web",
        permanent: true,
      },
      {
        source: "/portfolio/:slug*",
        destination: "/services/web",
        permanent: true,
      },
      // Retired dashboard route; it was a redirect-only page component.
      {
        source: "/metrics",
        destination: "/omni-gridder",
        permanent: true,
      },
      // Retired product-style URL; kept as a permanent redirect for old links.
      {
        source: "/agentic-og",
        destination: "/omni-gridder",
        permanent: true,
      },
      // Preserve the original capability URL while using the consultancy name.
      {
        source: "/capabilities/omni-gridder",
        destination: "/omni-gridder",
        permanent: true,
      },
      // /security-status was removed; send old links to the practices page.
      {
        source: "/security-status",
        destination: "/security",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      // CDN cache policy (src/lib/cache-headers.ts). HTML is not listed on
      // purpose: the per-request CSP nonce keeps every page `no-store`.
      ...cacheControlHeaderRules(),
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // API routes use the same security headers
      {
        source: "/api/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
