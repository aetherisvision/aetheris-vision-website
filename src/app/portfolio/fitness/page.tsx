import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Iron District Fitness — Gym Demo | ${SITE.name} Portfolio`,
};

const plans = [
  {
    name: "Flex",
    price: "$39",
    desc: "Month-to-month access. No commitment.",
    features: ["Full gym floor access", "Locker room & showers", "App-based check-in", "Group class add-ons available"],
    highlight: false,
  },
  {
    name: "Committed",
    price: "$59",
    desc: "6-month agreement. Best value for regulars.",
    features: ["Everything in Flex", "Unlimited group classes", "1 personal training session/mo", "Nutrition tracking app"],
    highlight: true,
  },
  {
    name: "Elite",
    price: "$129",
    desc: "Full access, coaching included.",
    features: ["Everything in Committed", "4 PT sessions/month", "Priority class booking", "Body composition scans", "Recovery suite access"],
    highlight: false,
  },
];

const classes = [
  { name: "HIIT Circuit", time: "6:00 AM", trainer: "Coach Darius", spots: "12/16", day: "Mon · Wed · Fri" },
  { name: "Powerlifting Fundamentals", time: "7:30 AM", trainer: "Coach Tanya", spots: "8/10", day: "Tue · Thu" },
  { name: "Yoga & Mobility", time: "9:00 AM", trainer: "Instructor Priya", spots: "14/20", day: "Mon · Wed · Sat" },
  { name: "Boxing Conditioning", time: "5:30 PM", trainer: "Coach Jerome", spots: "9/12", day: "Tue · Thu · Sat" },
];

export default function FitnessPage() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0a0a0a", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Demo Banner */}
      <div className="border-b border-white/5 py-2 text-center text-xs font-semibold text-gray-500">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-white underline hover:text-gray-300">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-gray-600 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#22c55e]">
              <span className="text-xs font-black text-black">ID</span>
            </div>
            <span className="text-lg font-black tracking-tight text-white uppercase" style={{ letterSpacing: "0.05em" }}>Iron District</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-semibold text-gray-400 sm:flex uppercase tracking-wide">
            <a href="#classes" className="hover:text-[#22c55e] transition-colors">Classes</a>
            <a href="#plans" className="hover:text-[#22c55e] transition-colors">Pricing</a>
            <a href="#join" className="hover:text-[#22c55e] transition-colors">Join</a>
            <a href="#join" className="rounded bg-[#22c55e] px-5 py-2 text-xs font-black text-black hover:bg-green-400 transition-colors">Start Free Trial</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-32">
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #22c55e, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #22c55e, transparent 70%)", filter: "blur(80px)" }} />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-1.5 text-sm font-semibold text-[#22c55e]">
              <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
              OKC&apos;s Most Results-Driven Gym
            </div>
            <h1 className="mb-6 text-6xl font-black leading-none uppercase sm:text-8xl" style={{ letterSpacing: "-0.03em" }}>
              Train<br />
              <span className="text-[#22c55e]">Harder.</span><br />
              Recover<br />Smarter.
            </h1>
            <p className="mb-10 text-lg text-gray-400 leading-relaxed max-w-lg">
              15,000 sq ft of serious equipment, expert coaching, and a community built around real results. No fluff. No posers. Just work.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#join" className="rounded bg-[#22c55e] px-8 py-3.5 text-sm font-black text-black uppercase tracking-wide hover:bg-green-400 transition-colors">7-Day Free Trial</a>
              <a href="#plans" className="rounded border border-white/10 px-8 py-3.5 text-sm font-black text-white uppercase tracking-wide hover:bg-white/5 transition-colors">See Pricing</a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-white/[0.03] px-6 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            { stat: "2,400+", label: "Active Members" },
            { stat: "18", label: "Weekly Classes" },
            { stat: "15K sqft", label: "Training Floor" },
            { stat: "4.9 ★", label: "Google Rating" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-3xl font-black text-[#22c55e]">{item.stat}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Classes */}
      <section id="classes" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-[#22c55e]">Schedule</p>
            <h2 className="text-4xl font-black uppercase text-white" style={{ letterSpacing: "-0.02em" }}>This Week&apos;s Classes</h2>
            <p className="mt-3 text-gray-500">Reserve your spot in the app. Classes fill fast.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((cls) => (
              <div key={cls.name} className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] p-5 hover:border-[#22c55e]/30 hover:bg-white/[0.07] transition-all">
                <div>
                  <h3 className="font-black text-white text-lg">{cls.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{cls.trainer} · {cls.day}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-bold text-[#22c55e]">{cls.time}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cls.spots} spots</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section id="plans" className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-[#22c55e]">Membership</p>
            <h2 className="text-4xl font-black uppercase text-white" style={{ letterSpacing: "-0.02em" }}>Pick Your Plan</h2>
            <p className="mt-3 text-gray-500">No contracts on Flex. Upgrade or cancel anytime.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-6 ${plan.highlight ? "border-[#22c55e]/60 bg-[#22c55e]/5" : "border-white/8 bg-white/[0.03]"}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#22c55e] px-4 py-0.5 text-xs font-black text-black uppercase">Best Value</div>
                )}
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 mb-1">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="mt-0.5 text-[#22c55e] font-bold shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#join"
                  className={`block rounded py-2.5 text-center text-sm font-black uppercase tracking-wide transition-colors ${plan.highlight ? "bg-[#22c55e] text-black hover:bg-green-400" : "border border-white/10 text-white hover:bg-white/5"}`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section id="join" className="px-6 py-20 border-t border-white/5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-4xl font-black uppercase text-white" style={{ letterSpacing: "-0.02em" }}>Start Your 7-Day Trial</h2>
          <p className="mb-10 text-gray-500">No credit card needed. Just show up. If you&apos;re not in, no charge.</p>
          <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-8 text-left">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">First Name</label><div className="h-10 rounded border border-white/10 bg-white/[0.05]" /></div>
              <div><label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Last Name</label><div className="h-10 rounded border border-white/10 bg-white/[0.05]" /></div>
              <div><label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Email</label><div className="h-10 rounded border border-white/10 bg-white/[0.05]" /></div>
              <div><label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">Phone</label><div className="h-10 rounded border border-white/10 bg-white/[0.05]" /></div>
            </div>
            <button className="mt-6 w-full rounded bg-[#22c55e] py-3 text-sm font-black uppercase tracking-wide text-black hover:bg-green-400 transition-colors">Claim My Free Trial</button>
            <p className="mt-3 text-center text-xs text-gray-600">We&apos;ll reach out within a few hours to set up your first visit.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-black px-6 py-8 text-center text-sm text-gray-600">
        <p className="font-black uppercase tracking-widest text-white">Iron District Fitness</p>
        <p className="mt-1">3401 N Western Ave, Oklahoma City, OK · (405) 555-0349</p>
        <p className="mt-4 text-xs text-gray-700">
          Demo site built by{" "}
          <Link href="/portfolio" className="text-gray-500 hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-gray-600 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>
    </div>
  );
}
