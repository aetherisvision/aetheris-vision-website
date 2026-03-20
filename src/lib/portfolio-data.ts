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
    name: "Professional",
    price: "$2,400",
    unit: "flat",
    tagline: "Enterprise-grade foundation",
    description:
      "For established businesses that demand professional-grade web presence with modern architecture, security, and performance.",
    deliverables: [
      "Up to 7 pages with custom design architecture",
      "Mobile-first responsive design with accessibility standards",
      "Advanced contact forms with validation & CRM integration",
      "SEO optimization + structured data for rich results",
      "Lighthouse 95+ performance guarantee",
      "SSL A+ with security headers & CSP implementation",
      "Privacy Policy + Terms of Service (legally compliant)",
      "Vercel Pro deployment with custom domain",
      "2 rounds of professional revisions",
      "15-day delivery with comprehensive testing",
      "30-day warranty period",
    ],
    highlight: false,
    cta: "Get Started",
  },
  {
    name: "Business",
    price: "$4,800",
    unit: "flat",
    tagline: "Advanced business platform",
    description:
      "For growing companies needing sophisticated functionality, integrations, and business automation to drive revenue and efficiency.",
    deliverables: [
      "Up to 15 pages with custom brand implementation",
      "Advanced booking/scheduling system integration",
      "Blog/CMS with editorial workflow",
      "Analytics dashboard + monthly performance reports",
      "Payment processing integration (Stripe/PayPal)",
      "Email marketing automation setup",
      "Advanced SEO with schema markup & local optimization",
      "Social media integration & Open Graph optimization",
      "Professional email setup + domain configuration",
      "3 rounds of revisions with stakeholder reviews",
      "21-day delivery with user acceptance testing",
      "60-day warranty + performance monitoring",
    ],
    highlight: true,
    cta: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Starting at $8,500",
    unit: "quote",
    tagline: "Full-scale business applications",
    description:
      "Complete business platforms with user management, custom workflows, API integrations, and enterprise-grade security for serious operations.",
    deliverables: [
      "Custom business application development",
      "User authentication & role-based access control",
      "Database design & API architecture",
      "Third-party integrations (CRM, ERP, payment systems)",
      "Advanced security: 2FA, audit logging, compliance",
      "Custom admin dashboards & reporting",
      "Mobile API + progressive web app capabilities",
      "Scalable cloud infrastructure on Vercel Pro",
      "Comprehensive testing suite + documentation",
      "White-glove onboarding & training",
      "90-day warranty + ongoing support options",
      "Dedicated project timeline (4-8 weeks)",
    ],
    highlight: false,
    cta: "Schedule Consultation",
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
  { label: "Discovery & strategy call", value: "Within 24 hours of inquiry" },
  { label: "Technical requirements & architecture", value: "48-72 hours after discovery" },
  { label: "Interactive prototype delivery", value: "5-7 business days" },
  { label: "Staging environment access", value: "10-14 business days" },
  { label: "Production deployment", value: "15-21 business days" },
  { label: "Quality assurance period", value: "30 days comprehensive warranty" },
  { label: "Priority support response", value: "4 hours business days / 8 hours weekends" },
  { label: "Performance guarantee", value: "Lighthouse 90+ or full refund" },
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
    desc: "A tailored privacy policy included with every build. Business and Enterprise tiers add Terms of Service and cookie consent.",
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
    title: "Schema Markup (Business+)",
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
    a: "Yes. Every site includes a Privacy Policy page tailored to your business. Business and Enterprise tiers also include Terms of Service and a cookie consent banner — no extra charge.",
  },
  {
    q: "What happens if my site goes down?",
    a: "Your site is backed up across GitHub and GitLab with full version history. If anything breaks, I can restore and redeploy within hours. Maintenance plan clients get proactive uptime monitoring and same-day response.",
  },
  {
    q: "Can you help with my Google Business Profile?",
    a: "Yes — included in the Business tier and above. I'll connect your site to Google Business Profile so your business shows up in Google Maps with hours, reviews, and a link to your site.",
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
    name: "Professional Care",
    price: "$149",
    features: [
      "Monthly security & dependency updates",
      "24/7 uptime monitoring with instant alerts",
      "Up to 3 content updates per month",
      "Performance optimization & bug fixes",
      "Priority email support (4-hour response)",
      "Monthly Lighthouse performance audit",
    ],
  },
  {
    name: "Business Care",
    price: "$299",
    features: [
      "Everything in Professional Care",
      "SEO monitoring & optimization recommendations",
      "Analytics review with quarterly business insights",
      "Up to 8 content updates per month",
      "Minor feature additions & enhancements",
      "Phone support during business hours",
      "Emergency response (2-hour SLA)",
    ],
  },
];
