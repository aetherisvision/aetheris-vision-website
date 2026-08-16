import type { NextConfig } from "next";

// Security headers applied to all responses
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
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
