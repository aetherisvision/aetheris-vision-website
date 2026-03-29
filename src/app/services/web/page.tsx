import { ArrowRightIcon, CodeBracketIcon, DevicePhoneMobileIcon, ServerStackIcon, LockClosedIcon, ChartBarIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";

export const metadata = {
  title: `Web Development Services | ${SITE.name}`,
  description:
    "Custom websites, web applications, and client portals for Oklahoma businesses. Built on Next.js, React, and modern cloud infrastructure. Veteran-owned, Mustang OK.",
};

const services = [
  {
    icon: CodeBracketIcon,
    title: "Digital Business Weapons",
    description:
      "Custom-engineered systems, not templated websites. Every solution is architected from scratch to dominate your market, eliminate operational friction, and make competitors' efforts look obsolete. Built on Next.js and React for uncompromising performance.",
  },
  {
    icon: ServerStackIcon,
    title: "Operational Intelligence Platforms",
    description:
      "When your business demands more than static pages — dashboards that eliminate guesswork, booking systems that maximize revenue, document workflows that cut bureaucracy. Full-stack applications engineered to operate as extensions of your strategic thinking.",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Performance-Engineered Domination",
    description:
      "Every deployment optimized for Core Web Vitals supremacy. Mobile-first architecture that renders instantly on any device. Global edge network deployment that makes loading delays irrelevant. Your competitors' slow sites become obvious weaknesses.",
  },
  {
    icon: LockClosedIcon,
    title: "Security-First Architecture",
    description:
      "Magic-link authentication, role-based access control, and bulletproof session management built into the foundation. No supplemental plugins or security band-aids — protection is engineered at the architectural level from day one.",
  },
  {
    icon: ChartBarIcon,
    title: "Integration & Automation Warfare",
    description:
      "Direct API conquest of your existing business systems — CRMs, scheduling platforms, payment processors, e-signature services. We eliminate manual processes and data silos, creating a unified command center for your operations.",
  },
  {
    icon: WrenchScrewdriverIcon,
    title: "Evolutionary Maintenance",
    description:
      "Continuous optimization that transforms your digital presence over time. Monthly enhancement cycles keep your systems ahead of market changes and competitor attempts. One strategic partner, no help desk queues or ticket systems.",
  },
];

const techStack = [
  { name: "Next.js", role: "Framework" },
  { name: "React", role: "UI" },
  { name: "TypeScript", role: "Language" },
  { name: "Tailwind CSS", role: "Styling" },
  { name: "Neon / Postgres", role: "Database" },
  { name: "Vercel", role: "Hosting" },
  { name: "Resend", role: "Email" },
  { name: "Docuseal", role: "E-Signing" },
];

const process = [
  {
    step: "01",
    title: "Intake",
    body: "Fill out our project intake form. We review it and follow up within one business day with questions or an assessment.",
  },
  {
    step: "02",
    title: "Scoping Call",
    body: "A 30–45 minute conversation to align on goals, timeline, and budget. No obligation — just clarity.",
  },
  {
    step: "03",
    title: "Proposal",
    body: "You receive a fixed-price proposal with scope, timeline, and payment terms. No hourly surprises.",
  },
  {
    step: "04",
    title: "Build",
    body: "We build in focused sprints with regular check-ins. You see real progress, not status updates.",
  },
  {
    step: "05",
    title: "Launch & Handoff",
    body: "We handle deployment and walk you through everything. You own the code, the domain, and the hosting.",
  },
];

export default function WebServicesPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">
              Web Development
            </p>
            <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tight mb-6 leading-[1.1]">
              Digital Solutions<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
                That Eliminate Competition.
              </span>
            </h1>
            <p className="max-w-2xl text-lg text-gray-400 font-light leading-relaxed mb-10">
              We engineer revolutionary digital systems that transform organizations into market dominators. No templates, no compromise, no operational inefficiencies. This website showcases our methodology: strategic technology deployment designed to make conventional approaches obsolete.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/intake"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition"
              >
                Start Your Project <ArrowRightIcon className="h-4 w-4" />
              </a>
              <a
                href="/book"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
              >
                Book a Free Call
              </a>
            </div>
          </FadeIn>
        </section>

        {/* Services Grid */}
        <section className="border-t border-white/5 bg-[#0d0c0f] py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-12">Strategic Digital Weapons</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((s, i) => (
                <FadeIn key={s.title} delay={i * 0.05} direction="up">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 h-full">
                    <div className="h-10 w-10 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center mb-4">
                      <s.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-white font-medium mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-400 font-light leading-relaxed">{s.description}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="border-t border-white/5 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">Battle-Tested Arsenal</h2>
              <p className="text-gray-400 font-light mb-10">
                Enterprise-grade technologies chosen for reliability and competitive advantage — not novelty.
              </p>
            </FadeIn>
            <div className="flex flex-wrap gap-3">
              {techStack.map((t, i) => (
                <FadeIn key={t.name} delay={i * 0.04}>
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.role}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="border-t border-white/5 bg-[#0d0c0f] py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">Deployment Protocol</h2>
              <p className="text-gray-400 font-light mb-12">
                Precision execution. Zero surprises. Predictable transformation.
              </p>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {process.map((p, i) => (
                <FadeIn key={p.step} delay={i * 0.07} direction="up">
                  <div className="relative">
                    <p className="text-4xl font-semibold text-white/10 mb-3">{p.step}</p>
                    <h3 className="text-white font-medium mb-2">{p.title}</h3>
                    <p className="text-sm text-gray-400 font-light leading-relaxed">{p.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* About the builder */}
        <section className="border-t border-white/5 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-12">
                <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-4">Who builds your site</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                  You work directly with Marston — not a junior dev or an overseas team.
                </h2>
                <p className="text-gray-400 font-light leading-relaxed max-w-2xl mb-6">
                  Marston Ward is a PhD atmospheric scientist, USAF veteran, and software developer with 35 years of building systems that have to work under pressure. He founded Aetheris Vision to bring that same standard of care to small business web projects. When you hire us, you get one experienced engineer from start to finish.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["PhD Environmental Science", "USAF Veteran", "Active Secret Clearance", "Mustang, OK"].map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 bg-[#0d0c0f] py-20">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Ready to get started?</h2>
              <p className="text-gray-400 font-light mb-8 max-w-xl mx-auto">
                Fill out the intake form and we&apos;ll follow up within one business day. No obligation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/intake"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition"
                >
                  Start Your Project <ArrowRightIcon className="h-4 w-4" />
                </a>
                <a
                  href={`mailto:${SITE.email}?subject=Web Project Inquiry`}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
                >
                  Email Us Directly
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
