import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectIntakeForm from "@/components/ProjectIntakeForm";
import FadeIn from "@/components/FadeIn";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: `Project Intake | ${SITE.name}`,
  description:
    "Tell us about your website project requirements. Our comprehensive intake form helps us understand your needs and provide accurate pricing and timelines.",
};

export default function IntakePage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-4xl px-6">

          {/* Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 mb-6 backdrop-blur-sm">
                <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                Professional Discovery Process
              </div>
              <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                Website Project Intake
              </h1>
              <p className="text-gray-400 font-light text-lg max-w-2xl mx-auto leading-relaxed">
                Help us understand your vision and requirements. This detailed assessment ensures we provide accurate pricing, appropriate service tier recommendations, and successful project delivery.
              </p>
            </div>
          </FadeIn>

          {/* Process Benefits */}
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  title: "Accurate Pricing",
                  desc: "Get precise quotes based on actual complexity, not generic estimates."
                },
                {
                  title: "Right-Fit Service Tier",
                  desc: "We'll recommend Professional, Business, or Enterprise based on your needs."
                },
                {
                  title: "Faster Project Start",
                  desc: "Comprehensive requirements mean development starts immediately after approval."
                }
              ].map((benefit, i) => (
                <div key={benefit.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                  <h3 className="font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-400">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={0.2}>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8">
              <ProjectIntakeForm />
            </div>
          </FadeIn>

          {/* Next Steps */}
          <FadeIn delay={0.3}>
            <div className="mt-12 rounded-xl border border-blue-500/20 bg-blue-950/20 p-6">
              <h3 className="font-semibold text-white mb-3">What Happens Next?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white shrink-0">1</div>
                  <div>
                    <p className="font-medium text-white">Review</p>
                    <p className="text-gray-400">We analyze your requirements within 4 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white shrink-0">2</div>
                  <div>
                    <p className="font-medium text-white">Assessment</p>
                    <p className="text-gray-400">Technical feasibility and service tier recommendation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white shrink-0">3</div>
                  <div>
                    <p className="font-medium text-white">Consultation</p>
                    <p className="text-gray-400">30-minute call to discuss approach and timeline</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white shrink-0">4</div>
                  <div>
                    <p className="font-medium text-white">Proposal</p>
                    <p className="text-gray-400">Detailed scope, timeline, and transparent pricing</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
}