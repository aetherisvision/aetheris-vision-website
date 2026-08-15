import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { AMS_PROFILE_URL, SITE, SAM } from "@/lib/constants";

export const metadata = {
  title: `About | ${SITE.name}`,
  description:
    `${SITE.name} brings operational weather, international research, industry delivery, and applied AI experience to complex consulting engagements.`,
};

const timeline = [
  {
    era: "1988–1998",
    title: "United States Air Force",
    desc: "Operational weather forecasting in environments where timing, clarity, and sound judgment mattered.",
  },
  {
    era: "Sweden",
    title: "Research & Academic Work",
    desc: "Atmospheric and environmental science across Stockholm University MISU, Chalmers University of Technology, and the University of Gothenburg.",
  },
  {
    era: "International Industry",
    title: "Technical Delivery",
    desc: "Weather work at SMHI, healthcare technology delivery at Findwise, and software experience at Veoneer.",
  },
  {
    era: "Today",
    title: "Aetheris Vision LLC",
    desc: "Specialist consulting for organizations working with weather, Earth-system, geospatial, data, software, and decision-support challenges.",
  },
];

const credentials = [
  {
    label: "AMS Certified Consulting Meteorologist",
    detail: "CCM credential achieved June 2026",
  },
  {
    label: "Atmospheric & Environmental Science",
    detail: "PhD with international academic and research experience",
  },
  {
    label: "Applied Artificial Intelligence",
    detail: "MSc candidate, University of San Diego, expected January 2027",
  },
  {
    label: "U.S. Government Secret Clearance",
    detail: "Active clearance held by the principal",
  },
  {
    label: "SDVOSB / VOSB",
    detail: "SBA VetCert application pending",
  },
  {
    label: "HUBZone",
    detail: "Eligibility confirmed; certification pending",
  },
  {
    label: "SAM.gov Registration",
    detail: `Active · UEI ${SAM.uei} · CAGE ${SAM.cage}`,
  },
];

const focusAreas = [
  {
    label: "Weather & Earth-System Advisory",
    desc: "Operational meteorology, atmospheric modeling, environmental data, and technical interpretation.",
  },
  {
    label: "Geospatial Data & Analysis",
    desc: "Data preparation, transformation, validation, and decision support for location-based work.",
  },
  {
    label: "Applied AI & Technical Delivery",
    desc: "Practical AI assessment, scientific workflows, custom software, and implementation support.",
  },
  {
    label: "Web & Digital Delivery",
    desc: "Maintainable websites, portals, integrations, and supported workflows when the consulting outcome needs a digital home.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pb-16 pt-24 sm:pb-20 sm:pt-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeIn>
            <header className="mb-16 max-w-4xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-500">
                About Aetheris Vision
              </p>
              <h1 className="mb-6 font-serif text-4xl leading-[1.08] tracking-tight text-white md:text-6xl">
                Principal-led consulting for difficult environmental and technical work
              </h1>
              <p className="max-w-3xl text-lg font-light leading-relaxed text-gray-400">
                Aetheris Vision combines operational weather judgment, Earth-system and geospatial
                expertise, applied AI, and practical delivery.
              </p>
            </header>
          </FadeIn>

          <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-3">
            <FadeIn delay={0.1} className="md:col-span-2">
              <article>
                <h2 className="mb-1 text-xl font-medium text-white">Marston Ward, PhD, CCM</h2>
                <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-blue-400">
                  Founder &amp; Principal Consultant
                </p>

                <p className="mb-8 font-serif text-xl leading-relaxed text-gray-200 md:text-2xl">
                  Marston brings more than 35 years of experience connecting atmospheric science,
                  operational judgment, international research, and practical technology delivery.
                </p>

                <div className="space-y-5 font-light leading-relaxed text-gray-400">
                  <p>
                    His career began as a United States Air Force weather forecaster supporting
                    real-world operations. He later worked across Sweden with organizations including
                    <strong className="text-gray-200"> SMHI</strong>,
                    <strong className="text-gray-200"> Stockholm University MISU</strong>,
                    <strong className="text-gray-200"> Chalmers University of Technology</strong>, and
                    the <strong className="text-gray-200">University of Gothenburg</strong>.
                  </p>
                  <p>
                    His international industry experience includes technical delivery for healthcare
                    at <strong className="text-gray-200">Findwise</strong> and software work at
                    <strong className="text-gray-200"> Veoneer</strong>. He is also completing an MSc in
                    Applied Artificial Intelligence at the University of San Diego, expected January 2027.
                  </p>
                  <p>
                    Aetheris Vision applies that range as a consultancy. The aim is to understand the
                    decision, challenge weak assumptions, do the technical work, and deliver a result
                    the client can use.
                  </p>
                  <p>
                    Organizations named here reflect Marston&apos;s prior experience and education, not
                    necessarily Aetheris Vision client engagements.
                  </p>
                </div>

                <figure className="my-10 border-y border-white/10 py-8">
                  <blockquote className="font-serif text-2xl leading-snug text-white md:text-3xl">
                    &ldquo;Understand the problem deeply, then deliver work that holds up in practice.&rdquo;
                  </blockquote>
                </figure>

                <h2 className="mb-8 mt-16 font-serif text-2xl tracking-tight text-white md:text-3xl">
                  Experience
                </h2>
                <ol className="relative space-y-10 border-l border-white/10 pl-8">
                  {timeline.map((item) => (
                    <li key={item.title} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[37px] top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-[#050505]"
                      />
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-blue-400">
                        {item.era}
                      </p>
                      <h3 className="mb-1.5 font-medium text-white">{item.title}</h3>
                      <p className="text-sm font-light leading-relaxed text-gray-400">{item.desc}</p>
                    </li>
                  ))}
                </ol>
              </article>
            </FadeIn>

            <FadeIn delay={0.2}>
              <aside className="space-y-8 md:sticky md:top-28">
                <figure className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/5 bg-[#F3F7F9]">
                  <Image
                    src="/images/about/marston-ward-ams-ccm.webp"
                    alt="Marston Ward, founder and principal consultant of Aetheris Vision LLC"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/85 via-transparent to-transparent" />
                  <figcaption className="absolute bottom-3 left-4 right-4 text-xs font-light text-gray-400">
                    Marston Ward, PhD, CCM
                  </figcaption>
                </figure>

                <div>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Credentials &amp; Registrations
                  </p>
                  <dl className="divide-y divide-white/10 border-y border-white/10">
                    {credentials.map((item) => (
                      <div key={item.label} className="py-3">
                        <dt className="text-sm font-medium text-white">{item.label}</dt>
                        <dd className="mt-0.5 text-xs font-light text-gray-500">{item.detail}</dd>
                      </div>
                    ))}
                  </dl>
                  <a
                    href={AMS_PROFILE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 flex items-center gap-4 rounded-xl border border-blue-500/25 bg-blue-500/5 p-4 transition hover:border-blue-400/50 hover:bg-blue-500/10"
                  >
                    <Image
                      src="/images/credentials/ams-profile-qr.png"
                      alt="QR code for the AMS CCM Directory"
                      width={88}
                      height={88}
                      className="rounded bg-white p-1"
                    />
                    <span>
                      <span className="block text-sm font-medium text-white">AMS CCM Directory</span>
                      <span className="mt-1 block text-xs font-light leading-relaxed text-gray-400">
                        Scan to explore the active directory listing.
                      </span>
                    </span>
                  </a>
                </div>
              </aside>
            </FadeIn>
          </div>

          <FadeIn>
            <h2 className="mb-8 font-serif text-2xl tracking-tight text-white md:text-3xl">
              Where We Focus
            </h2>
          </FadeIn>
          <FadeIn delay={0.05}>
            <dl className="mb-20 grid grid-cols-1 gap-x-12 gap-y-8 border-t border-white/10 pt-8 sm:grid-cols-2">
              {focusAreas.map((item) => (
                <div key={item.label}>
                  <dt className="mb-1.5 font-medium text-white">{item.label}</dt>
                  <dd className="text-sm font-light leading-relaxed text-gray-400">{item.desc}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>

          <FadeIn>
            <section className="max-w-3xl border-t border-white/10 pt-12">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-500">Our Name</p>
              <h2 className="mb-5 font-serif text-2xl tracking-tight text-white md:text-3xl">
                The Meaning Behind <em className="text-gray-400">Aetheris</em>
              </h2>
              <p className="font-light leading-relaxed text-gray-400">
                Derived from the Latin <em className="text-white">aether</em>, the bright upper air,
                the name reflects a commitment to bringing clarity and structure to difficult work
                involving the atmosphere, Earth systems, data, and technology.
              </p>
            </section>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <a
                href="/contact#contact-form"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition hover:bg-gray-200"
              >
                Discuss a Project
              </a>
              <a
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Explore Services
              </a>
            </div>
          </FadeIn>
        </div>
      </main>

      <Footer />
    </div>
  );
}
