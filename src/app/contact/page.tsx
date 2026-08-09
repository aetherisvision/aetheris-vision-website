import { Suspense } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import FadeIn from "@/components/FadeIn";
import { CalendarDaysIcon, ClipboardDocumentIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { CAPABILITY_STATEMENT_REQUEST_HREF, SITE } from "@/lib/constants";

export const metadata = {
  title: `Contact | ${SITE.name}`,
  description:
    "Start a web project or ask a question. We respond within one business day. Veteran-owned, based in Mustang, OK.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20 relative isolate overflow-hidden">
        {/* Header background — wildland fire crew surveying damage (see public/images/README.md) */}
        <div className="absolute inset-x-0 top-0 h-[420px] -z-10" aria-hidden="true">
          <Image
            src="/images/contact/damage-assessment.webp"
            alt=""
            fill
            className="object-cover object-[50%_40%] opacity-[0.4]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/55 via-[#050505]/65 to-[#050505]" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6">

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
            <div id="contact-form" className="md:col-span-2 scroll-mt-28">
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

            {/* Sidebar — plain hairline rows, form stays the single action */}
            <FadeIn delay={0.15}>
              <div className="divide-y divide-white/10 border-y border-white/10">
                <div className="py-5">
                  <div className="flex items-center gap-3 mb-1.5">
                    <PhoneIcon className="h-4 w-4 text-blue-400" />
                    <p className="text-white font-medium text-sm">Call or text</p>
                  </div>
                  <a
                    href={SITE.phoneHref}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    {SITE.phone}
                  </a>
                </div>

                <div className="py-5">
                  <div className="flex items-center gap-3 mb-1.5">
                    <CalendarDaysIcon className="h-4 w-4 text-blue-400" />
                    <p className="text-white font-medium text-sm">Schedule a call</p>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Prefer to talk?{" "}
                    <a href="/book" className="text-blue-400 hover:text-blue-300 transition">
                      Book a 30-minute consultation →
                    </a>
                  </p>
                </div>

                <div className="py-5">
                  <div className="flex items-center gap-3 mb-1.5">
                    <ClipboardDocumentIcon className="h-4 w-4 text-blue-400" />
                    <p className="text-white font-medium text-sm">Project intake</p>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Website project?{" "}
                    <a href="/intake" className="text-blue-400 hover:text-blue-300 transition">
                      Start the intake form →
                    </a>{" "}
                    for immediate, accurate pricing.
                  </p>
                </div>

                <div className="py-5">
                  <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">
                    Federal Contracting
                  </p>
                  <div className="space-y-1 text-sm text-gray-400 font-light">
                    <p>VOSB Eligible</p>
                    <p>8(a) Eligible (application opens 2027)</p>
                    <p>SAM.gov Registration Active</p>
                    <p>U.S. Government Secret Clearance (held)</p>
                  </div>
                  <a
                    href={CAPABILITY_STATEMENT_REQUEST_HREF}
                    className="inline-block mt-3 text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    Request Capability Statement →
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
