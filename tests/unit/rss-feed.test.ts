import { describe, it, expect } from "vitest";
import { GET } from "@/app/feed.xml/route";
import { posts } from "@/lib/posts";
import { SITE } from "@/lib/constants";

describe("RSS feed (/feed.xml)", () => {
  it("responds with an RSS content type", () => {
    const res = GET();
    expect(res.headers.get("Content-Type")).toContain("application/rss+xml");
  });

  it("is a valid RSS 2.0 document with a channel", async () => {
    const xml = await GET().text();
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain(`<link>${SITE.url}/blog</link>`);
  });

  it("includes one item per post with title, link, pubDate, and description", async () => {
    const xml = await GET().text();
    expect(xml.match(/<item>/g)?.length).toBe(posts.length);
    for (const post of posts) {
      expect(xml).toContain(`<link>${SITE.url}/blog/${post.slug}</link>`);
    }
    expect(xml.match(/<pubDate>/g)?.length).toBe(posts.length);
    expect(xml.match(/<description>/g)?.length).toBe(posts.length + 1); // items + channel
  });

  it("escapes XML special characters in titles", async () => {
    const xml = await GET().text();
    // No raw unescaped ampersands outside entities
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });

  it("uses parseable RFC 822 pubDates", async () => {
    const xml = await GET().text();
    const pubDates = [...xml.matchAll(/<pubDate>(.*?)<\/pubDate>/g)].map((m) => m[1]);
    for (const d of pubDates) {
      expect(Number.isNaN(new Date(d).getTime())).toBe(false);
    }
  });
});
