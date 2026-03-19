import { ArrowRightIcon, GlobeAltIcon, CpuChipIcon, ShieldCheckIcon, ChartBarIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import HeroVideo from "@/components/HeroVideo";
import SatelliteDisplay, { type SatelliteSource } from "@/components/SatelliteDisplay";

export const revalidate = 3600;

/** Route an external satellite image URL through our same-origin proxy. */
function sat(url: string) {
  return `/api/satellite?url=${encodeURIComponent(url)}`;
}

// Geostationary satellite full disk images
const STATIC_SOURCES: SatelliteSource[] = [
  {
    url: sat("https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/678x678.jpg"),
    label: "GOES-16 East",
    region: "Americas · Atlantic",
  },
  {
    url: sat("https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/678x678.jpg"),
    label: "GOES-18 West",
    region: "Americas · Pacific",
  },
  {
    // MSG Prime - Europe/Africa coverage
    url: sat("https://view.eumetsat.int/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&layers=msg_fes:rgb_naturalenhncd&format=image/jpeg&crs=EPSG:4326&bbox=-77,-77,77,77&width=1000&height=1000"),
    label: "MSG Prime",
    region: "Europe · Africa",
  },
  {
    // MSG Indian Ocean - Indian Ocean coverage
    url: sat("https://view.eumetsat.int/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&layers=iodc_fes:rgb_naturalenhncd&format=image/jpeg&crs=EPSG:4326&bbox=-77,-77,77,77&width=1000&height=1000"),
    label: "MSG Indian Ocean",
    region: "Indian Ocean · Asia",
  },
];



function getHimawariSource(): SatelliteSource {
  // Himawari-9 captures every 10 min; images available ~20 min after capture.
  // Compute the most likely latest tile without calling the API, so this
  // works even when Vercel can't reach himawari8.nict.go.jp.
  const t = new Date(Date.now() - 20 * 60 * 1000); // 20-min lag
  const y = t.getUTCFullYear();
  const mo = String(t.getUTCMonth() + 1).padStart(2, "0");
  const d = String(t.getUTCDate()).padStart(2, "0");
  const h = String(t.getUTCHours()).padStart(2, "0");
  const min = String(Math.floor(t.getUTCMinutes() / 10) * 10).padStart(2, "0");
  const url = sat(
    `https://himawari8.nict.go.jp/img/D531106/1d/550/${y}/${mo}/${d}/${h}${min}00_0_0.png`
  );
  return { url, label: "Himawari-9", region: "Asia · Pacific" };
}



export const metadata = {
  title: `${SITE.name} | ${SITE.tagline}`,
  description:
    "Advanced AI/ML weather prediction, operational meteorology, and specialized technical consulting for state and federal defense missions via VOSB and 8(a) pathways.",
};

export default async function Home() {
  const sources: SatelliteSource[] = [
    ...STATIC_SOURCES,
    getHimawariSource(),
  ];
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />

      {/* Hero Section */}
      <main id="main" className="flex-1">
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
          <HeroVideo />

          {/* Fallback static image (shows when video file is absent or unsupported) */}
          <div className="absolute inset-0 -z-[21]">
            <Image
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2500"
              alt=""
              aria-hidden="true"
              fill
              className="object-cover opacity-50 contrast-125"
              priority
              sizes="100vw"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c0f]/40 via-[#0d0c0f]/90 to-[#0d0c0f] -z-10" />

          <SatelliteDisplay sources={sources} />
          
          <div className="mx-auto max-w-5xl px-6 relative z-10">
            <FadeIn delay={0.1}>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 mb-8 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                VOSB, 8(a) Ready & Active Secret Clearance
              </div>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-white mb-6 leading-[1.1]">
                Predictive Clarity <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
                  At The Highest Level.
                </span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.3}>
              <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-10 leading-relaxed font-light">
                Providing advanced AI/ML weather prediction algorithms, deep operational meteorology insight, and specialized technical consulting for state agencies and federal defense missions via 8(a) and VOSB pathways.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/book"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200"
                >
                  Book a Consultation
                </a>
                <a 
                  href="#expertise"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-white/5"
                >
                  View Expertise <ArrowRightIcon className="ml-2 h-4 w-4" />
                </a>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* About Our Name & Philosophy Section */}
        <section id="about" className="py-24 bg-[#111014] border-t border-white/5 relative overflow-hidden">
          {/* Subtle atmospheric background */}
          <div className="absolute inset-0 -z-20">
            <Image 
              src="https://images.unsplash.com/photo-1534152011036-7cbdb43088ac?q=80&w=2500" 
              alt="Atmospheric Weather Patterns" 
              fill
              className="object-cover opacity-[0.15] mix-blend-screen"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0c0f] via-[#0d0c0f]/80 to-transparent -z-10" />

          <div className="mx-auto max-w-5xl px-6">
            <div className="max-w-2xl">
              <FadeIn delay={0}>
                <h2 className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Our Philosophy</h2>
                <h3 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-6">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Aetheris</span> Vision
                </h3>
              </FadeIn>
              
              <FadeIn delay={0.15}>
                <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed mb-6">
                  Derived from the ancient Latin and Greek word <span className="text-white italic">aetheris</span>—meaning "the clear sky" or "the pure, fresh air breathed by the gods"—our name reflects a profound commitment to mapping the unknown.
                </p>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <div className="h-px w-12 bg-blue-500/50 mb-6"></div>
                
                <p className="text-base text-gray-400 font-light leading-relaxed mb-8">
                  In ancient philosophy, aether was the fifth element that filled the universe above the terrestrial sphere. For our business, it represents 35 years of deep operational meteorology expertise paired with a vision for the future: bringing clarity, structure, and advanced AI/ML capabilities to highly complex government and enterprise systems charting the skies, space, and earth.
                </p>
              </FadeIn>
              
              <FadeIn delay={0.25}>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div> Meteorology</span>
                  <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div> AI Integration</span>
                  <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div> Defense Tech</span>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Expertise Grid */}
        <section id="expertise" className="py-24 bg-[#0d0c0f] border-t border-white/5 relative overflow-hidden">

          <div className="mx-auto max-w-5xl px-6 relative z-10">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-12">Core Competencies</h2>
            </FadeIn>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Card 1 — Operational Meteorology */}
              <FadeIn delay={0.05} direction="up" className="h-full">
              <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 md:p-8 transition hover:bg-white/[0.04] hover:border-white/10 flex flex-col h-full overflow-hidden">
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1527482937786-6608f6f73e1c?q=80&w=1200"
                    alt=""
                    aria-hidden="true"
                    fill
                    className="object-cover opacity-[0.12] mix-blend-screen group-hover:opacity-[0.18] transition-opacity duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center mb-6">
                    <GlobeAltIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium text-white mb-3">Operational Meteorology</h3>
                  <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                    Over 35 years of global atmospheric modeling and operational forecasting. Expertise honed through extensive unclassified strategic deployments with the <strong className="text-gray-200">United States Air Force (USAF)</strong> and research collaborations with <strong className="text-gray-200">Stockholm University</strong> and <strong className="text-gray-200">Chalmers University of Technology</strong>.
                  </p>
                </div>
              </div>
              </FadeIn>

              {/* Card 2 — AI / ML Integration */}
              <FadeIn delay={0.1} direction="up" className="h-full">
              <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 md:p-8 transition hover:bg-white/[0.04] hover:border-white/10 flex flex-col h-full overflow-hidden">
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=1200"
                    alt=""
                    aria-hidden="true"
                    fill
                    className="object-cover opacity-[0.15] mix-blend-screen group-hover:opacity-[0.22] transition-opacity duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center mb-6">
                    <CpuChipIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium text-white mb-3">AI / ML Integration</h3>
                  <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                    Pioneering machine learning techniques tailored for complex, large-scale meteorological datasets to increase predictive accuracy and mission readiness.
                  </p>
                </div>
              </div>
              </FadeIn>

              {/* Card 3 — State & Federal Contracting */}
              <FadeIn delay={0.15} direction="up" className="h-full">
              <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 md:p-8 transition hover:bg-white/[0.04] hover:border-white/10 flex flex-col h-full overflow-hidden">
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1562408590-e32931084e23?q=80&w=1200"
                    alt=""
                    aria-hidden="true"
                    fill
                    className="object-cover opacity-[0.12] mix-blend-screen group-hover:opacity-[0.18] transition-opacity duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center mb-6">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium text-white mb-3">State & Federal Contracting</h3>
                  <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                    Registered in SAM.gov with Active Secret Clearance, VOSB certification, and active 8(a) pathway pursuit. Purpose-built to work directly with state and federal agencies on specialized weather, AI, and defense system requirements.
                  </p>
                </div>
              </div>
              </FadeIn>

              {/* Card 4 — Technical Advisory */}
              <FadeIn delay={0.2} direction="up" className="h-full">
              <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 md:p-8 transition hover:bg-white/[0.04] hover:border-white/10 flex flex-col h-full overflow-hidden">
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=1200"
                    alt=""
                    aria-hidden="true"
                    fill
                    className="object-cover opacity-[0.12] mix-blend-screen group-hover:opacity-[0.18] transition-opacity duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center mb-6">
                    <ChartBarIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium text-white mb-3">Technical Advisory</h3>
                  <p className="text-gray-400 font-light leading-relaxed text-sm md:text-base">
                    Bridging the gap between deep environmental science (PhD level) and scalable software engineering architecture for government and enterprise.
                  </p>
                </div>
              </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="py-24 bg-[#111014] border-t border-white/5">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-10 relative overflow-hidden">
                {/* Glow */}
                <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-xl">
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold tracking-widest uppercase mb-4">
                    <span className="h-px w-6 bg-blue-500"></span> Work With Us
                  </div>
                  <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
                    Ready to discuss your mission requirements?
                  </h2>
                  <p className="text-gray-400 font-light leading-relaxed">
                    We engage directly with program offices, contracting officers, and technical leads. Reach out to start a conversation about your weather, AI, or defense technology needs.
                  </p>
                </div>

                <div className="relative z-10 flex flex-col gap-4 shrink-0">
                  <a
                    href="/book"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 text-sm font-medium text-black hover:bg-gray-200 transition"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    Book a Consultation
                  </a>
                  <a
                    href="/blog"
                    className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-transparent px-8 text-sm font-medium text-white hover:bg-white/5 transition"
                  >
                    Read Our Insights
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
