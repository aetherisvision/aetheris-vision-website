import { describe, it, expect } from "vitest";
import {
  posts,
  getPostBySlug,
  getPrevNextPosts,
  getCategories,
  computeReadTime,
  sortPostsByDateDesc,
  parsePostDate,
  getPostISODate,
} from "@/lib/posts";

describe("posts data", () => {
  it("exports a non-empty posts array", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it("each post has required fields", () => {
    for (const post of posts) {
      expect(post.id).toBeTypeOf("number");
      expect(post.slug).toBeTruthy();
      expect(post.title).toBeTruthy();
      expect(post.date).toBeTruthy();
      expect(post.category).toBeTruthy();
      expect(post.summary).toBeTruthy();
      expect(post.readTime).toBeTruthy();
      expect(post.content).toBeTruthy();
      expect(post.author).toBeDefined();
      expect(post.author.name).toBeTruthy();
      expect(post.author.initials).toBeTruthy();
    }
  });

  it("slugs are unique", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("slugs are URL-safe", () => {
    for (const post of posts) {
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("IDs are unique", () => {
    const ids = posts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("posts are sorted by date descending (newest first)", () => {
    for (let i = 1; i < posts.length; i++) {
      const prevTime = parsePostDate(posts[i - 1].date).getTime();
      const currTime = parsePostDate(posts[i].date).getTime();
      expect(prevTime).toBeGreaterThanOrEqual(currTime);
    }
  });

  it("read times are computed from actual content word count", () => {
    for (const post of posts) {
      expect(post.readTime).toBe(computeReadTime(post.content));
    }
  });
});

describe("computeReadTime", () => {
  it("returns a minimum of 1 min read for short content", () => {
    expect(computeReadTime("just a few words")).toBe("1 min read");
    expect(computeReadTime("")).toBe("1 min read");
  });

  it("computes minutes at ~200 words per minute", () => {
    const words400 = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    expect(computeReadTime(words400)).toBe("2 min read");
    const words1000 = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(" ");
    expect(computeReadTime(words1000)).toBe("5 min read");
  });

  it("rounds up so read times are never understated", () => {
    const words201 = Array.from({ length: 201 }, (_, i) => `word${i}`).join(" ");
    expect(computeReadTime(words201)).toBe("2 min read");
  });

  it("ignores extra whitespace when counting words", () => {
    expect(computeReadTime("  one \n\n two\t three  ")).toBe("1 min read");
  });
});

describe("sortPostsByDateDesc", () => {
  it("sorts newest first", () => {
    const items = [
      { id: 1, date: "Jan 15, 2026" },
      { id: 2, date: "Mar 26, 2026" },
      { id: 3, date: "Feb 28, 2026" },
    ];
    expect(sortPostsByDateDesc(items).map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it("breaks date ties by id descending", () => {
    const items = [
      { id: 3, date: "Mar 25, 2026" },
      { id: 5, date: "Mar 25, 2026" },
    ];
    expect(sortPostsByDateDesc(items).map((p) => p.id)).toEqual([5, 3]);
  });

  it("does not mutate the input array", () => {
    const items = [
      { id: 1, date: "Jan 15, 2026" },
      { id: 2, date: "Mar 26, 2026" },
    ];
    sortPostsByDateDesc(items);
    expect(items.map((p) => p.id)).toEqual([1, 2]);
  });
});

describe("getPostISODate", () => {
  it("formats display dates as YYYY-MM-DD", () => {
    expect(getPostISODate({ date: "Mar 26, 2026" })).toBe("2026-03-26");
    expect(getPostISODate({ date: "Jan 15, 2026" })).toBe("2026-01-15");
  });
});

describe("parsePostDate", () => {
  it("throws a clear error for malformed dates", () => {
    expect(() => parsePostDate("not a date")).toThrowError(/Invalid post date/);
  });
});

describe("getPostBySlug", () => {
  it("returns the correct post for a valid slug", () => {
    const first = posts[0];
    const found = getPostBySlug(first.slug);
    expect(found).toBeDefined();
    expect(found!.id).toBe(first.id);
  });

  it("returns undefined for an invalid slug", () => {
    expect(getPostBySlug("nonexistent-post-slug-xyz")).toBeUndefined();
  });
});

describe("getPrevNextPosts", () => {
  it("returns null next for the newest post (nothing newer)", () => {
    const { prev, next } = getPrevNextPosts(posts[0].slug);
    expect(next).toBeNull();
    if (posts.length > 1) {
      expect(prev).not.toBeNull();
    }
  });

  it("returns null prev for the oldest post (nothing older)", () => {
    const oldest = posts[posts.length - 1];
    const { prev } = getPrevNextPosts(oldest.slug);
    expect(prev).toBeNull();
  });

  it("returns both prev and next for a middle post", () => {
    if (posts.length >= 3) {
      const middle = posts[1];
      const { prev, next } = getPrevNextPosts(middle.slug);
      expect(prev).not.toBeNull();
      expect(next).not.toBeNull();
    }
  });

  it("navigation follows chronological order", () => {
    for (let i = 0; i < posts.length; i++) {
      const { prev, next } = getPrevNextPosts(posts[i].slug);
      if (prev) {
        expect(parsePostDate(prev.date).getTime()).toBeLessThanOrEqual(
          parsePostDate(posts[i].date).getTime()
        );
      }
      if (next) {
        expect(parsePostDate(next.date).getTime()).toBeGreaterThanOrEqual(
          parsePostDate(posts[i].date).getTime()
        );
      }
    }
  });

  it("returns nulls for an unknown slug", () => {
    const { prev, next } = getPrevNextPosts("nonexistent-post-slug-xyz");
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});

describe("getCategories", () => {
  it("returns a non-empty array of unique categories", () => {
    const cats = getCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it("every category exists on at least one post", () => {
    const cats = getCategories();
    for (const cat of cats) {
      expect(posts.some((p) => p.category === cat)).toBe(true);
    }
  });
});
