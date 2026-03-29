import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { ShieldCheckIcon, AcademicCapIcon, GlobeAltIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `About | ${SITE.name}`,
  description:
    "Meet the team behind Aetheris Vision — 35 years of operational meteorology, USAF expertise, and AI/ML integration for defense and government missions.",
};

const credentials = [
  {
    icon: GlobeAltIcon,
    label: "35+ Years",
    description: "Operational meteorology and global atmospheric modeling",
  },
  {
    icon: ShieldCheckIcon,
    label: "Active DoD Secret Clearance",
    description: "VOSB eligible · SAM.gov registration in progress",
  },
  {
    icon: AcademicCapIcon,
    label: "Academic Collaboration",
    description: "Research partnerships with Stockholm University and Chalmers University of Technology",
  },
  {
    icon: CpuChipIcon,
    label: "AI / ML Integration",
    description: "Applied machine learning on large-scale meteorological datasets for mission-critical systems",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-6">

          {/* Header */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">
              Our Story
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-6">
              About Aetheris Vision
            </h1>
            <div className="h-px w-12 bg-blue-500/50 mb-8" />
          </FadeIn>

          {/* Founder Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            <FadeIn delay={0.1} className="md:col-span-2">
              <h2 className="text-xl font-medium text-white mb-4">Marston Ward</h2>
              <p className="text-sm text-blue-400 font-semibold tracking-widest uppercase mb-6">
                Founder &amp; Chief Meteorologist
              </p>
              <div className="space-y-4 text-gray-400 font-light leading-relaxed">
                <p>
                  Aetheris Vision introduces a disruptive convergence: revolutionary capabilities that shouldn&apos;t exist in a single entity. We don&apos;t solve atmospheric uncertainty — <strong className="text-gray-200">we eliminate it through systematic obsolescence of traditional methods</strong>.
                </p>
                <p>
                  Marston Ward represents an impossibility: 35 years dismantling predictive barriers through <strong className="text-gray-200">United States Air Force</strong> combat operations, groundbreaking research at <strong className="text-gray-200">Stockholm University</strong> and <strong className="text-gray-200">Chalmers University of Technology</strong>, and now pioneering AI systems that render billion-dollar legacy forecasting infrastructure irrelevant.
                </p>
                <p>
                  This career follows a disruptive pattern: <strong className="text-gray-200">identify broken paradigm, engineer superior replacement, make old methods obsolete</strong>. From revolutionizing military weather operations in the 90s to architecting AI-NWP fusion systems that outperform traditional models while consuming 1% of the computational resources.
                </p>
                <p>
                  Aetheris Vision weaponizes that pattern: a precision instrument designed to introduce revolutionary capabilities that transform entire operational frameworks. We don&apos;t adapt to existing markets — <strong className="text-gray-200">we create new paradigms that make conventional approaches irrelevant</strong>.
                </p>
              </div>
            </FadeIn>

            {/* Credentials card */}
            <FadeIn delay={0.2}>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-5 h-fit">
                <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                  Credentials &amp; Certifications
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Active DoD Secret Clearance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">VOSB Eligible</p>
                      <p className="text-xs text-gray-500 mt-0.5">Veteran-Owned Small Business</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">SAM.gov Registration In Progress</p>
                      <p className="text-xs text-gray-500 mt-0.5">Federal procurement registration pending</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">8(a) Eligibility Under Review</p>
                      <p className="text-xs text-gray-500 mt-0.5">SBA Business Development Program</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">35+ Years Operational Experience</p>
                      <p className="text-xs text-gray-500 mt-0.5">Global atmospheric modeling &amp; forecasting</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Capability grid */}
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-8">
              Core Capabilities
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-20">
            {credentials.map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.05} direction="up">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 flex gap-4 items-start hover:bg-white/[0.04] transition">
                  <div className="h-10 w-10 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">{item.label}</p>
                    <p className="text-sm text-gray-400 font-light leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Company philosophy */}
          <FadeIn>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-12 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-4">Our Name</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-4">
                  The Meaning Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Aetheris</span>
                </h2>
                <p className="text-gray-400 font-light leading-relaxed mb-4">
                  Derived from the ancient Latin and Greek word <em className="text-white">aetheris</em> — meaning &ldquo;the clear sky&rdquo; or &ldquo;the pure, fresh air breathed by the gods&rdquo; — our name reflects a commitment to mapping the unknown with clarity and precision.
                </p>
                <p className="text-gray-400 font-light leading-relaxed">
                  In ancient philosophy, aether was the fifth element filling the universe above the terrestrial sphere. For us, it represents the convergence of 35 years of deep operational expertise with a vision for the future: bringing structure, clarity, and advanced AI/ML capabilities to the systems that chart the skies, space, and earth.
                </p>
              </div>
            </div>
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
