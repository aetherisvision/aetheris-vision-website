import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { SITE } from "@/lib/constants";
import { publisherRef } from "@/lib/jsonld";
import {
  tiers,
  processSteps,
  sla,
  securityFeatures,
  includedFeatures,
  faqs,
  clientWork,
  demos,
  maintenancePlans,
  wpTiers,
} from "@/lib/portfolio-data";
import { CheckIcon, ClockIcon, ShieldCheckIcon, CpuChipIcon, ArrowRightIcon, BoltIcon, LockClosedIcon, SparklesIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: `Enterprise Web Development | ${SITE.name}`,
  description:
    "Professional web development for serious businesses. Custom platforms, business applications, and enterprise-grade websites. From $2,800.",
  openGraph: {
    title: `Enterprise-Grade Web Development | ${SITE.name}`,
    description: "Custom business platforms and sophisticated web applications. Lighthouse 90+ performance, enterprise security, comprehensive warranties. Starting at $2,800.",
    type: "website",
  },
};

export default function PortfolioPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">

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
                Delivered in Weeks, Not Months.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="max-w-2xl text-lg text-gray-400 mb-10 leading-relaxed font-light">
              Professional businesses need enterprise-grade web platforms, not template solutions. I build sophisticated, scalable websites and applications using cutting-edge technology, delivering the technical excellence your brand deserves.
            </p>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="flex flex-col sm:flex-row gap-4 mb-24">
              <a
                href="/book"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200"
              >
                Consultation
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
            <div className="mb-24 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 rounded-xl border border-white/5 bg-white/[0.03] p-6">
              {[
                { icon: ClockIcon, label: "15-21 Day Delivery", sub: "Professional development cycle" },
                { icon: CpuChipIcon, label: "Enterprise Architecture", sub: "Scalable & maintainable" },
                { icon: ShieldCheckIcon, label: "SOC-2 Ready", sub: "Enterprise security standards" },
                { icon: CheckIcon, label: "30-90 Day Warranty", sub: "Comprehensive guarantee" },
                { icon: SparklesIcon, label: "Lighthouse 90+", sub: "Performance guaranteed" },
                { icon: LockClosedIcon, label: "GDPR/CCPA Compliant", sub: "Data protection ready" },
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
            {processSteps.map((step, i) => (
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

          {/* ── Security & Backup ── */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Security &amp; Backup</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">Your Site Stays Up, Guaranteed</h2>
            <p className="text-gray-400 mb-12 max-w-xl">
              Every build includes production-grade security, automated backups, and a recovery plan. If your site goes down, turnaround is measured in hours, not weeks.
            </p>
          </FadeIn>

          <div className="mb-24 grid gap-6 sm:grid-cols-2">
            {securityFeatures.map((feat, i) => (
              <FadeIn key={feat.title} delay={i * 0.08}>
                <div className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-6">
                  <feat.icon className="h-6 w-6 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="mb-1.5 font-semibold text-white">{feat.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                    {"link" in feat && feat.link && (
                      <a
                        href={feat.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Verify at ssllabs.com <ArrowRightIcon className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* ── Every Site Includes ── */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Included With Every Site</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">More Than Just a Pretty Page</h2>
            <p className="text-gray-400 mb-12 max-w-xl">
              Every build comes loaded with features that agencies charge extra for. Performance, legal compliance, SEO markup, and social media polish, all included.
            </p>
          </FadeIn>

          <div className="mb-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {includedFeatures.map((feat, i) => (
              <FadeIn key={feat.title} delay={i * 0.06}>
                <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-6 h-full">
                  <feat.icon className="h-6 w-6 text-blue-400 shrink-0" />
                  <h3 className="font-semibold text-white">{feat.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* ── Client Work ── */}
          <div id="demos">
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Client Work</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">In Production for a Real Client</h2>
            </FadeIn>
          </div>

          {clientWork.map((cs) => (
            <FadeIn key={cs.url}>
              <a
                href={cs.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block mb-24"
              >
                <div className="relative aspect-[21/9] overflow-hidden rounded-xl border border-white/10 group-hover:border-blue-500/40 transition-colors">
                  <Image
                    src={cs.image}
                    alt={`${cs.title} — live client site`}
                    fill
                    sizes="(max-width: 768px) 100vw, 1000px"
                    className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <span className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-wider text-white border border-blue-400/50 bg-blue-950/60 backdrop-blur-sm rounded-sm px-2 py-1">
                    Client: {cs.client}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-blue-300 mb-1">{cs.industry}</p>
                    <h3 className="text-xl md:text-2xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {cs.title}
                    </h3>
                  </div>
                </div>
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
                    {cs.stack} · <span className="text-blue-400">Visit live site ↗</span>
                  </p>
                  <p className="mt-1.5 text-sm text-gray-400 font-light max-w-3xl">{cs.desc}</p>
                </div>
              </a>
            </FadeIn>
          ))}

          {/* ── Demo Gallery ── */}
          <div>
            <FadeIn>
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Example Builds</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">Demo Sites We Built to Show Range</h2>
              <p className="text-gray-400 mb-12 max-w-xl">
                These are demo sites we built ourselves to show range across industries and styles, not client work or case studies. The businesses shown are illustrative examples, not real clients. Each demo is a fully functional page; click through and explore the craft.
              </p>
            </FadeIn>
          </div>

          <div className="mb-24 grid gap-x-6 gap-y-12 md:grid-cols-5">
            {demos.map((demo, i) => {
              // 2-up asymmetric rhythm: rows alternate 3/5 + 2/5 and 2/5 + 3/5.
              const wide = i % 4 === 0 || i % 4 === 3;
              return (
                <FadeIn
                  key={demo.slug}
                  delay={(i % 2) * 0.08}
                  className={wide ? "md:col-span-3" : "md:col-span-2"}
                >
                  <Link href={`/portfolio/${demo.slug}`} className="group block">
                    {/* Full-bleed screenshot with overlaid title */}
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 group-hover:border-blue-500/40 transition-colors">
                      <Image
                        src={demo.image}
                        alt={`${demo.title} — ${demo.industry} demo site`}
                        fill
                        sizes={wide ? "(max-width: 768px) 100vw, 600px" : "(max-width: 768px) 100vw, 400px"}
                        className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-blue-300 mb-1">{demo.industry}</p>
                        <h3 className="text-lg md:text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {demo.title}
                        </h3>
                      </div>
                    </div>
                    {/* Outcome-focused metadata strip */}
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">{demo.stack}</p>
                      <p className="mt-1.5 text-sm text-gray-400 font-light">{demo.highlight}</p>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>

          {/* ── WordPress Services ── */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">WordPress Services</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">We Handle WordPress Clients Too</h2>
            <p className="text-gray-400 mb-12 max-w-xl">
              Already on WordPress, or need to be? Two service paths: a fast, modern headless stack or a fully managed hands-off setup.
            </p>
          </FadeIn>

          <div className="mb-24 grid gap-6 sm:grid-cols-2 max-w-3xl">
            {wpTiers.map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 0.1}>
                <div className={`relative flex flex-col h-full rounded-xl border p-6 ${tier.highlight ? "border-blue-500/60 bg-blue-950/20" : "border-white/8 bg-white/[0.03]"}`}>
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-0.5 text-xs font-bold text-white">
                      RECOMMENDED
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-0.5">{tier.subtitle}</p>
                    <p className="text-base font-bold text-white mb-1">{tier.name}</p>
                    <div className="flex items-end gap-1.5 mb-1">
                      <span className="text-3xl font-bold text-white">{tier.price}</span>
                      <span className="text-sm text-gray-500 mb-1">{tier.unit === "flat" ? "flat" : tier.unit}</span>
                    </div>
                    <p className="text-sm font-medium text-blue-400">{tier.tagline}</p>
                  </div>
                  <ul className="flex-1 space-y-2.5 mb-8">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckIcon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                        {f}
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

          {/* ── Maintenance Plans ── */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Ongoing Support</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">Keep Your Site Running Smoothly</h2>
            <p className="text-gray-400 mb-12 max-w-xl">
              Optional monthly retainers for businesses that want ongoing updates, monitoring, and peace of mind. Cancel anytime.
            </p>
          </FadeIn>

          <div className="mb-24 grid gap-6 sm:grid-cols-2 max-w-3xl">
            {maintenancePlans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <div className="flex flex-col rounded-xl border border-white/8 bg-white/[0.03] p-6 h-full">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1.5 mb-6">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-gray-500 mb-1">/month</span>
                  </div>
                  <ul className="flex-1 space-y-2.5 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckIcon className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/book"
                    className="block rounded-md border border-white/10 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/5 transition-colors"
                  >
                    Add to Any Plan
                  </a>
                </div>
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
                Start with our comprehensive intake form for accurate pricing, or book a discovery call to discuss your vision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <a
                  href="/intake"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200"
                >
                  Start Project Intake
                </a>
                <a
                  href="/book"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 bg-black/50 px-8 text-sm font-medium text-white transition-colors hover:bg-white/5"
                >
                  Book Discovery Call
                </a>
              </div>
              <p className="text-xs text-gray-600">Have a question first? <a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact us</a></p>
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Enterprise Website Development",
            provider: publisherRef,
            description:
              "Enterprise-grade website development for professional businesses. Custom platforms with advanced features delivered in 15-21 business days with comprehensive warranties.",
            offers: [
              {
                "@type": "Offer",
                name: "Professional Package",
                price: "2800",
                priceCurrency: "USD",
                description: "Enterprise-grade foundation with custom design, security headers, 30-day warranty, delivered in 15 business days.",
              },
              {
                "@type": "Offer",
                name: "Business Package",
                price: "4800",
                priceCurrency: "USD",
                description: "Advanced business platform with integrations, user authentication, CRM connectivity, delivered in 21 business days.",
              },
              {
                "@type": "Offer",
                name: "Enterprise Package",
                price: "8500",
                priceCurrency: "USD",
                description: "Comprehensive custom solution with role-based access, advanced features, priority support, custom timeline.",
              },
            ],
            areaServed: "US",
            serviceType: "Web Development",
          }),
        }}
      />
    </div>
  );
}
