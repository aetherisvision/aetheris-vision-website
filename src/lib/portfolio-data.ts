import {
  LockClosedIcon,
  CloudArrowUpIcon,
  ServerStackIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

/* ── Tier Pricing ── */

export interface Tier {
  name: string;
  price: string;
  unit: "flat" | "quote";
  tagline: string;
  description: string;
  deliverables: string[];
  highlight: boolean;
  cta: string;
}

export const tiers: Tier[] = [
  {
    name: "Launch",
    price: "$800",
    unit: "flat",
    tagline: "Get online fast",
    description:
      "Perfect for solo operators, consultants, or anyone who needs a clean, credible web presence without the agency price tag.",
    deliverables: [
      "Up to 5 pages (Home, About, Services, Contact + 1 more)",
      "Mobile-first responsive design",
      "Contact form with email delivery",
      "SEO metadata + Open Graph tags on all pages",
      "Lighthouse 90+ performance score",
      "SSL/HTTPS with A+ security rating",
      "Privacy Policy page included",
      "Deployment to Vercel (free tier)",
      "1 round of revision",
      "Delivered in 5 business days",
    ],
    highlight: false,
    cta: "Get Started",
  },
  {
    name: "Growth",
    price: "$1,500",
    unit: "flat",
    tagline: "Built to convert",
    description:
      "For established small businesses that want a polished site with booking, blog, or custom functionality that actually drives leads.",
    deliverables: [
      "Up to 10 pages",
      "Custom design to match your brand",
      "Integrated booking / scheduling (Cal.com or similar)",
      "Blog or news section",
      "Google Analytics + Plausible dashboard",
      "Structured data / schema markup for Google rich results",
      "Privacy Policy + Terms of Service pages",
      "Open Graph & social media preview cards",
      "Lighthouse 90+ across all categories",
      "SSL/HTTPS with A+ security rating",
      "Contact & inquiry forms",
      "Domain & professional email setup assistance",
      "2 rounds of revision",
      "Delivered in 10 business days",
    ],
    highlight: true,
    cta: "Most Popular",
  },
  {
    name: "Pro",
    price: "Custom",
    unit: "quote",
    tagline: "Full-featured build",
    description:
      "E-commerce, membership portals, complex integrations, or government/federal contractor sites with compliance requirements.",
    deliverables: [
      "Unlimited pages",
      "E-commerce or membership capability",
      "Custom API integrations",
      "Advanced SEO, schema markup & performance tuning",
      "Accessibility (WCAG 2.1 AA)",
      "Full legal pages (Privacy, Terms, Cookie consent)",
      "Google Business Profile setup",
      "Analytics dashboard with monthly reporting",
      "Domain, DNS & professional email configuration",
      "Ongoing maintenance retainer available",
      "Dedicated project timeline",
    ],
    highlight: false,
    cta: "Request a Quote",
  },
];

/* ── Process Steps ── */

export interface ProcessStep {
  step: string;
  title: string;
  time: string;
  desc: string;
}

export const processSteps: ProcessStep[] = [
  {
    step: "01",
    title: "Discovery Call",
    time: "Day 1",
    desc: "30-minute intake call to understand your business, goals, target audience, and any existing brand assets. No prep required.",
  },
  {
    step: "02",
    title: "Design Mockup",
    time: "Day 2–3",
    desc: "A high-fidelity page layout delivered for your review — color palette, typography, and layout before a single line of code is written.",
  },
  {
    step: "03",
    title: "Build & Review",
    time: "Day 3–8",
    desc: "Full site built in Next.js. You get a live preview link to review on any device. Feedback captured, revisions applied.",
  },
  {
    step: "04",
    title: "Launch",
    time: "Day 5–10",
    desc: "Domain connected, SSL configured, deployed to production. You receive login access to manage content and a handoff walkthrough.",
  },
];

/* ── SLA ── */

export const sla = [
  { label: "Initial mockup delivery", value: "48 hours after intake call" },
  { label: "Live preview link", value: "Within 5 business days (Launch) / 8 days (Growth)" },
  { label: "Revision turnaround", value: "24–48 hours per round" },
  { label: "Final launch", value: "5 business days (Launch) / 10 days (Growth)" },
  { label: "Post-launch bug fixes", value: "Free for 14 days after launch" },
  { label: "Response time (email)", value: "Same business day" },
];

/* ── Security Features ── */

export interface IconFeature {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
  link?: string;
}

export const securityFeatures: IconFeature[] = [
  {
    icon: LockClosedIcon,
    title: "SSL & HTTPS by Default — A+ Rated",
    desc: "Every site ships with automatic SSL certificates and enforced HTTPS — verified with an A+ rating from Qualys SSL Labs (ssllabs.com/ssltest). No extra cost, no configuration needed.",
    link: "https://www.ssllabs.com/ssltest/",
  },
  {
    icon: CloudArrowUpIcon,
    title: "Automated Daily Backups",
    desc: "Your site code is version-controlled with Git and backed up to multiple cloud providers (GitHub + GitLab). Every change is tracked and recoverable.",
  },
  {
    icon: ServerStackIcon,
    title: "99.9% Uptime on Vercel Edge",
    desc: "Sites are deployed to Vercel's global edge network — automatic failover, DDoS protection, and CDN-cached assets worldwide.",
  },
  {
    icon: WrenchScrewdriverIcon,
    title: "Same-Day Recovery",
    desc: "If something goes wrong, I can restore your site from backup and redeploy within hours — not days. Your business doesn't wait.",
  },
];

/* ── Included Features (every site) ── */

export const includedFeatures: IconFeature[] = [
  {
    icon: SparklesIcon,
    title: "Lighthouse 90+ Score",
    desc: "Every page optimized for Performance, Accessibility, Best Practices, and SEO — tested before launch with a full report.",
  },
  {
    icon: DocumentTextIcon,
    title: "Privacy Policy Page",
    desc: "A tailored privacy policy included with every build. Growth and Pro tiers add Terms of Service and cookie consent.",
  },
  {
    icon: GlobeAltIcon,
    title: "SEO Metadata & Sitemaps",
    desc: "Title tags, meta descriptions, canonical URLs, and an auto-generated XML sitemap — ready for Google from day one.",
  },
  {
    icon: ShareIcon,
    title: "Social Media Preview Cards",
    desc: "Open Graph and Twitter Card tags on every page so your site looks polished when shared on LinkedIn, Facebook, or X.",
  },
  {
    icon: MagnifyingGlassIcon,
    title: "Schema Markup (Growth+)",
    desc: "Structured data for Google rich results — LocalBusiness, FAQ, Service, and more — so search engines understand your content.",
  },
  {
    icon: ChartBarIcon,
    title: "Analytics Ready",
    desc: "Pre-wired for Google Analytics or privacy-friendly alternatives like Plausible. Know who's visiting and what's converting.",
  },
];

/* ── FAQ ── */

export const faqs = [
  {
    q: "Do I need to provide content and copy?",
    a: "You provide the essentials — your services, a short bio, contact info, and any photos or logo. I handle layout, copyediting, and structure. If you need full copywriting, that can be added.",
  },
  {
    q: "What technology do you use?",
    a: "Sites are built with Next.js (React) and Tailwind CSS, deployed on Vercel. This gives you fast load times, excellent SEO, and a codebase you own entirely. No WordPress, no page builders, no lock-in.",
  },
  {
    q: "Will I be able to edit the site myself?",
    a: "Yes. For content-heavy sites I integrate a headless CMS (like Sanity or Contentlayer) so you can edit text without touching code. For simpler sites I provide a walkthrough and the full source code.",
  },
  {
    q: "Do you host the site?",
    a: "Sites are deployed to Vercel. The free tier covers most small business traffic. You own the deployment — I just set it up and hand it over.",
  },
  {
    q: "Can you match our existing brand?",
    a: "Yes. Send your brand guide, logo files, or just describe the feel you're going for — I'll match it or propose something that fits.",
  },
  {
    q: "Is this AI-generated slop?",
    a: "No. AI accelerates the workflow — layout ideation, copy drafts, component generation. Every site is reviewed, refined, and tested by a human engineer before it ships.",
  },
  {
    q: "What's included in the Lighthouse 90+ guarantee?",
    a: "Every site is tested against Google Lighthouse before launch. I optimize images, code-split bundles, implement lazy loading, and configure caching to hit 90+ in Performance, Accessibility, Best Practices, and SEO. You get the report.",
  },
  {
    q: "Do I really get a Privacy Policy and Terms of Service?",
    a: "Yes. Every site includes a Privacy Policy page tailored to your business. Growth and Pro tiers also include Terms of Service and a cookie consent banner — no extra charge.",
  },
  {
    q: "What happens if my site goes down?",
    a: "Your site is backed up across GitHub and GitLab with full version history. If anything breaks, I can restore and redeploy within hours. Maintenance plan clients get proactive uptime monitoring and same-day response.",
  },
  {
    q: "Can you help with my Google Business Profile?",
    a: "Yes — included in the Pro tier. I'll connect your site to Google Business Profile so your business shows up in Google Maps with hours, reviews, and a link to your site.",
  },
];

/* ── Demo Sites ── */

export const demos = [
  {
    slug: "law-firm",
    title: "Mitchell & Associates",
    industry: "Law Firm",
    desc: "Professional legal services — practice areas, attorney bios, free consultation form. Navy & gold.",
    color: "from-[#1e3a5f] to-[#0f2240]",
  },
  {
    slug: "restaurant",
    title: "Casa Verde Kitchen",
    industry: "Restaurant",
    desc: "Full-service restaurant — menu sections, hours, reservation form. Warm amber & terracotta.",
    color: "from-[#92400e] to-[#5c2a08]",
  },
  {
    slug: "trades-contractor",
    title: "Summit Home Services",
    industry: "Home Services",
    desc: "Contractor site with services, trust badges, and free quote form. Bold blue & orange.",
    color: "from-[#1d4ed8] to-[#1e3a8a]",
  },
  {
    slug: "veteran-nonprofit",
    title: "Veterans Forward Oklahoma",
    industry: "Nonprofit",
    desc: "Mission-driven nonprofit — impact stats, programs, donate & volunteer CTAs. Red, white & blue.",
    color: "from-[#b91c1c] to-[#7f1d1d]",
  },
  {
    slug: "analytics-dashboard",
    title: "DataViz Pro Analytics",
    industry: "SaaS Platform",
    desc: "Enterprise analytics dashboard — real-time metrics, interactive charts, performance monitoring. Advanced data visualization.",
    color: "from-[#0f172a] via-[#1e293b] to-[#334155]",
  },
  {
    slug: "international-market",
    title: "Global Harvest Market",
    industry: "International Foods",
    desc: "Modern food market — product search & filtering, cultural sections, online ordering. Vibrant emerald & gold design.",
    color: "from-[#059669] via-[#10b981] to-[#d97706]",
  },
  {
    slug: "portal-pro",
    title: "Portal Pro Business Suite",
    industry: "Business Platform",
    desc: "Full-stack business portal — user management, role-based dashboards, plugin system, CRM features. Modern Drupal replacement.",
    color: "from-[#6366f1] via-[#8b5cf6] to-[#a855f7]",
  },
];

/* ── Maintenance Plans ── */

export interface MaintenancePlan {
  name: string;
  price: string;
  features: string[];
}

export const maintenancePlans: MaintenancePlan[] = [
  {
    name: "Basic Care",
    price: "$99",
    features: [
      "Monthly dependency & security updates",
      "Uptime monitoring with alerts",
      "Up to 2 content edits per month",
      "Bug fixes & browser compatibility",
      "Email support (same-day response)",
    ],
  },
  {
    name: "Growth Care",
    price: "$199",
    features: [
      "Everything in Basic Care",
      "Monthly Lighthouse performance audit",
      "SEO ranking check & recommendations",
      "Up to 5 content edits per month",
      "Analytics review with monthly summary",
      "Priority response (< 4 hours)",
    ],
  },
];
