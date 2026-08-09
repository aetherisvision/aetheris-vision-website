import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CalBooking from "@/components/CalBooking";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Book a Consultation | ${SITE.name}`,
  description:
    `Schedule a consultation with the ${SITE.name} team to discuss your weather, AI/ML, or systems engineering requirements.`,
};

export default function BookPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20 relative isolate overflow-hidden">
        {/* Header background — an assessment team reviewing plans together (see public/images/README.md) */}
        <div className="absolute inset-x-0 top-0 h-[420px] -z-10" aria-hidden="true">
          <Image
            src="/images/book/plans-review.webp"
            alt=""
            fill
            className="object-cover object-[50%_45%] opacity-[0.55]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/55 via-[#050505]/65 to-[#050505]" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* Header — single action, centered and brief */}
          <div className="mb-10 text-center mx-auto max-w-xl">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">
              Schedule a Meeting
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              Book a Consultation
            </h1>
            <p className="text-gray-400 font-light leading-relaxed">
              Pick a time below. We engage directly with program managers,
              technical leads, and business owners.
            </p>
          </div>

          {/* Cal.com Embed */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <CalBooking />
          </div>

          {/* Fallback */}
          <p className="mt-6 text-sm text-gray-600 text-center">
            Prefer to send a message?{" "}
            <a href="/contact" className="text-gray-400 hover:text-white transition underline underline-offset-2">Contact us</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
