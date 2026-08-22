import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CalBooking from "@/components/CalBooking";
import QuickContactForm from "@/components/QuickContactForm";
import { SITE } from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `Get in Touch | ${SITE.name}`,
  description:
    `Ask a question, tell ${SITE.name} about your project, or schedule a free consultation to discuss the focused support your work needs.`,
  path: "/book",
});

export default function BookPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20 relative isolate">
        {/* Header background — an assessment team reviewing plans together (see public/images/README.md) */}
        <div className="absolute inset-x-0 top-0 h-[420px] -z-10" aria-hidden="true">
          <Image
            src="/images/book/plans-review.webp"
            alt=""
            fill
            className="object-cover object-[50%_45%] opacity-[0.55]"
            preload
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/55 via-[#050505]/65 to-[#050505]" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-500">
              Get in Touch
            </p>
            <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              How Can We Help?
            </h1>
            <p className="font-light leading-relaxed text-gray-400">
              Ask a question, tell us about your project, or schedule a free consultation.
              Aetheris Vision typically replies within one business day.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <section aria-labelledby="ask-a-question">
              <h2 id="ask-a-question" className="text-xl font-semibold text-white">
                Ask a Question
              </h2>
              <p className="mt-2 text-sm font-light leading-relaxed text-gray-400">
                Comments, general questions, or website matters — a few sentences are enough.
              </p>
              <div className="mt-6">
                <QuickContactForm />
              </div>
            </section>

            <aside className="space-y-8">
              <section aria-labelledby="project-inquiry" className="border border-white/10 bg-white/[0.02] p-6">
                <h2 id="project-inquiry" className="text-xl font-semibold text-white">
                  Tell Us About Your Project
                </h2>
                <p className="mt-2 text-sm font-light leading-relaxed text-gray-400">
                  Planning weather, Earth-system, geospatial, or applied-AI work? Share the
                  problem, the outcome you need, and any constraints through the project
                  inquiry form.
                </p>
                <a
                  href="/contact"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Start a project inquiry <ArrowRightIcon className="h-4 w-4" />
                </a>
              </section>

            </aside>
          </div>

          <section id="consultation" aria-labelledby="consultation-heading" className="mt-16 scroll-mt-28 sm:mt-20">
            <div className="mx-auto mb-8 max-w-xl text-center">
              <h2 id="consultation-heading" className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Schedule a Free Consultation
              </h2>
              <p className="mt-3 text-sm font-light leading-relaxed text-gray-400">
                Book a time that works for you. We&apos;ll talk through what your project needs
                and where focused support could help it move forward.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02]">
              <CalBooking />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
