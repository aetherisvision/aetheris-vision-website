import { ArrowRightIcon, CodeBracketIcon, DevicePhoneMobileIcon, ServerStackIcon, LockClosedIcon, ChartBarIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import EmailLink from "@/components/EmailLink";

export const metadata = {
  title: `Web Development Services | ${SITE.name}`,
  description:
    "Custom websites, web applications, and client portals for Oklahoma businesses. Built on Next.js, React, and modern cloud infrastructure. Veteran-owned, Mustang OK.",
};

const services = [
  {
    icon: CodeBracketIcon,
    title: "Custom Websites & Apps",
    description:
      "Custom-built, not templated. Every site is designed and coded from scratch for your business, and you own the code when it's done. Built on Next.js and React for fast, reliable performance.",
  },
  {
    icon: ServerStackIcon,
    title: "Business Applications",
    description:
      "When you need more than static pages: dashboards, booking systems, client portals, and document workflows that cut manual work. Full-stack applications built around how your business actually operates.",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Performance Engineering",
    description:
      "Every site is tuned for Core Web Vitals and built mobile-first, so it loads fast on any device. Deployed on a global edge network so visitors get quick load times wherever they are.",
  },
  {
    icon: LockClosedIcon,
    title: "Security-First Architecture",
    description:
      "Magic-link authentication, role-based access control, and solid session management built into the foundation, not bolted on later with plugins. Security is part of the design from day one.",
  },
  {
    icon: ChartBarIcon,
    title: "Integrations & Automation",
    description:
      "We connect your site to the tools you already use (CRMs, scheduling platforms, payment processors, and e-signature services) through their APIs. That removes manual data entry and keeps everything in sync.",
  },
  {
    icon: WrenchScrewdriverIcon,
    title: "Ongoing Maintenance",
    description:
      "Optional monthly support to keep your site current, secure, and improving over time. You work with one partner who knows your project, with no help desk queues or ticket systems.",
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
    body: "A 30-45 minute conversation to align on goals, timeline, and budget. No obligation, just clarity.",
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
              Custom Websites<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
                Built for Your Business.
              </span>
            </h1>
            <p className="max-w-2xl text-lg text-gray-400 font-light leading-relaxed mb-10">
              We build custom websites and web applications for Oklahoma businesses, with no templates and no shortcuts. Fixed price, known before work begins, and you own the code when it ships. This website was built the same way we build for our clients.
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
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-12">What We Build</h2>
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
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">Our Stack</h2>
              <p className="text-gray-400 font-light mb-10">
                Proven, modern technologies chosen for reliability and long-term maintainability, not novelty.
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
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">How It Works</h2>
              <p className="text-gray-400 font-light mb-12">
                A clear, step-by-step process. Fixed price, no surprises.
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
                  You work directly with the founder, not a junior dev or an overseas team.
                </h2>
                <p className="text-gray-400 font-light leading-relaxed max-w-2xl mb-6">
                  The founder and lead engineer of Aetheris Vision writes and ships the code himself, drawing on a PhD in atmospheric and environmental science, service as a USAF veteran, and a DoD Secret clearance (held) — a background built on systems that have to work under pressure. When you hire us, you get one experienced engineer from start to finish.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Founder & Lead Engineer", "PhD Environmental Science", "USAF Veteran", "Secret Clearance (held)", "Mustang, OK"].map((tag) => (
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
                <EmailLink
                  subject="Web Project Inquiry"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
                >
                  Email Us Directly
                </EmailLink>
              </div>
            </FadeIn>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
