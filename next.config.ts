import type { NextConfig } from "next";

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
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // Security-First Configuration
  poweredByHeader: false, // Hide Next.js signature
  compress: true, // Enable gzip compression
  devIndicators: false, // Keep local client previews free of the Next.js dev badge

  // Keep JSDOM's runtime assets beside the package instead of relocating them
  // into individual server bundles. The PDF route still sanitizes with DOMPurify.
  serverExternalPackages: ["isomorphic-dompurify"],

  // The capability statement is deliberately stored outside public/ so it is
  // never directly fetchable — it is delivered by email from the API route.
  // Tracing has to be told about it because nothing imports the file.
  // The Gmail draft-email route reuses the same PDF and also needs the
  // signature HTML fragment, neither of which anything else imports.
  outputFileTracingIncludes: {
    "/api/capability-statement": ["./private/capability-statement.pdf"],
    "/api/admin/leads/[id]/draft-email": [
      "./private/capability-statement.pdf",
      "./private/email-signature.html",
    ],
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
      {
        source: "/earth-textures/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=31536000",
          },
        ],
      },
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
