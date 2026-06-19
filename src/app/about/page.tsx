import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { SITE, SAM } from "@/lib/constants";

export const metadata = {
  title: `About | ${SITE.name}`,
  description:
    `Meet the team behind ${SITE.name}: 35 years of operational meteorology, USAF expertise, and AI/ML integration for complex operational systems.`,
};

/* Service-history timeline — era labels only where dates are verified. */
const timeline = [
  {
    era: "1988–1998",
    title: "United States Air Force",
    desc: "Weather forecaster supporting real-world operations under conditions that left no room for guesswork.",
  },
  {
    era: "Post-service",
    title: "Research in Sweden",
    desc: "Atmospheric modeling and environmental science at Stockholm University and Chalmers University of Technology, culminating in a Ph.D. in atmospheric and environmental science.",
  },
  {
    era: "Applied years",
    title: "AI & NWP Engineering",
    desc: "Building AI and numerical weather prediction systems, along with custom software, that turn large, messy datasets into clear, usable answers.",
  },
  {
    era: "Today",
    title: "Aetheris Vision LLC",
    desc: "A veteran-owned firm in Mustang, Oklahoma, bringing engineering discipline to complex operational systems and practical, well-built software for small businesses.",
  },
];

const registrations = [
  { label: "AMS Certified Consulting Meteorologist (CCM)", detail: "One of ~600 active nationwide (Achieved June 2026)" },
  { label: "U.S. Government Secret Clearance", detail: "Held" },
  { label: "SDVOSB / VOSB Eligible", detail: "Service-Disabled Veteran-Owned Small Business" },
  { label: "SAM.gov Registration", detail: `Active · UEI ${SAM.uei} · CAGE ${SAM.cage}` },
  { label: "8(a) Eligible", detail: "SBA program · application opens 2027" },
  { label: "Operational Experience", detail: "35+ years · global atmospheric modeling & forecasting" },
];

const focusAreas = [
  {
    label: "Operational Meteorology",
    desc: "35+ years of operational meteorology and global atmospheric modeling.",
  },
  {
    label: "AI / ML Integration",
    desc: "Applied machine learning on large-scale meteorological datasets for operational systems.",
  },
  {
    label: "Academic Collaboration",
    desc: "Research partnerships with Stockholm University and Chalmers University of Technology.",
  },
  {
    label: "Cleared Federal Work",
    desc: "U.S. Government Secret clearance held; VOSB eligible with an active SAM.gov registration.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-6">

          {/* Editorial header */}
          <FadeIn>
            <header className="mb-16 max-w-3xl">
              <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-4">
                Our Story
              </p>
              <h1 className="font-serif text-4xl md:text-6xl text-white tracking-tight leading-[1.08] mb-6">
                Thirty-five years of reading the sky,{" "}
                <em className="text-gray-400">now building the systems that do it.</em>
              </h1>
              <div className="h-px w-12 bg-blue-500/50" />
            </header>
          </FadeIn>

          {/* Narrative + sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            <FadeIn delay={0.1} className="md:col-span-2">
              <article>
                <h2 className="text-xl font-medium text-white mb-1">Founder &amp; Chief Meteorologist</h2>
                <p className="text-sm text-blue-400 font-semibold tracking-widest uppercase mb-8">
                  Aetheris Vision LLC
                </p>

                {/* Narrative lead — larger serif measure */}
                <p className="font-serif text-xl md:text-2xl text-gray-200 leading-relaxed mb-8">
                  Our founder is an AMS Certified Consulting Meteorologist (CCM), holds a Ph.D. in atmospheric and environmental science, and brings more than 35 years of operational meteorology to Aetheris Vision. His career began as a United States Air Force weather forecaster, where he supported real-world operations under conditions that left no room for guesswork.
                </p>

                <div className="space-y-5 text-gray-400 font-light leading-relaxed">
                  <p>
                    After his military service, he pursued research at <strong className="text-gray-200">Stockholm University</strong> and <strong className="text-gray-200">Chalmers University of Technology</strong>, deepening his work in atmospheric modeling and environmental science alongside academic collaborators in Sweden.
                  </p>
                  <p>
                    Today his focus is engineering: building AI and numerical weather prediction (NWP) systems, along with custom software, that turn large, messy datasets into clear, usable answers.
                  </p>
                </div>

                {/* Pull quote — the throughline */}
                <figure className="my-10 border-y border-white/10 py-8">
                  <blockquote className="font-serif text-2xl md:text-3xl text-white leading-snug">
                    &ldquo;Understand the problem deeply, then build something that holds up in the field.&rdquo;
                  </blockquote>
                  <figcaption className="mt-3 text-sm text-gray-500 font-light">
                    The throughline across every stage of a 35-year career.
                  </figcaption>
                </figure>

                <div className="space-y-5 text-gray-400 font-light leading-relaxed">
                  <p>
                    He founded Aetheris Vision to bring that engineering discipline to two kinds of work: complex operational systems that have to perform under pressure, and practical, well-built websites and software for small businesses. Both deserve the same care and the same honest, plainspoken approach.
                  </p>
                </div>

                {/* Service-history timeline */}
                <h2 className="mt-16 mb-8 font-serif text-2xl md:text-3xl text-white tracking-tight">
                  Service History
                </h2>
                <ol className="relative border-l border-white/10 pl-8 space-y-10">
                  {timeline.map((t) => (
                    <li key={t.title} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[37px] top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-[#050505]"
                      />
                      <p className="font-mono text-[11px] uppercase tracking-wider text-blue-400 mb-1">{t.era}</p>
                      <h3 className="text-white font-medium mb-1.5">{t.title}</h3>
                      <p className="text-sm text-gray-400 font-light leading-relaxed">{t.desc}</p>
                    </li>
                  ))}
                </ol>
              </article>
            </FadeIn>

            {/* Sidebar — portrait slot + registrations */}
            <FadeIn delay={0.2}>
              <aside className="md:sticky md:top-28 space-y-8">
                {/*
                  Portrait slot. No founder photo exists yet — the field-research
                  image stands in and the layout reads correctly either way.
                  Swap src for a real portrait when one is available.
                */}
                <figure className="relative rounded-xl border border-white/5 overflow-hidden aspect-[4/5]">
                  <Image
                    src="/images/about/field-research-balloon.webp"
                    alt="NOAA researchers launching an ozonesonde weather balloon at a polar research station at dusk"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/85 via-transparent to-transparent" />
                  <figcaption className="absolute bottom-3 left-4 right-4 text-xs text-gray-400 font-light">
                    Atmospheric science is fieldwork: an ozonesonde launch at a polar station. (NOAA)
                  </figcaption>
                </figure>

                <div>
                  <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">
                    Credentials &amp; Registrations
                  </p>
                  <dl className="divide-y divide-white/10 border-y border-white/10">
                    {registrations.map((r) => (
                      <div key={r.label} className="py-3">
                        <dt className="text-sm text-white font-medium">{r.label}</dt>
                        <dd className="text-xs text-gray-500 mt-0.5 font-light">{r.detail}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </aside>
            </FadeIn>
          </div>

          {/* Focus areas — editorial definition list, no cards */}
          <FadeIn>
            <h2 className="font-serif text-2xl md:text-3xl text-white tracking-tight mb-8">
              Where We Focus
            </h2>
          </FadeIn>
          <FadeIn delay={0.05}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 mb-20 border-t border-white/10 pt-8">
              {focusAreas.map((item) => (
                <div key={item.label}>
                  <dt className="text-white font-medium mb-1.5">{item.label}</dt>
                  <dd className="text-sm text-gray-400 font-light leading-relaxed">{item.desc}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>

          {/* Company name — editorial treatment */}
          <FadeIn>
            <section className="border-t border-white/10 pt-12 max-w-3xl">
              <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-4">Our Name</p>
              <h2 className="font-serif text-2xl md:text-3xl text-white tracking-tight mb-5">
                The Meaning Behind <em className="text-gray-400">Aetheris</em>
              </h2>
              <p className="text-gray-400 font-light leading-relaxed mb-4">
                Derived from <em className="text-white">aetheris</em>, a form of the Latin <em className="text-white">aether</em>{' '}(from the Greek <em className="text-white">aith&#275;r</em>, the bright upper air of the heavens, the pure air breathed by the gods), our name reflects a commitment to mapping the unknown with clarity and precision.
              </p>
              <p className="text-gray-400 font-light leading-relaxed">
                In ancient philosophy, aether was the fifth element filling the universe above the terrestrial sphere. For us, it represents the convergence of 35 years of deep operational expertise with a vision for the future: bringing structure, clarity, and advanced AI/ML capabilities to the systems that chart the skies, space, and earth.
              </p>
            </section>
          </FadeIn>

          {/* CTA */}
          <FadeIn delay={0.1}>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <a
                href="/book"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition"
              >
                Book a Consultation
              </a>
              <a
                href="/capabilities"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white hover:bg-white/5 transition"
              >
                View Capabilities Statement
              </a>
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
}
