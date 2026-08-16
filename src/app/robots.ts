import { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

// Mirrors the site lock: while PREVIEW_PASSWORD gates the site, crawlers are
// told to stay out. Launch (unsetting the var and redeploying) flips this to
// allow-all — no separate robots edit to remember. Evaluated at build time,
// like the lock itself.
export default function robots(): MetadataRoute.Robots {
  if (process.env.PREVIEW_PASSWORD) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/client/", "/preview"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
