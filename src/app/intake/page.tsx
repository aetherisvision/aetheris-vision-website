import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectIntakeForm from "@/components/ProjectIntakeForm";
import FadeIn from "@/components/FadeIn";
import Link from "next/link";

export const metadata = {
  title: `Start a Project | ${SITE.name}`,
  description:
    "Tell us about your project in plain English. Takes 2 minutes. We'll follow up within one business day.",
};

export default function IntakePage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-2xl px-6">

          {/* Header */}
          <FadeIn>
            <div className="mb-10">
              <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-3">Start a Project</p>
              <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
                Tell us what you need
              </h1>
              <p className="text-gray-400 font-light text-base leading-relaxed">
                5 quick fields — no jargon required. We&apos;ll review your project and follow up within one business day.
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Prefer to talk first?{" "}
                <Link href="/book" className="text-blue-400 hover:text-blue-300 transition">
                  Book a free 30-minute consultation →
                </Link>
              </p>
            </div>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8">
              <ProjectIntakeForm />
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
}
