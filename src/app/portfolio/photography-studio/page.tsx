import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Lumen & Co. Photography — Creative Studio Demo | ${SITE.name} Portfolio`,
};

const gallery = [
  { label: "Wedding — The Skirvin Hilton", tag: "Wedding", gradient: "from-stone-700 to-stone-900" },
  { label: "Senior Portraits — Lake Hefner", tag: "Portrait", gradient: "from-amber-900 to-stone-900" },
  { label: "Corporate Headshots — Smith & Reed", tag: "Commercial", gradient: "from-zinc-700 to-zinc-900" },
  { label: "Family Session — Myriad Gardens", tag: "Family", gradient: "from-stone-600 to-stone-800" },
  { label: "Editorial Fashion — Bricktown Lofts", tag: "Editorial", gradient: "from-amber-800 to-stone-900" },
  { label: "Newborn Lifestyle — In-Home", tag: "Newborn", gradient: "from-stone-500 to-stone-800" },
];

const packages = [
  {
    name: "Portrait Session",
    price: "$295",
    desc: "Ideal for individuals, seniors, and headshots.",
    features: [
      "1-hour session",
      "2 wardrobe looks",
      "30 fully edited images",
      "Private online gallery",
      "Print-release included",
    ],
    highlight: false,
  },
  {
    name: "Full Experience",
    price: "$595",
    desc: "Our most popular package — weddings, families, brands.",
    features: [
      "Up to 3-hour session",
      "Unlimited wardrobe looks",
      "75 fully edited images",
      "Private online gallery",
      "1 complimentary 11×14 canvas print",
      "Commercial print release",
    ],
    highlight: true,
  },
  {
    name: "Commercial / Brand",
    price: "$1,200",
    desc: "Half-day shoot for businesses, campaigns, and content.",
    features: [
      "4-hour session",
      "Full commercial license",
      "150+ edited images",
      "Brand asset pack (web + print)",
      "Rush 48-hr turnaround available",
      "On-site or studio location",
    ],
    highlight: false,
  },
];

const testimonials = [
  {
    quote: "Mariah captured our wedding exactly the way we dreamed it. Every photo tells the story of our day perfectly.",
    name: "Sarah & Tom Whitfield",
    detail: "Wedding — June 2024",
    initials: "SW",
  },
  {
    quote: "Our team headshots finally look like we belong on our own website. Professional, warm, and fast turnaround.",
    name: "Daniel Reeves",
    detail: "VP Marketing, Greenline Advisors",
    initials: "DR",
  },
  {
    quote: "She made our newborn session so relaxed and easy. The photos are breathtaking — we will treasure them forever.",
    name: "Lucia & Carlos Ramirez",
    detail: "Newborn Session — March 2025",
    initials: "LR",
  },
];

export default function PhotographyStudioPage() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#111111", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Demo Banner */}
      <div className="border-b border-white/5 py-2 text-center text-xs font-semibold text-stone-500">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-white underline hover:text-stone-300">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-stone-600 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-white/5 bg-[#111111]/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded" style={{ background: "linear-gradient(135deg, #c8a882, #a0784a)" }}>
              <span className="text-xs font-bold text-[#111111]">L&</span>
            </div>
            <span className="text-lg font-light tracking-[0.15em] text-white uppercase">Lumen <span style={{ color: "#c8a882" }}>&</span> Co.</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-stone-400 sm:flex">
            <a href="#gallery" className="hover:text-white transition-colors tracking-wide">Gallery</a>
            <a href="#packages" className="hover:text-white transition-colors tracking-wide">Packages</a>
            <a href="#about" className="hover:text-white transition-colors tracking-wide">About</a>
            <a href="#book" className="rounded border px-5 py-2 text-sm font-semibold tracking-wide transition-colors hover:bg-[#c8a882] hover:text-[#111111]" style={{ borderColor: "#c8a882", color: "#c8a882" }}>
              Book a Session
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-36" style={{ background: "linear-gradient(160deg, #1a1a1a 0%, #111111 60%, #0d0d0d 100%)" }}>
        {/* Decorative gold orb */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10">
          <div className="h-full w-full" style={{ background: "radial-gradient(ellipse at 80% 30%, #c8a882, transparent 55%)" }} />
        </div>
        <div className="mx-auto max-w-5xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "#c8a882" }}>
            Oklahoma City · Fine Art Photography
          </p>
          <h1 className="mb-6 text-5xl font-extralight leading-tight tracking-tight text-white sm:text-7xl">
            Every Frame<br />
            <span className="font-semibold italic" style={{ color: "#c8a882" }}>Tells a Story.</span>
          </h1>
          <p className="mb-10 max-w-xl text-lg font-light leading-relaxed text-stone-400">
            Weddings, portraits, editorial, and commercial work — crafted with intention and delivered with care.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#book" className="rounded px-10 py-3 text-sm font-semibold uppercase tracking-widest text-[#111111] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #c8a882, #a0784a)" }}>
              Book a Session
            </a>
            <a href="#gallery" className="rounded border border-white/20 px-10 py-3 text-sm font-semibold uppercase tracking-widest text-white hover:border-white/50 transition-colors">
              View Gallery
            </a>
          </div>
        </div>
      </section>

      {/* Style callout */}
      <section className="border-y border-white/5 px-6 py-6" style={{ background: "#0d0d0d" }}>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-x-10 gap-y-3 text-xs font-semibold uppercase tracking-[0.2em]">
            <span style={{ color: "#c8a882" }}>Theme — Dark Gallery Aesthetic</span>
            <span className="text-stone-600">|</span>
            <span className="text-stone-400">Style — Minimal Sans · Full-Bleed Imagery · Warm Gold Accents</span>
            <span className="text-stone-600">|</span>
            <span className="text-stone-400">Best For — Photographers · Creative Studios · Artists · Videographers</span>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#c8a882" }}>Portfolio</p>
            <h2 className="text-3xl font-light tracking-tight text-white sm:text-4xl">Recent Work</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <div key={item.label} className="group relative overflow-hidden rounded-lg cursor-pointer">
                <div className={`h-56 bg-gradient-to-br ${item.gradient} flex items-end p-5 transition-all duration-500 group-hover:scale-105`}>
                  <div>
                    <span className="mb-2 inline-block rounded border border-white/20 bg-black/40 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white/70 backdrop-blur">
                      {item.tag}
                    </span>
                    <p className="text-sm font-light text-white/90">{item.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="px-6 py-24" style={{ background: "#0d0d0d" }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#c8a882" }}>Investment</p>
            <h2 className="text-3xl font-light tracking-tight text-white sm:text-4xl">Session Packages</h2>
            <p className="mt-3 font-light text-stone-500">All packages include a private online gallery and high-resolution downloads.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className="flex flex-col rounded-xl border p-8 transition-all"
                style={{
                  borderColor: pkg.highlight ? "#c8a882" : "rgba(255,255,255,0.06)",
                  background: pkg.highlight ? "linear-gradient(160deg, #1e1810, #1a1a1a)" : "#161616",
                }}
              >
                {pkg.highlight && (
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "#c8a882" }}>Most Popular</p>
                )}
                <h3 className="mb-1 text-lg font-semibold text-white">{pkg.name}</h3>
                <p className="mb-4 text-sm font-light text-stone-500">{pkg.desc}</p>
                <p className="mb-6 text-4xl font-extralight text-white">{pkg.price}</p>
                <ul className="flex-1 space-y-2.5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm font-light text-stone-300">
                      <span className="mt-0.5 shrink-0 text-xs" style={{ color: "#c8a882" }}>✦</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#book" className="mt-8 block rounded py-2.5 text-center text-sm font-semibold uppercase tracking-widest transition-all"
                  style={{
                    background: pkg.highlight ? "linear-gradient(135deg, #c8a882, #a0784a)" : "transparent",
                    color: pkg.highlight ? "#111111" : "#c8a882",
                    border: pkg.highlight ? "none" : "1px solid #c8a882",
                  }}>
                  Book Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-16 sm:grid-cols-2 items-center">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#c8a882" }}>About</p>
              <h2 className="mb-5 text-3xl font-light tracking-tight text-white">Hi, I&apos;m Mariah Lumen.</h2>
              <p className="mb-4 font-light leading-relaxed text-stone-400">
                I&apos;ve spent over a decade photographing the moments that matter most — weddings, new families, professional milestones, and creative campaigns across Oklahoma City and beyond.
              </p>
              <p className="font-light leading-relaxed text-stone-500">
                My approach is unhurried and intentional. I believe the best photographs come from genuine connection, not manufactured poses. Every session is designed to feel as natural as the light I shoot in.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="h-72 w-64 rounded-xl" style={{ background: "linear-gradient(160deg, #2d2d2d, #1a1a1a)", border: "1px solid rgba(200,168,130,0.15)" }}>
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #c8a882, #a0784a)" }}>
                      <span className="text-2xl font-bold text-[#111111]">ML</span>
                    </div>
                    <p className="text-sm font-semibold text-white">Mariah Lumen</p>
                    <p className="text-xs font-light text-stone-500">Lead Photographer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24" style={{ background: "#0d0d0d" }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#c8a882" }}>Testimonials</p>
            <h2 className="text-3xl font-light tracking-tight text-white">What Clients Say</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-white/5 p-7" style={{ background: "#161616" }}>
                <p className="mb-6 text-sm font-light leading-relaxed text-stone-300">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#111111]"
                    style={{ background: "linear-gradient(135deg, #c8a882, #a0784a)" }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs font-light text-stone-500">{t.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="book" className="px-6 py-24" style={{ background: "#111111" }}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#c8a882" }}>Get in Touch</p>
          <h2 className="mb-3 text-3xl font-light tracking-tight text-white">Book Your Session</h2>
          <p className="mb-12 font-light text-stone-500">Tell us a little about what you have in mind and we&apos;ll reach out within 24 hours.</p>
          <div className="rounded-2xl border border-white/6 p-8 text-left" style={{ background: "#161616" }}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Your Name</label>
                <div className="h-11 rounded-lg border border-white/8 bg-white/5" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Email Address</label>
                <div className="h-11 rounded-lg border border-white/8 bg-white/5" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Session Type</label>
                <div className="h-11 rounded-lg border border-white/8 bg-white/5" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Preferred Date</label>
                <div className="h-11 rounded-lg border border-white/8 bg-white/5" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Tell Us More</label>
                <div className="h-24 rounded-lg border border-white/8 bg-white/5" />
              </div>
            </div>
            <button className="mt-6 w-full rounded-lg py-3 text-sm font-semibold uppercase tracking-widest text-[#111111] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #c8a882, #a0784a)" }}>
              Send Inquiry
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-stone-500" style={{ background: "#0d0d0d" }}>
        <p className="font-semibold text-white tracking-wide">Lumen & Co. Photography</p>
        <p className="mt-1">Oklahoma City, OK · (405) 555-0242 · hello@lumenandco.demo</p>
        <p className="mt-4 text-xs text-stone-700">
          Demo site built by{" "}
          <Link href="/portfolio" className="text-stone-500 hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-stone-600 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>

    </div>
  );
}
