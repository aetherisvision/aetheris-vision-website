import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: `Privacy Policy | ${SITE.name}`,
  description: "How Aetheris Vision LLC collects, uses, and protects your personal information.",
  path: "/privacy",
});

const EFFECTIVE_DATE = "August 16, 2026";

// NOTE (internal): This policy is intentionally minimal and describes what the
// site actually does (analytics, the processors listed below, and the client
// portal). It is practical drafting, not legal advice — whether CCPA/CPRA or
// GDPR formally apply to Aetheris Vision (based on customer base, revenue, and
// data volume) should be confirmed with counsel before relying on §4's rights
// language.

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />
      <main id="main" className="flex-1 mx-auto max-w-3xl px-6 pt-36 pb-24">
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-12">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-400 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
            <p>
              {SITE.legalName} (&quot;{SITE.name}&quot;, &quot;we&quot;, &quot;us&quot;) is a
              veteran-owned small business in the United States. This policy covers personal
              data handled through our website at{" "}
              <strong className="text-gray-300">{SITE.url.replace(/^https?:\/\//, "")}</strong>.
              We do not sell, rent, or broker personal data.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. What We Collect and Why</h2>
            <ul className="ml-4 space-y-2 list-disc list-outside">
              <li>
                <strong className="text-gray-300">Contact form</strong> &mdash; when you submit
                the form at <code className="text-gray-300">/contact</code>, we collect the
                contact and message details you provide. We store the submission in our customer
                relationship management (CRM) system so we can respond and manage follow-up.
                Resend may deliver a notification to us.
              </li>
              <li>
                <strong className="text-gray-300">Project intake</strong> &mdash; when you submit
                project details at <code className="text-gray-300">/intake</code>, we collect the
                business, contact, goals, requirements, timing, budget, and other information you
                provide. We store the submission in our CRM and project records to assess the
                request, prepare a proposed engagement, and manage the work if it proceeds. Resend
                may deliver notifications and confirmations.
              </li>
              <li>
                <strong className="text-gray-300">Analytics</strong> &mdash; Vercel Analytics
                records cookieless, aggregate usage (page views, performance). When Google
                Analytics is enabled, it sets first-party analytics cookies in your browser. We
                do not use advertising cookies.
              </li>
              <li>
                <strong className="text-gray-300">Client portal</strong> &mdash; if you are a
                client, the portal at <code className="text-gray-300">/client</code> stores your
                email and the project, document, and invoice records for your engagement. You
                sign in with a one-time link sent to your email; sign-in tokens are single-use
                and expire after 24 hours.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Service Providers</h2>
            <p>We use a small set of service providers to operate the site and manage engagements:</p>
            <ul className="mt-3 ml-4 space-y-2 list-disc list-outside">
              <li><strong className="text-gray-300">Vercel</strong> &mdash; website hosting and CDN (processes request logs and IP addresses).</li>
              <li><strong className="text-gray-300">Vercel Analytics</strong> &mdash; cookieless, aggregate website analytics.</li>
              <li><strong className="text-gray-300">Google Analytics</strong> &mdash; site usage analytics, loaded only when a measurement ID is configured.</li>
              <li><strong className="text-gray-300">Neon</strong> &mdash; database hosting for contact, project-intake, CRM, client-portal, project, document, and invoice records.</li>
              <li>
                <strong className="text-gray-300">Anthropic</strong> &mdash; AI-assisted preparation
                of internal compliance-scoping briefs and draft statements of work. When these
                features are used, relevant business, contact, and project details from an intake
                submission are sent to Anthropic for processing.
              </li>
              <li><strong className="text-gray-300">Stripe</strong> &mdash; invoicing and payment processing.</li>
              <li><strong className="text-gray-300">DocuSeal</strong> &mdash; document e-signature.</li>
              <li><strong className="text-gray-300">Resend</strong> &mdash; transactional email (sign-in links, invoices, form notifications, and confirmations).</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              Each provider processes information under its own terms and privacy policy. The
              information involved depends on which service is used.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Retention, Your Choices, and Contact</h2>
            <p>
              We keep personal data only as long as needed for the purpose it was collected or
              as required by law, then delete it. You can ask us to access, correct, or delete
              the data we hold about you. To exercise any data rights or ask a privacy question,{" "}
              <a href="/contact?topic=Privacy%20Request" className="text-blue-400 hover:underline">
                contact us
              </a>{" "}through our contact page. We aim to respond within 30 days.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Children</h2>
            <p>
              This website is not directed to children, and we do not knowingly collect personal
              information from anyone under the age of 13. If you believe a child has provided us
              with data,{" "}
              <a href="/contact" className="text-blue-400 hover:underline">
                contact us
              </a>{" "}and we will delete it.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Changes</h2>
            <p>
              We may update this policy from time to time. The effective date above reflects the
              most recent revision.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
