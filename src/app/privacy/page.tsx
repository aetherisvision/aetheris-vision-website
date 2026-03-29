import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE.name}`,
  description: "How Aetheris Vision LLC collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "March 1, 2026";

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
              Aetheris Vision LLC (&quot;Aetheris Vision&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a
              Veteran-Owned Small Business (VOSB) incorporated in the United States,
              providing operational meteorology consulting, AI/ML integration, and
              defense systems advisory services to state and federal agencies.
            </p>
            <p className="mt-3">
              This website is operated at <strong className="text-gray-300">aetherisvision.com</strong>.
              For privacy-related questions, contact us at{" "}
              <a href="mailto:contact@aetherisvision.com" className="text-blue-400 hover:underline">
                contact@aetherisvision.com
              </a>.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. What Data We Collect and Why</h2>
            <p>We collect only the data necessary to operate this website. We do not sell, rent, or broker personal data.</p>

            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Contact Form</h3>
                <p>
                  When you submit the contact form at <code className="text-gray-300">/contact</code>,
                  we collect your name, email address, organization name, requirement type, and message.
                  This data is transmitted to <strong className="text-gray-300">Formspree, Inc.</strong> (a
                  third-party email delivery service) and delivered to our business email inbox.
                  We use this information solely to respond to your inquiry.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Legal basis (GDPR): Legitimate interest (responding to a business inquiry you
                  initiated). For California residents: disclosed under CCPA as &quot;business purpose.&quot;
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Booking / Scheduling</h3>
                <p>
                  When you book a consultation at <code className="text-gray-300">/book</code>,
                  you interact directly with <strong className="text-gray-300">Cal.com</strong>.
                  We receive your name, email address, and any notes you provide. This data is used
                  solely to conduct the scheduled meeting.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Cal.com&apos;s privacy policy applies to data processed on their platform:
                  cal.com/privacy
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Blog Comments (Giscus)</h3>
                <p>
                  Blog comment functionality is provided by <strong className="text-gray-300">Giscus</strong>,
                  which uses GitHub Discussions as its backend. To leave a comment, you must
                  authenticate via your GitHub account. All comment data is stored by GitHub and
                  subject to GitHub&apos;s privacy policy: docs.github.com/en/site-policy/privacy-policies.
                  We do not receive or store GitHub account data on our servers.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Blog Email Subscription</h3>
                <p>
                  If you subscribe to blog updates, your email address is collected for the
                  purpose of sending new post notifications. You may unsubscribe at any time
                  by emailing{" "}
                  <a href="mailto:contact@aetherisvision.com" className="text-blue-400 hover:underline">
                    contact@aetherisvision.com
                  </a>{" "}
                  with &quot;Unsubscribe&quot; in the subject.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Server Logs</h3>
                <p>
                  Our hosting provider, <strong className="text-gray-300">Vercel, Inc.</strong>, automatically
                  logs standard web request data including IP addresses, browser type, and pages
                  visited. These logs are retained by Vercel per their data retention policy
                  and are used for security and uptime monitoring. We do not use these logs for
                  marketing or tracking.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Vercel&apos;s privacy policy: vercel.com/legal/privacy-policy
                </p>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Cookies and Tracking</h2>
            <p>
              This website does <strong className="text-gray-300">not</strong> use advertising
              cookies, tracking pixels, or third-party analytics (e.g., Google Analytics).
              No cookie consent banner is required because we do not set non-essential cookies.
            </p>
            <p className="mt-3">
              Fonts are served locally — no requests are sent to Google Fonts or any other
              external font CDN when you visit this site.
            </p>
            <p className="mt-3">
              Giscus and Cal.com may set their own session cookies when you interact with
              those embedded widgets. Those cookies are governed by their respective privacy policies.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Processors</h2>
            <p>We use the following third-party services that may process personal data:</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-gray-300 font-medium">Service</th>
                    <th className="text-left py-2 pr-4 text-gray-300 font-medium">Purpose</th>
                    <th className="text-left py-2 text-gray-300 font-medium">Data Processed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Vercel", "Website hosting & CDN", "IP address, request logs"],
                    ["Formspree", "Contact form delivery", "Name, email, message content"],
                    ["Cal.com", "Appointment scheduling", "Name, email, booking details"],
                    ["GitHub / Giscus", "Blog comments", "GitHub account data"],
                    ["Cloudflare", "DNS resolution", "IP address (DNS queries only)"],
                  ].map(([service, purpose, data]) => (
                    <tr key={service}>
                      <td className="py-2 pr-4 text-gray-300">{service}</td>
                      <td className="py-2 pr-4">{purpose}</td>
                      <td className="py-2">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              All processors are contractually bound to handle data only as directed and in
              compliance with applicable law. Vercel, Formspree, and Cal.com are certified
              under the EU-U.S. Data Privacy Framework or maintain Standard Contractual
              Clauses (SCCs) for cross-border data transfers.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Retention Periods</h3>
                <ul className="mt-2 ml-4 space-y-1 list-disc list-outside">
                  <li><strong className="text-gray-300">Contact form submissions</strong> — retained in our business inbox for the duration of the business relationship, or up to 3 years from the date of submission if no engagement results.</li>
                  <li><strong className="text-gray-300">Project intake submissions</strong> — retained for the duration of the project engagement plus 2 years, or up to 3 years from submission if no engagement results.</li>
                  <li><strong className="text-gray-300">Client portal accounts</strong> — retained for the duration of the client relationship plus 1 year after the final project is closed.</li>
                  <li><strong className="text-gray-300">Blog subscription emails</strong> — retained until you unsubscribe.</li>
                  <li><strong className="text-gray-300">Booking records</strong> — retained per Cal.com&apos;s data retention policy.</li>
                  <li><strong className="text-gray-300">Magic link authentication tokens</strong> — automatically deleted upon use or expiry (24-hour window), whichever comes first.</li>
                  <li><strong className="text-gray-300">Server logs</strong> — retained per Vercel&apos;s data retention policy (typically 30 days).</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Requesting Deletion</h3>
                <p>
                  To request deletion of your personal data, email{" "}
                  <a href="mailto:contact@aetherisvision.com" className="text-blue-400 hover:underline">
                    contact@aetherisvision.com
                  </a>{" "}
                  with the subject line <strong className="text-gray-300">&quot;Data Deletion Request&quot;</strong> and
                  include the email address associated with your account or submission. We will confirm receipt
                  within 5 business days and complete the deletion within 30 days, except where retention is
                  required by law (e.g., tax or contractual records).
                </p>
              </div>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">
                  European Union and EEA Residents (GDPR)
                </h3>
                <p>Under the General Data Protection Regulation, you have the right to:</p>
                <ul className="mt-2 ml-4 space-y-1 list-disc list-outside">
                  <li>Access the personal data we hold about you</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion (&quot;right to be forgotten&quot;)</li>
                  <li>Object to processing based on legitimate interest</li>
                  <li>Request restriction of processing</li>
                  <li>Data portability</li>
                  <li>Lodge a complaint with your national supervisory authority
                    (in Sweden: Integritetsskyddsmyndigheten / IMY — imy.se)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">
                  California Residents (CCPA / CPRA)
                </h3>
                <p>Under the California Consumer Privacy Act, you have the right to:</p>
                <ul className="mt-2 ml-4 space-y-1 list-disc list-outside">
                  <li>Know what personal information is collected about you</li>
                  <li>Know whether your personal information is sold or disclosed</li>
                  <li>Opt out of the sale of your personal information
                    (we do not sell personal information)</li>
                  <li>Request deletion of your personal information</li>
                  <li>Not be discriminated against for exercising your rights</li>
                </ul>
              </div>

              <p>
                To exercise any of these rights, email{" "}
                <a href="mailto:contact@aetherisvision.com" className="text-blue-400 hover:underline">
                  contact@aetherisvision.com
                </a>. We will respond within 30 days.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Security</h2>
            <p>
              This website enforces HTTPS on all connections. HTTP Security Headers
              (including Content-Security-Policy, Strict-Transport-Security, and
              X-Frame-Options) are applied to every response. Contact form submissions
              are encrypted in transit. We do not store payment data — no payment
              processing occurs on this website.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children</h2>
            <p>
              This website is directed to business and government professionals. We do not
              knowingly collect personal information from persons under the age of 13. If
              you believe a child has submitted data through this site, contact us
              immediately at{" "}
              <a href="mailto:contact@aetherisvision.com" className="text-blue-400 hover:underline">
                contact@aetherisvision.com
              </a>.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The effective date at
              the top of this page will reflect the date of the most recent revision.
              Continued use of the site after changes are posted constitutes acceptance
              of the updated policy.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>
              Aetheris Vision LLC<br />
              Email:{" "}
              <a href="mailto:contact@aetherisvision.com" className="text-blue-400 hover:underline">
                contact@aetherisvision.com
              </a>
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
