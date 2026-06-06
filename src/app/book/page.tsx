import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CalBooking from "@/components/CalBooking";
import { SITE } from "@/lib/constants";
import EmailLink from "@/components/EmailLink";

export const metadata = {
  title: `Book a Consultation | ${SITE.name}`,
  description:
    "Schedule a consultation with the Aetheris Vision team to discuss your weather, AI/ML, or defense technology requirements.",
};

export default function BookPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-6">
          {/* Header */}
          <div className="mb-10">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">
              Schedule a Meeting
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              Book a Consultation
            </h1>
            <p className="text-gray-400 font-light text-lg max-w-2xl leading-relaxed">
              Select a time that works for you. We engage directly with program
              offices, contracting officers, and technical leads to discuss your
              requirements.
            </p>
          </div>

          {/* Cal.com Embed */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <CalBooking />
          </div>

          {/* Fallback */}
          <p className="mt-6 text-sm text-gray-600 text-center">
            Prefer email?{" "}
            <EmailLink className="text-gray-400 hover:text-white transition underline underline-offset-2">Email us</EmailLink>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
