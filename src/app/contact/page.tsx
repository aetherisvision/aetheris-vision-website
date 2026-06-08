import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import FadeIn from "@/components/FadeIn";
import { CalendarDaysIcon, ClipboardDocumentIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Contact | ${SITE.name}`,
  description:
    "Start a web project or ask a question. We respond within one business day. Veteran-owned, based in Mustang, OK.",
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
              Have a web project in mind, or just want to ask a question? Send a message and we&apos;ll respond within one business day. No sales pitch, just a straight answer.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Form */}
            <div className="md:col-span-2">
              <Suspense
                fallback={
                  <div
                    aria-busy="true"
                    aria-label="Loading contact form"
                    className="min-h-[24rem] rounded-xl border border-white/5 bg-white/[0.02]"
                  />
                }
              >
                <ContactForm />
              </Suspense>
            </div>

            {/* Sidebar */}
            <FadeIn delay={0.15}>
              <div className="space-y-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <PhoneIcon className="h-5 w-5 text-blue-400" />
                    <p className="text-white font-medium text-sm">Call or text</p>
                  </div>
                  <a
                    href="tel:+13463819629"
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    (346) 381-9629
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
                    Federal Contracting
                  </p>
                  <div className="space-y-1 text-sm text-gray-400 font-light">
                    <p>VOSB Eligible</p>
                    <p>8(a) Eligible (application opens 2027)</p>
                    <p>SAM.gov Registration Active</p>
                    <p>U.S. Government Secret Clearance (held)</p>
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
