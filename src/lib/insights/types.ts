/**
 * Shared shape for Insights articles, kept structurally identical to
 * Omit<Post, "readTime"> in src/lib/posts.ts (read time is computed there).
 * One article per file in this directory; posts.ts aggregates them.
 */
export type ArticleSeed = {
  id: number;
  slug: string;
  title: string;
  date: string;
  category: string;
  featured?: boolean;
  author: { name: string; title: string; initials: string };
  summary: string;
  content: string;
};

export const AUTHOR = {
  name: "Marston Ward",
  title: "Founder & Principal Consultant, Aetheris Vision",
  initials: "MW",
} as const;

/** Category labels used across the series. */
export const CATEGORY_FOUNDATIONS = "AI & Weather";
export const CATEGORY_PROFILES = "Model Profiles";
export const CATEGORY_NWP = "Traditional NWP";
export const CATEGORY_CRAFT = "Forecasting Craft";
