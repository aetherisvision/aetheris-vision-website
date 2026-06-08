import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE.name}`,
  description: "How Aetheris Vision LLC collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "June 8, 2026";

// NOTE (internal): This policy was right-sized to match what the site actually
// does (analytics, processors, client portal). It is practical drafting, not
// legal advice — whether CCPA/CPRA or GDPR formally apply to Aetheris Vision
// (based on customer base, revenue thresholds, and data volume) should be
// confirmed with counsel before relying on the rights language in §6.

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
              For privacy-related questions, you can{" "}
              <a href="/contact?topic=Privacy%20Question" className="text-blue-400 hover:underline">
                contact us
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
                  by{" "}
                  <a href="/contact?topic=Blog%20Unsubscribe" className="text-blue-400 hover:underline">
                    contacting us
                  </a>{" "}
                  with an unsubscribe request.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Client Portal</h3>
                <p>
                  If you are an Aetheris Vision client, the portal at{" "}
                  <code className="text-gray-300">/client</code> lets you sign in with a
                  one-time magic link sent to your email. We store your email address and the
                  project, document, and invoice records associated with your engagement so we
                  can deliver those services. Sign-in tokens are short-lived and deleted on use
                  or expiry.
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
            <h2 className="text-xl font-semibold text-white mb-3">3. Cookies and Analytics</h2>
            <p>
              We use a small amount of analytics to understand site traffic and improve the
              website. We do <strong className="text-gray-300">not</strong> use advertising
              cookies or sell any data.
            </p>
            <ul className="mt-3 ml-4 space-y-1 list-disc list-outside">
              <li>
                <strong className="text-gray-300">Vercel Analytics</strong> &mdash; a
                privacy-focused, cookieless analytics service that records aggregate page
                views and performance metrics without using cookies or storing personally
                identifying information.
              </li>
              <li>
                <strong className="text-gray-300">Google Analytics (gtag)</strong> &mdash;
                when enabled, Google Analytics measures site usage and sets first-party
                analytics cookies in your browser. It is loaded only when an analytics
                measurement ID is configured for the site.
              </li>
            </ul>
            <p className="mt-3">
              Fonts are served locally, so no requests are sent to Google Fonts or any other
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
                    ["Vercel Analytics", "Cookieless traffic analytics", "Aggregate page views, performance metrics"],
                    ["Google Analytics", "Site usage analytics (when enabled)", "Usage events, analytics cookies"],
                    ["Formspree", "Contact form delivery", "Name, email, message content"],
                    ["Cal.com", "Appointment scheduling", "Name, email, booking details"],
                    ["GitHub / Giscus", "Blog comments", "GitHub account data"],
                    ["Neon", "Database (client portal, submissions)", "Account email, project & document records"],
                    ["Stripe", "Invoicing & payments", "Billing contact, invoice & payment details"],
                    ["Docuseal", "Document e-signature", "Signer name, email, signed documents"],
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
              Each processor handles data under its own terms of service and privacy policy.
              We share only the data necessary for the service shown above and do not sell
              personal data.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Retention Periods</h3>
                <ul className="mt-2 ml-4 space-y-1 list-disc list-outside">
                  <li><strong className="text-gray-300">Contact form submissions:</strong> retained in our business inbox for the duration of the business relationship, or up to 3 years from the date of submission if no engagement results.</li>
                  <li><strong className="text-gray-300">Project intake submissions:</strong> retained for the duration of the project engagement plus 2 years, or up to 3 years from submission if no engagement results.</li>
                  <li><strong className="text-gray-300">Client portal accounts:</strong> retained for the duration of the client relationship plus 1 year after the final project is closed.</li>
                  <li><strong className="text-gray-300">Blog subscription emails:</strong> retained until you unsubscribe.</li>
                  <li><strong className="text-gray-300">Booking records:</strong> retained per Cal.com&apos;s data retention policy.</li>
                  <li><strong className="text-gray-300">Magic link authentication tokens:</strong> automatically deleted upon use or expiry (24-hour window), whichever comes first.</li>
                  <li><strong className="text-gray-300">Server logs:</strong> retained per Vercel&apos;s data retention policy (typically 30 days).</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-200 mb-1">Requesting Deletion</h3>
                <p>
                  To request deletion of your personal data,{" "}
                  <a href="/contact?topic=Data%20Deletion%20Request" className="text-blue-400 hover:underline">
                    contact us
                  </a>{" "}
                  with a <strong className="text-gray-300">Data Deletion Request</strong> and
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
            <p>
              You can ask us to access, correct, or delete the personal data we hold about
              you, and you can object to or ask us to restrict how we use it. We do not sell
              personal data. Depending on where you live, you may have additional rights under
              laws such as the EU/UK GDPR or the California Consumer Privacy Act (CCPA/CPRA),
              including the right to lodge a complaint with your local data protection
              authority.
            </p>
            <p className="mt-3">
              To exercise any of these rights,{" "}
              <a href="/contact?topic=Privacy%20Rights%20Request" className="text-blue-400 hover:underline">
                contact us
              </a>. We will respond within 30 days.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Security</h2>
            <p>
              This website enforces HTTPS on all connections. HTTP Security Headers
              (including Content-Security-Policy, Strict-Transport-Security, and
              X-Frame-Options) are applied to every response. Contact form submissions
              are encrypted in transit. We do not store payment data. No payment
              processing occurs on this website.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children</h2>
            <p>
              This website is not directed to children, and we do not knowingly collect
              personal information from anyone under the age of 13. If you believe a child
              has provided us data,{" "}
              <a href="/contact" className="text-blue-400 hover:underline">
                contact us
              </a>{" "}and we will delete it.
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
              <a href="/contact" className="text-blue-400 hover:underline">
                Contact us
              </a>
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
