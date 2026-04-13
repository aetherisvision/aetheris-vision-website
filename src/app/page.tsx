import { ArrowRightIcon, CheckCircleIcon, CodeBracketIcon, GlobeAltIcon, ShieldCheckIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";

export const revalidate = 3600;

export const metadata = {
  title: `${SITE.name} | Custom Websites & AI Solutions — Oklahoma City`,
  description:
    "Aetheris Vision builds custom websites, web applications, and AI-powered systems for Oklahoma businesses and government agencies. Veteran-owned. Based in Mustang, OK.",
};

const WEB_PROBLEMS = [
  "Your website doesn't show up on Google",
  "Visitors leave before they contact you",
  "You're still using a template that looks like everyone else's",
  "You have no way to track leads or manage clients online",
  "Your site breaks on mobile and you don't know it",
];

const WEB_SOLUTIONS = [
  "Custom-built site engineered to convert visitors into calls",
  "Mobile-first, fast-loading, and optimized for local Oklahoma SEO",
  "Client portal so your customers can log in, sign docs, and pay",
  "Integrated with your existing tools — booking, payments, CRM",
  "Ongoing support — not abandoned after launch",
];

const FEDERAL_PROBLEMS = [
  "Legacy forecasting systems that are expensive and inaccurate",
  "Weather uncertainty creating operational risk in high-stakes missions",
  "AI/ML tools that weren't built for atmospheric science data",
  "No vendor with both clearance and deep meteorological expertise",
];

const FEDERAL_SOLUTIONS = [
  "AI-hybrid atmospheric intelligence systems (GraphCast, Pangu-Weather)",
  "35+ years of operational forecasting including USAF combat deployments",
  "Active DoD Secret clearance — ready for classified program support",
  "SDVOSB/VOSB eligible — qualifies for Veterans First set-asides",
];

const WHY_AV = [
  {
    title: "Veteran-Owned & Oklahoma-Based",
    body: "USAF veteran, honorably discharged, based in Mustang OK. We understand what it means to deliver under pressure — and we don't disappear after go-live.",
  },
  {
    title: "No Templates. No Outsourcing.",
    body: "Every site is built from scratch by us, for you. We don't resell Squarespace or outsource to overseas contractors. You get a real engineer who answers the phone.",
  },
  {
    title: "One Firm, Two Deep Capabilities",
    body: "Custom web development for local businesses + AI-powered atmospheric intelligence for government agencies. Rare combination — by design.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />

      <main id="main" className="flex-1">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden bg-[#0d0c0f]">
          {/* Background */}
          <div className="absolute inset-0 -z-20">
            <Image
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2500"
              alt=""
              aria-hidden="true"
              fill
              className="object-cover opacity-20 contrast-125"
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c0f]/60 via-[#0d0c0f]/90 to-[#0d0c0f] -z-10" />

          <div className="mx-auto max-w-5xl px-6 relative z-10">
            <FadeIn delay={0.1}>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 mb-8 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
                Veteran-Owned · Based in Mustang, OK · VOSB Eligible
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-white mb-6 leading-[1.1]">
                Your business deserves<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-gray-400">
                  a better website.
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-4 leading-relaxed font-light">
                Aetheris Vision builds custom websites, web applications, and client portals for Oklahoma businesses — and AI-powered atmospheric intelligence systems for government agencies.
              </p>
              <p className="max-w-xl text-base text-gray-500 mb-10 font-light">
                No templates. No outsourcing. Built from scratch, engineered to last.
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/book"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200"
                >
                  Book a Free Consultation
                </a>
                <a
                  href="#solutions"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-white/5"
                >
                  See What We Build <ArrowRightIcon className="ml-2 h-4 w-4" />
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── WHO WE SERVE ─────────────────────────────────────────────── */}
        <section id="solutions" className="py-24 bg-[#0d0c0f] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">What We Do</p>
              <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                Two areas. Deep expertise.
              </h2>
              <p className="text-gray-400 font-light mb-14 max-w-xl">
                Choose the track that fits your situation — or <a href="/book" className="text-blue-400 hover:text-blue-300 transition">book a call</a> and we'll figure it out together.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Track 1: Web */}
              <FadeIn delay={0.05} direction="up">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-8 flex flex-col h-full relative overflow-hidden group hover:border-blue-500/40 transition">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200"
                      alt="Business team working on digital solutions"
                      fill
                      className="object-cover opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="h-12 w-12 rounded-lg bg-gray-900 border border-blue-500/30 flex items-center justify-center mb-6">
                      <CodeBracketIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-2">For Oklahoma Businesses</p>
                    <h3 className="text-2xl font-medium text-white mb-3">Digital Solutions</h3>
                    <p className="text-gray-400 font-light text-sm mb-6 leading-relaxed">
                      Custom websites, web apps, and client portals that work as hard as you do. Built to bring in leads, impress customers, and run your business online.
                    </p>
                    <ul className="space-y-2 mb-8 flex-1">
                      {WEB_SOLUTIONS.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-300 font-light">
                          <CheckCircleIcon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a href="/book" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition font-medium">
                      Start with a free consultation <ArrowRightIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </FadeIn>

              {/* Track 2: Federal */}
              <FadeIn delay={0.1} direction="up">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 flex flex-col h-full relative overflow-hidden group hover:border-white/10 transition">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1527482937786-6608f6f73e1c?q=80&w=1200"
                      alt="Atmospheric weather monitoring"
                      fill
                      className="object-cover opacity-[0.10] group-hover:opacity-[0.16] transition-opacity duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="h-12 w-12 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center mb-6">
                      <GlobeAltIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">For Government Agencies</p>
                    <h3 className="text-2xl font-medium text-white mb-3">Atmospheric Intelligence</h3>
                    <p className="text-gray-400 font-light text-sm mb-6 leading-relaxed">
                      AI-powered forecasting systems built by a 35-year operational meteorologist with USAF combat experience and an active DoD Secret clearance.
                    </p>
                    <ul className="space-y-2 mb-8 flex-1">
                      {FEDERAL_SOLUTIONS.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-300 font-light">
                          <CheckCircleIcon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a href="/capabilities" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition font-medium">
                      View capabilities statement <ArrowRightIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── PROBLEMS WE SOLVE ────────────────────────────────────────── */}
        <section className="py-24 bg-[#111014] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

              {/* Web problems */}
              <FadeIn delay={0.05}>
                <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Sound Familiar?</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-8">
                  What's holding your business back online
                </h2>
                <ul className="space-y-4">
                  {WEB_PROBLEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-400 font-light text-sm leading-relaxed">
                      <span className="h-5 w-5 rounded-full border border-red-500/40 bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a
                    href="/book"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-white px-7 text-sm font-medium text-black hover:bg-gray-200 transition"
                  >
                    Let's fix it — book a free call
                  </a>
                </div>
              </FadeIn>

              {/* Government problems */}
              <FadeIn delay={0.1}>
                <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase mb-3">For Agencies &amp; Contracting Officers</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-8">
                  Where legacy forecasting fails missions
                </h2>
                <ul className="space-y-4">
                  {FEDERAL_PROBLEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-400 font-light text-sm leading-relaxed">
                      <span className="h-5 w-5 rounded-full border border-red-500/40 bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a
                    href="/capabilities"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-7 text-sm font-medium text-white hover:bg-white/5 transition"
                  >
                    View capabilities statement
                  </a>
                </div>
              </FadeIn>

            </div>
          </div>
        </section>

        {/* ── WHY AETHERIS VISION ──────────────────────────────────────── */}
        <section className="py-24 bg-[#0d0c0f] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Why Us</p>
              <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-14">
                Why Aetheris Vision
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {WHY_AV.map((item, i) => (
                <FadeIn key={item.title} delay={i * 0.07} direction="up">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 h-full hover:bg-white/[0.04] transition">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                      <span className="text-blue-400 font-semibold text-sm">{i + 1}</span>
                    </div>
                    <h3 className="text-white font-medium mb-3">{item.title}</h3>
                    <p className="text-gray-400 font-light text-sm leading-relaxed">{item.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Founder row */}
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1600"
                    alt="Professional business leader"
                    fill
                    className="object-cover opacity-[0.07]"
                    sizes="100vw"
                  />
                </div>
                <div className="relative z-10 h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/30 to-gray-700/30 border border-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="h-9 w-9 text-blue-400" />
                </div>
                <div className="relative z-10">
                  <p className="text-white font-medium text-lg mb-1">Marston Ward, Ph.D.</p>
                  <p className="text-blue-400 text-xs font-semibold tracking-widest uppercase mb-3">Founder · USAF Veteran · Chief Meteorologist</p>
                  <p className="text-gray-400 font-light text-sm leading-relaxed max-w-2xl">
                    35 years in operational meteorology — from Air Force weather forecaster to AI systems architect. Aetheris Vision was built on one principle: deliver precision results, not polished promises. When you work with us, you work directly with the founder.
                  </p>
                </div>
                <div className="relative z-10 shrink-0">
                  <a href="/about" className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-5 text-sm text-gray-300 hover:bg-white/5 transition whitespace-nowrap">
                    About Marston <ArrowRightIcon className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── SOCIAL PROOF / CLIENT ────────────────────────────────────── */}
        <section className="py-20 bg-[#111014] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-10 text-center">Recent Work</p>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <FadeIn delay={0.05}>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden group hover:border-white/10 transition">
                  <div className="relative h-48 bg-[#1a3d28]">
                    <Image
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200"
                      alt="Tropical Hut OKC — Caribbean grocery store website"
                      fill
                      className="object-cover opacity-40 group-hover:opacity-50 transition"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-2xl font-black tracking-tight">Tropical Hut OKC</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Oklahoma City · Retail</p>
                    <p className="text-white font-medium mb-2">Caribbean, African &amp; Indian Grocery</p>
                    <p className="text-gray-400 font-light text-sm leading-relaxed mb-4">
                      Full e-commerce catalog with 9,000+ products, Sanity CMS, AI-powered product images, and mobile-first design. Live and growing.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Next.js 16", "Sanity CMS", "AI Images", "9,000+ Products"].map((tag) => (
                        <span key={tag} className="text-xs text-blue-400 border border-blue-500/20 bg-blue-500/[0.06] rounded-full px-3 py-1">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                    Built for real businesses.<br />
                    <span className="text-gray-500">Not for portfolios.</span>
                  </h3>
                  <p className="text-gray-400 font-light leading-relaxed">
                    Tropical Hut OKC came to us with a basic site that didn't reflect their catalog or culture. We built a modern storefront with a full product database, department pages, weekly specials, and an AI assistant — all within weeks.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "9,077 products imported from their POS system",
                      "Automated product images via Pixabay + Unsplash",
                      "Department pages with cultural identity and symbols",
                      "Mobile-first, fast, and easy to update via CMS",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-300 font-light">
                        <CheckCircleIcon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a href="/book" className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-7 text-sm font-medium text-black hover:bg-gray-200 transition">
                    Start your project <ArrowRightIcon className="h-4 w-4" />
                  </a>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── LEAD CAPTURE ─────────────────────────────────────────────── */}
        <section className="py-24 bg-[#0d0c0f] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 md:p-16 relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />
              <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Free Consultation</p>
                  <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
                    Not sure where to start?
                  </h2>
                  <p className="text-gray-400 font-light leading-relaxed mb-6">
                    Book a free 30-minute call. No sales pitch — just an honest conversation about what you need and whether we're the right fit. We respond within one business day.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400 font-light">
                    {[
                      "Free — no obligation",
                      "30 minutes, on your schedule",
                      "Get a straight answer on cost and timeline",
                      "We'll tell you if you don't need us",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-4">
                  <a
                    href="/book"
                    className="inline-flex h-14 items-center justify-center rounded-md bg-white px-8 text-base font-semibold text-black hover:bg-gray-200 transition shadow-lg"
                  >
                    Book a Free Consultation
                  </a>
                  <p className="text-center text-xs text-gray-600">or</p>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
                  >
                    Send us an email
                  </a>
                  <Link
                    href="/blog"
                    className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
                  >
                    Read our insights first
                  </Link>
                  <p className="text-center text-xs text-gray-600 mt-2">
                    Already know what you need?{" "}
                    <Link href="/intake" className="text-blue-400 hover:text-blue-300 transition underline underline-offset-2">
                      Skip to the project form →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ────────────────────────────────────────────────── */}
        <section className="py-10 bg-[#111014] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-gray-600">
              {[
                "🇺🇸 USAF Veteran",
                "🔐 Active DoD Secret Clearance",
                "🏛️ VOSB Eligible",
                "📍 Mustang, Oklahoma",
                "⚡ Response within 1 business day",
              ].map((item) => (
                <span key={item} className="whitespace-nowrap">{item}</span>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
