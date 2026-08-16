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

const authoredPosts: Omit<Post, "readTime">[] = [
  {
    id: 6,
    slug: "zero-trust-security-implementation",
    title: "Zero-Trust Security Architecture: Implementation Deep Dive",
    date: "Mar 26, 2026",
    category: "Engineering",
    featured: true,
    author: {
      name: "Marston Ward",
      title: "Founder & Principal Consultant, Aetheris Vision",
      initials: "MW",
    },
    summary:
      "An engineering overview of Content Security Policy, rate limiting, and layered request controls used by this site.",
    content: `
Security isn't a checklist. It's an architectural philosophy that permeates every layer of your system. After 35 years working with operational weather data, where errors carry real consequences, I've learned that **true security requires assuming breach and designing for containment.**

This isn't theoretical. The security architecture powering this website demonstrates these principles in production: requests pass through layered security controls.

## Philosophy: Assume Breach, Design for Containment

Traditional security models focus on perimeter defense: firewalls, VPNs, and access controls. Modern attack vectors render this approach obsolete. Advanced Persistent Threats (APTs) don't break down doors. They walk through them with legitimate credentials.

Zero-trust architecture assumes **every request is hostile until proven otherwise**. This requires identity verification at every interaction, request validation against known attack patterns, real-time threat analysis with automated response, comprehensive logging for forensic reconstruction, and graceful degradation when attacks are detected.

For the full technical implementation details, contact us for a complete security consultation.
    `.trim(),
  },
  {
    id: 5,
    slug: "performance-engineering-core-web-vitals",
    title: "Performance Engineering at Scale: Core Web Vitals Beyond the Metrics",
    date: "Mar 25, 2026",
    category: "Engineering",
    author: {
      name: "Marston Ward", 
      title: "Founder & Principal Consultant, Aetheris Vision",
      initials: "MW",
    },
    summary:
      "Real-time performance monitoring with live Core Web Vitals analysis, memory profiling, and optimization strategies that deliver measurable user experience improvements.",
    content: `
Performance isn't just about fast page loads. It's about **predictable, reliable systems that scale under real-world conditions**. After a career spanning USAF operational weather, European research institutes, and industry software delivery, I've learned that true performance engineering requires understanding what actually affects user experience, not just optimizing for benchmark scores.

This website's performance dashboard demonstrates these principles in production, providing real-time analysis of every metric that matters.

## Beyond Synthetic Testing: Real-Time Performance Analysis

Most performance monitoring relies on synthetic testing, controlled environments that don't reflect actual user conditions. We collect metrics from actual user sessions to provide ground truth about user experience quality.

For the complete performance engineering methodology, contact us for detailed consultation.
    `.trim(),
  },
  {
    id: 3,
    slug: "the-convergence-advantage",
    title: "The Convergence Advantage: Meteorology, Data, and Software Together",
    date: "Mar 25, 2026",
    category: "Strategy",
    featured: false,
    author: {
      name: "Marston Ward",
      title: "Founder & Principal Consultant, Aetheris Vision",
      initials: "MW",
    },
    summary:
      "How 35 years of cross-domain experience in meteorology, data, software, and federal contracting supports integrated technical work.",
    content: `
Complex technical projects often cross disciplinary boundaries. Meteorology, data engineering, software delivery, and federal procurement each contribute a necessary perspective.

Bringing those perspectives together can make requirements, scientific assumptions, and implementation tradeoffs easier to evaluate as one system.

## An Integrated Perspective

Multidisciplinary work benefits from clear connections between domain science and implementation. That continuity helps keep technical decisions aligned with the operational problem.

At Aetheris Vision, we deliver integrated solutions grounded in verifiable science.

Contact us to discuss how an integrated perspective can support your organization.
    `.trim(),
  },
  {
    id: 2,
    slug: "8a-vosb-defense-contracts",
    title: "Navigating SDVOSB and HUBZone Pathways for Federal Contracts",
    date: "Jan 15, 2026",
    category: "Contracting",
    author: {
      name: "Marston Ward",
      title: "Founder & Principal Consultant, Aetheris Vision",
      initials: "MW",
    },
    summary:
      "An overview of how SDVOSB/VOSB and HUBZone eligibility can inform federal procurement while applicable certifications remain pending.",
    content: `
The federal procurement landscape is vast, and for agencies seeking specialized technical consulting (particularly in niche domains like atmospheric modeling, AI integration, and defense systems), knowing how to structure an acquisition is as important as knowing what to acquire.

## Understanding SDVOSB/VOSB and HUBZone Pathways

Aetheris Vision is eligible for **Service-Disabled Veteran-Owned Small Business (SDVOSB)** and **Veteran-Owned Small Business (VOSB)** status, with VetCert pending. The firm is also HUBZone eligible. These pathways may support set-aside opportunities after the applicable certification requirements are completed; no certification is represented here as currently held.

Contact Aetheris Vision for acquisition strategy guidance to help agencies structure procurement approaches that optimize for both mission success and administrative efficiency.
    `.trim(),
  },
  {
    id: 1,
    slug: "ai-in-operational-meteorology",
    title: "The Future of AI in Operational Meteorology",
    date: "Feb 28, 2026",
    category: "AI / ML Integration",
    featured: false,
    author: {
      name: "Marston Ward",
      title: "Founder & Principal Consultant, Aetheris Vision",
      initials: "MW",
    },
    summary:
      "How deep-learning models are transforming raw satellite data into actionable mission-critical insights faster than traditional numerical weather prediction (NWP) models.",
    content: `
For decades, Numerical Weather Prediction (NWP) has been the gold standard in operational meteorology. Atmospheric models like the GFS, ECMWF, and NAM have served forecasters well, but they carry a fundamental constraint: they are governed by equations of physics that require enormous computational resources and significant lead time to run.

Enter deep learning.

## The Shift to Data-Driven Forecasting

Models like Google DeepMind's GraphCast and Huawei's Pangu-Weather have demonstrated that transformer-based neural networks can produce skillful global forecasts at 0.25° resolution in under a minute, compared to hours for traditional NWP. This isn't a marginal improvement. It's a paradigm shift.

For defense and government applications, the implications are profound. Aetheris Vision is positioned to help government and defense clients navigate that transition, from architecture assessment through operational deployment.
    `.trim(),
  }
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
