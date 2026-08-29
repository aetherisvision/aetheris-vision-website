import { MetadataRoute } from "next";
import { posts, parsePostDate } from "@/lib/posts";
import { SITE } from "@/lib/constants";
import { INSIGHTS_PUBLIC } from "@/lib/features";

export default function sitemap(): MetadataRoute.Sitemap {
  // While the preview lock is on, robots.ts disallows everything; publishing the
  // full route list here anyway would contradict it. Launch flips both together.
  if (process.env.PREVIEW_PASSWORD) return [];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE.url,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE.url}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE.url}/services`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE.url}/services/weather-ai`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE.url}/services/geospatial-regridding`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE.url}/capabilities`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE.url}/omni-gridder`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...(INSIGHTS_PUBLIC
      ? [{
          url: `${SITE.url}/blog`,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }]
      : []),
    {
      url: `${SITE.url}/book`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE.url}/services/web`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE.url}/contact`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE.url}/security`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE.url}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = INSIGHTS_PUBLIC ? posts.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: parsePostDate(post.date),
    changeFrequency: "never",
    priority: 0.6,
  })) : [];

  return [...staticRoutes, ...blogRoutes];
}
