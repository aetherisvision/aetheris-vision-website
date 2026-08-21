/**
 * Delivered client work.
 *
 * Real engagements only — every entry must point at a live site we actually
 * built. The former demo catalogue (fictional law-firm, restaurant, and
 * contractor sites) was retired in August 2026: invented reference work does
 * not belong under a scientific consultancy's name.
 */
export interface ClientCaseStudy {
  title: string;
  client: string;
  url: string;
  industry: string;
  image: string;
  stack: string;
  /** Factual description of what was built — no invented results or metrics. */
  desc: string;
}

export const clientWork: ClientCaseStudy[] = [
  {
    title: "Tropical Hut OKC",
    client: "Tropical Hut OKC",
    url: "https://www.tropicalhutokc.com",
    industry: "Retail · International Grocery",
    image: "/images/portfolio/tropical-hut-okc.webp",
    stack: "Next.js 16 · Sanity CMS · Neon Postgres · Vercel",
    desc: "Full production site for an Oklahoma City Caribbean, African & Indian grocery: department and weekly-specials pages the owner manages through an embedded content studio, store info and hours, product search, and contact — live at tropicalhutokc.com.",
  },
];
