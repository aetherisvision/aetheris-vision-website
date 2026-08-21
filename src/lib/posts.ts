import randomForestsInWeather from "./insights/random-forests-in-weather";
import cnnsInWeather from "./insights/cnns-in-weather";
import transformersAndGraphNetworks from "./insights/transformers-and-graph-networks-in-weather";
import fourcastnet from "./insights/fourcastnet";
import panguWeather from "./insights/pangu-weather";
import graphcast from "./insights/graphcast";
import gencast from "./insights/gencast";
import aifs from "./insights/aifs";
import aurora from "./insights/aurora";
import neuralgcm from "./insights/neuralgcm";
import stateOfAiWeatherModels from "./insights/state-of-ai-weather-models-2026";

export type Post = {
  id: number
  slug: string
  title: string
  date: string
  category: string
  featured?: boolean
  author: {
    name: string
    title: string
    initials: string
  }
  summary: string
  readTime: string
  content: string
}

const WORDS_PER_MINUTE = 200;

/** Compute an honest read time from actual word count (~200 wpm, min 1 min). */
export function computeReadTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  // Ceil so read times are never understated for posts just past a minute boundary.
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

/** Parse a post's display date (e.g. "Mar 26, 2026") to a UTC-midnight Date. */
export function parsePostDate(date: string): Date {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid post date: "${date}"`);
  }
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

/** ISO 8601 date (YYYY-MM-DD) for metadata, JSON-LD, and feeds. */
export function getPostISODate(post: Pick<Post, "date">): string {
  return parsePostDate(post.date).toISOString().slice(0, 10);
}

/** Newest first; ties broken by id descending so ordering is stable. */
export function sortPostsByDateDesc<T extends Pick<Post, "date" | "id">>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const diff = parsePostDate(b.date).getTime() - parsePostDate(a.date).getTime();
    return diff !== 0 ? diff : b.id - a.id;
  });
}

/**
 * The AI & Weather series — one article per file under ./insights/.
 * Foundations track (model families) plus one profile per current model,
 * anchored by the state-of-the-field survey.
 */
const authoredPosts: Omit<Post, "readTime">[] = [
  randomForestsInWeather,
  cnnsInWeather,
  transformersAndGraphNetworks,
  fourcastnet,
  panguWeather,
  graphcast,
  gencast,
  aifs,
  aurora,
  neuralgcm,
  stateOfAiWeatherModels,
];

/** All posts, newest first, with read times computed from actual word count. */
export const posts: Post[] = sortPostsByDateDesc(authoredPosts).map((post) => ({
  ...post,
  readTime: computeReadTime(post.content),
}));

export function getCategories(): string[] {
  const categories = Array.from(new Set(posts.map(post => post.category)));
  return categories.sort();
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find(post => post.slug === slug);
}

/**
 * Chronological neighbors: `prev` is the previous (older) post,
 * `next` is the next (newer) post.
 */
export function getPrevNextPosts(currentSlug: string): { prev: Post | null; next: Post | null } {
  const currentIndex = posts.findIndex(post => post.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null,
    next: currentIndex > 0 ? posts[currentIndex - 1] : null,
  };
}
