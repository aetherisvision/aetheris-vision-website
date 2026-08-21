import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectIntakeForm from "@/components/ProjectIntakeForm";
import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `Start a Web Project | ${SITE.name}`,
  description:
    "Tell us about your website or web application project in plain English. We'll follow up within one business day.",
  path: "/intake",
});

export default function IntakePage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">

          {/* Header */}
          <FadeIn>
            <div className="mb-10">
              <p className="text-xs font-semibold tracking-widest text-av-accent uppercase mb-3">Start a Web Project</p>
              <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
                Tell us what you need built
              </h1>
              <p className="text-gray-400 font-light text-base leading-relaxed">
                For website and web-application projects. Allow about ten minutes; answer what you can and leave the rest blank. We&apos;ll review your project and follow up within one business day.
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Prefer to talk first?{" "}
                <Link href="/book" className="text-av-light hover:text-blue-300 transition">
                  Book a free 30-minute consultation →
                </Link>
              </p>
            </div>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 sm:p-8">
              <ProjectIntakeForm />
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
}
