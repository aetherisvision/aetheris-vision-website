import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import {
  ShieldCheckIcon,
  LockClosedIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Security Practices | ${SITE.name}`,
  description: `Security practices used to protect the ${SITE.name} website, administrative tools, and client portal.`,
};

export default function SecurityPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 mb-6 backdrop-blur-sm">
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                Security Practices
              </div>
              <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-6">
                Security at Aetheris Vision
              </h1>
              <p className="text-gray-400 font-light text-lg max-w-2xl mx-auto leading-relaxed">
                The controls below describe how this website protects requests,
                administrative access, and client accounts today.
              </p>
            </div>
          </FadeIn>

          {/* Request Protection */}
          <section className="mb-20">
            <FadeIn>
              <h2 className="text-2xl font-semibold text-white mb-8">
                Request Protection
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FadeIn delay={0.1}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <LockClosedIcon className="h-8 w-8 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Transport and Browser Controls
                  </h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>HTTPS transport for the deployed website</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>HSTS to direct browsers to use secure connections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Content Security Policy with per-request nonces</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>
                        X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
                        and Permissions-Policy headers
                      </span>
                    </li>
                  </ul>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <ShieldCheckIcon className="h-8 w-8 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    API Controls
                  </h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>
                        Rate limiting on API routes that accept public submissions
                        or job requests
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Security headers applied to page and API responses</span>
                    </li>
                  </ul>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Access and Data */}
          <section className="mb-20">
            <FadeIn>
              <h2 className="text-2xl font-semibold text-white mb-8">
                Access and Data
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FadeIn delay={0.1}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <LockClosedIcon className="h-8 w-8 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Account Access
                  </h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>The administrative area is passphrase-gated</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Client portal sign-in uses emailed magic links</span>
                    </li>
                  </ul>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <CloudArrowUpIcon className="h-8 w-8 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Hosting and Storage
                  </h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>The application is hosted on Vercel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>
                        Client portal accounts and records use a serverless Neon
                        Postgres database
                      </span>
                    </li>
                  </ul>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Maintenance */}
          <section className="mb-16">
            <FadeIn>
              <h2 className="text-2xl font-semibold text-white mb-8">
                Software Maintenance
              </h2>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8 flex items-start gap-4">
                <DocumentTextIcon className="h-8 w-8 text-blue-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Dependency Updates
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Application dependencies are versioned in the project lockfile
                    and updated as part of ongoing software maintenance.
                  </p>
                </div>
              </div>
            </FadeIn>
          </section>

          {/* Contact CTA */}
          <FadeIn>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-8 text-center">
              <h3 className="text-2xl font-semibold text-white mb-4">
                Questions About These Practices?
              </h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Aetheris Vision can explain the controls currently used by this
                site and discuss project-specific security requirements during a
                consultation.
              </p>
              <a
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200"
              >
                Contact Aetheris Vision
              </a>
            </div>
          </FadeIn>
        </div>
      </main>

      <Footer />
    </div>
  );
}
