import { Suspense } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import FadeIn from "@/components/FadeIn";
import {
  CalendarDaysIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { CAPABILITY_STATEMENT_REQUEST_HREF, SITE } from "@/lib/constants";

export const metadata = {
  title: `Discuss a Project | ${SITE.name}`,
  description:
    "Tell Aetheris Vision about your weather, Earth-system, geospatial, applied AI, or digital project. Marston Ward typically replies within one business day.",
};

const nextSteps = [
  ["Review", "Marston Ward reviews your inquiry and identifies the most useful next step."],
  ["Clarify", "If the work is a fit, we schedule a focused conversation about goals and constraints."],
  ["Scope", "You receive a practical scope, schedule, and pricing approach before work begins."],
];

export default function ContactPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505]">
      <Navbar />

      <main id="main" className="relative isolate flex-1 overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-28">
        <div className="absolute inset-x-0 top-0 -z-10 h-[460px]" aria-hidden="true">
          <Image
            src="/images/contact/damage-assessment.webp"
            alt=""
            fill
            className="object-cover object-[50%_40%] opacity-[0.38]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/75 to-[#050505]" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeIn>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-500">
              Start a Conversation
            </p>
            <h1 className="mb-4 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Tell us what you&apos;re working on
            </h1>
            <p className="mb-10 max-w-2xl text-lg font-light leading-relaxed text-gray-300">
              Share the problem, the outcome you need, and any constraints. Marston Ward reviews every inquiry and typically replies within one business day with a practical next step.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div id="contact-form" className="scroll-mt-28 md:col-span-2">
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

            <FadeIn delay={0.15}>
              <aside className="space-y-8">
                <div>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
                    What happens next
                  </p>
                  <div className="divide-y divide-white/10 border-y border-white/10">
                    {nextSteps.map(([title, description]) => (
                      <div key={title} className="py-4">
                        <p className="text-sm font-medium text-white">{title}</p>
                        <p className="mt-1 text-sm font-light leading-relaxed text-gray-400">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-white/10 border-y border-white/10">
                  <div className="py-5">
                    <div className="mb-1.5 flex items-center gap-3">
                      <EnvelopeIcon className="h-4 w-4 text-blue-400" />
                      <p className="text-sm font-medium text-white">Email</p>
                    </div>
                    <a href={`mailto:${SITE.email}`} className="text-sm text-gray-400 transition hover:text-white">
                      {SITE.email}
                    </a>
                  </div>

                  <div className="py-5">
                    <div className="mb-1.5 flex items-center gap-3">
                      <PhoneIcon className="h-4 w-4 text-blue-400" />
                      <p className="text-sm font-medium text-white">Call or text</p>
                    </div>
                    <a href={SITE.phoneHref} className="text-sm text-gray-400 transition hover:text-white">
                      {SITE.phone}
                    </a>
                  </div>

                  <div className="py-5">
                    <div className="mb-1.5 flex items-center gap-3">
                      <CalendarDaysIcon className="h-4 w-4 text-blue-400" />
                      <p className="text-sm font-medium text-white">Prefer to talk?</p>
                    </div>
                    <a href="/book" className="text-sm text-blue-400 transition hover:text-blue-300">
                      Book a 30-minute consultation →
                    </a>
                  </div>

                  <div className="py-5">
                    <div className="mb-1.5 flex items-center gap-3">
                      <ClipboardDocumentIcon className="h-4 w-4 text-blue-400" />
                      <p className="text-sm font-medium text-white">Detailed intake</p>
                    </div>
                    <p className="text-sm font-light leading-relaxed text-gray-400">
                      Already have requirements, examples, or a defined digital-delivery scope?{" "}
                      <a href="/intake" className="text-blue-400 transition hover:text-blue-300">
                        Use the project intake form →
                      </a>
                    </p>
                  </div>
                </div>

                <p className="text-xs font-light leading-relaxed text-gray-500">
                  Procurement team?{" "}
                  <a href={CAPABILITY_STATEMENT_REQUEST_HREF} className="text-gray-300 transition hover:text-white">
                    Request the capability statement
                  </a>
                  .
                </p>
              </aside>
            </FadeIn>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
