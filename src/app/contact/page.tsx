import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import FadeIn from "@/components/FadeIn";
import { EnvelopeIcon, CalendarDaysIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Contact | ${SITE.name}`,
  description:
    "Contact Aetheris Vision to discuss your weather, AI/ML, or defense technology requirements. We engage directly with program offices and contracting officers.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-6">

          {/* Header */}
          <FadeIn>
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">
              Get In Touch
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              Contact Us
            </h1>
            <p className="text-gray-400 font-light text-lg max-w-2xl leading-relaxed mb-10">
              We engage directly with program offices, contracting officers, and technical leads. Tell us about your requirement and we will respond within one business day.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Form */}
            <div className="md:col-span-2">
              <ContactForm />
            </div>

            {/* Sidebar */}
            <FadeIn delay={0.15}>
              <div className="space-y-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                    <p className="text-white font-medium text-sm">Email directly</p>
                  </div>
                  <a
                    href="mailto:contact@aetherisvision.com"
                    className="text-sm text-gray-400 hover:text-white transition break-all"
                  >
                    contact@aetherisvision.com
                  </a>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-400" />
                    <p className="text-white font-medium text-sm">Schedule a call</p>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                    Prefer to talk? Book a 30-minute consultation directly on our calendar.
                  </p>
                  <a
                    href="/book"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-xs font-medium text-black hover:bg-gray-200 transition"
                  >
                    Book a Time
                  </a>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <ClipboardDocumentIcon className="h-5 w-5 text-blue-400" />
                    <p className="text-white font-medium text-sm">Project Intake</p>
                  </div>
                  <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                    For website projects, complete our comprehensive intake form for immediate, accurate pricing.
                  </p>
                  <a
                    href="/intake"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-white/20 bg-black/50 px-4 text-xs font-medium text-white hover:bg-white/5 transition"
                  >
                    Start Intake Form
                  </a>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                  <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">
                    Contracting
                  </p>
                  <div className="space-y-1 text-sm text-gray-400 font-light">
                    <p>VOSB Certified</p>
                    <p>8(a) Pathway Active</p>
                    <p>SAM.gov Registered</p>
                    <p>Active Secret Clearance</p>
                  </div>
                  <a
                    href="/capabilities"
                    className="inline-block mt-4 text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    View Capabilities Statement →
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
