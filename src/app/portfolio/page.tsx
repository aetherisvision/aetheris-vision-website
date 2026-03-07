import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { CheckIcon, ClockIcon, ShieldCheckIcon, CpuChipIcon, ArrowRightIcon, BoltIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export const metadata = {
  title: "Website Development Portfolio | Aetheris Vision",
  description:
    "AI-assisted website development for small businesses. Professional, fast, and affordable — delivered in 5–10 business days. View demo sites and pricing.",
};

const tiers = [
  {
    name: "Launch",
    price: "$800",
    unit: "flat",
    tagline: "Get online fast",
    description: "Perfect for solo operators, consultants, or anyone who needs a clean, credible web presence without the agency price tag.",
    deliverables: [
      "Up to 5 pages (Home, About, Services, Contact + 1 more)",
      "Mobile-first responsive design",
      "Contact form with email delivery",
      "SEO metadata on all pages",
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
    description: "For established small businesses that want a polished site with booking, blog, or custom functionality that actually drives leads.",
    deliverables: [
      "Up to 10 pages",
      "Custom design to match your brand",
      "Integrated booking / scheduling (Cal.com or similar)",
      "Blog or news section",
      "Google Analytics + basic SEO",
      "Contact & inquiry forms",
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
    description: "E-commerce, membership portals, complex integrations, or government/federal contractor sites with compliance requirements.",
    deliverables: [
      "Unlimited pages",
      "E-commerce or membership capability",
      "Custom API integrations",
      "Advanced SEO & performance optimization",
      "Accessibility (WCAG 2.1 AA)",
      "Ongoing maintenance retainer available",
      "Dedicated project timeline",
    ],
    highlight: false,
    cta: "Request a Quote",
  },
];

const process = [
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

const sla = [
  { label: "Initial mockup delivery", value: "48 hours after intake call" },
  { label: "Live preview link", value: "Within 5 business days (Launch) / 8 days (Growth)" },
  { label: "Revision turnaround", value: "24–48 hours per round" },
  { label: "Final launch", value: "5 business days (Launch) / 10 days (Growth)" },
  { label: "Post-launch bug fixes", value: "Free for 14 days after launch" },
  { label: "Response time (email)", value: "Same business day" },
];

const faqs = [
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
];

const demos = [
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
];

export default function PortfolioPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-6">

          {/* ── Hero ── */}
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 mb-8 backdrop-blur-sm">
              <BoltIcon className="h-3.5 w-3.5 mr-2 text-blue-400" />
              AI-Assisted · No Agency Markup · You Own the Code
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter text-white mb-6 leading-[1.1]">
              A Professional Website,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                Delivered in Days.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="max-w-2xl text-lg text-gray-400 mb-10 leading-relaxed font-light">
              Most small businesses are stuck with an outdated site or paying $5,000+ to an agency for something that takes months. I build fast, modern, mobile-first websites using AI-accelerated tooling — at a fraction of the cost, with a fraction of the wait.
            </p>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="flex flex-col sm:flex-row gap-4 mb-24">
              <a
                href="/book"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200"
              >
                Book a Free Discovery Call
              </a>
              <a
                href="#demos"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-white/5"
              >
                See Example Sites <ArrowRightIcon className="ml-2 h-4 w-4" />
              </a>
            </div>
          </FadeIn>

          {/* ── Trust bar ── */}
          <FadeIn delay={0.3}>
            <div className="mb-24 grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-xl border border-white/5 bg-white/[0.03] p-6">
              {[
                { icon: ClockIcon, label: "5–10 Day Delivery", sub: "Launch to Growth tiers" },
                { icon: CpuChipIcon, label: "AI-Accelerated Build", sub: "Human-reviewed & tested" },
                { icon: ShieldCheckIcon, label: "You Own Everything", sub: "Full source code handoff" },
                { icon: CheckIcon, label: "14-Day Bug Guarantee", sub: "Free fixes post-launch" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* ── Pricing ── */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">Simple, Flat-Rate Packages</h2>
            <p className="text-gray-400 mb-12 max-w-xl">No hourly billing surprises. You know the price before work begins.</p>
          </FadeIn>

          <div className="mb-24 grid gap-6 sm:grid-cols-3">
            {tiers.map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 0.1}>
                <div className={`relative flex flex-col h-full rounded-xl border p-6 ${tier.highlight ? "border-blue-500/60 bg-blue-950/20" : "border-white/8 bg-white/[0.03]"}`}>
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-0.5 text-xs font-bold text-white">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{tier.name}</p>
                    <div className="flex items-end gap-1.5 mb-1">
                      <span className="text-3xl font-bold text-white">{tier.price}</span>
                      {tier.unit === "flat" && <span className="text-sm text-gray-500 mb-1">flat rate</span>}
                      {tier.unit === "quote" && <span className="text-sm text-gray-500 mb-1">on request</span>}
                    </div>
                    <p className="text-sm font-medium text-blue-400">{tier.tagline}</p>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">{tier.description}</p>
                  <ul className="flex-1 space-y-2.5 mb-8">
                    {tier.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckIcon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/book"
                    className={`block rounded-md py-2.5 text-center text-sm font-semibold transition-colors ${tier.highlight ? "bg-blue-500 text-white hover:bg-blue-400" : "border border-white/10 text-white hover:bg-white/5"}`}
                  >
                    {tier.cta}
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* ── Process ── */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Process</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">How It Works</h2>
            <p className="text-gray-400 mb-12 max-w-xl">Four steps from first call to live site.</p>
          </FadeIn>

          <div className="mb-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.08}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 h-full">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-3xl font-bold text-white/10">{step.step}</span>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">{step.time}</span>
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* ── SLA ── */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Service Commitments</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">What You Can Count On</h2>
            <p className="text-gray-400 mb-10 max-w-xl">These are commitments, not estimates.</p>
          </FadeIn>

          <FadeIn>
            <div className="mb-24 rounded-xl border border-white/8 bg-white/[0.03] divide-y divide-white/5">
              {sla.map(({ label, value }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-4">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* ── Demo Gallery ── */}
          <div id="demos">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Demo Sites</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">Explore Example Builds</h2>
              <p className="text-gray-400 mb-12 max-w-xl">
                Each demo is a fully functional site built to show range across industries and styles. These are real pages — click through and explore.
              </p>
            </FadeIn>
          </div>

          <div className="mb-24 grid gap-6 sm:grid-cols-2">
            {demos.map((demo, i) => (
              <FadeIn key={demo.slug} delay={i * 0.08}>
                <Link
                  href={`/portfolio/${demo.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] hover:border-blue-500/40 hover:bg-white/[0.05] transition-all"
                >
                  <div className={`h-32 bg-gradient-to-br ${demo.color} flex items-end p-4`}>
                    <span className="rounded border border-white/20 bg-black/30 px-2.5 py-1 text-xs font-semibold text-white/80 backdrop-blur">
                      {demo.industry}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-1.5 font-semibold text-white group-hover:text-blue-300 transition-colors">{demo.title}</h3>
                    <p className="flex-1 text-sm text-gray-400 leading-relaxed">{demo.desc}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-400 group-hover:text-blue-300">
                      View demo <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {/* ── FAQ ── */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-12 tracking-tight">Common Questions</h2>
          </FadeIn>

          <div className="mb-24 divide-y divide-white/5 rounded-xl border border-white/8">
            {faqs.map(({ q, a }) => (
              <FadeIn key={q}>
                <div className="px-6 py-6">
                  <h3 className="mb-2 font-semibold text-white">{q}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* ── CTA ── */}
          <FadeIn>
            <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-blue-950/40 to-black p-10 text-center">
              <h2 className="mb-3 text-3xl font-semibold text-white tracking-tight">Ready to get started?</h2>
              <p className="mb-8 text-gray-400 max-w-md mx-auto">
                Book a free 30-minute discovery call. No commitment, no sales pressure — just a conversation about what you need.
              </p>
              <a
                href="/book"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-10 text-sm font-medium text-black transition-colors hover:bg-gray-200"
              >
                Book a Free Discovery Call
              </a>
              <p className="mt-4 text-xs text-gray-600">Or email directly: <a href="mailto:contact@aetherisvision.com" className="text-gray-400 hover:text-white transition-colors">contact@aetherisvision.com</a></p>
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
}
