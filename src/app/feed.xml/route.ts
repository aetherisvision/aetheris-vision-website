import { posts, parsePostDate } from "@/lib/posts";
import { SITE } from "@/lib/constants";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function GET(): Response {
  const lastBuildDate = posts.length > 0 ? parsePostDate(posts[0].date).toUTCString() : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${SITE.url}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${parsePostDate(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.category)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE.name} — Insights & Analysis`)}</title>
    <link>${SITE.url}/blog</link>
    <description>${escapeXml("Insights on AI, meteorology, and defense consulting from Aetheris Vision.")}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
