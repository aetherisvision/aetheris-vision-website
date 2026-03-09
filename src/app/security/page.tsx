import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { ShieldCheckIcon, LockClosedIcon, DocumentTextIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Security & Compliance | ${SITE.name}`,
  description:
    "Enterprise security standards, data protection practices, and compliance certifications for professional business platform development.",
};

export default function SecurityPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-6">

          {/* Header */}
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 mb-6 backdrop-blur-sm">
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                Enterprise Security Standards
              </div>
              <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-6">
                Security & Compliance
              </h1>
              <p className="text-gray-400 font-light text-lg max-w-2xl mx-auto leading-relaxed">
                Enterprise-grade security practices, data protection standards, and compliance frameworks for professional business platforms.
              </p>
            </div>
          </FadeIn>

          {/* Security Standards */}
          <section className="mb-20">
            <FadeIn>
              <h2 className="text-2xl font-semibold text-white mb-8">Security Framework</h2>
            </FadeIn>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FadeIn delay={0.1}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <LockClosedIcon className="h-8 w-8 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">Data Protection</h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>End-to-end encryption for all client data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>SSL/TLS 1.3 with A+ rating (Qualys SSL Labs)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Security headers (CSP, HSTS, X-Frame-Options)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Regular vulnerability assessments and penetration testing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Secure code review and dependency management</span>
                    </li>
                  </ul>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <CloudArrowUpIcon className="h-8 w-8 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">Infrastructure Security</h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Tier 1 hosting providers (AWS, Vercel, Google Cloud)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Automated backups with encryption at rest</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>DDoS protection and rate limiting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Multi-region redundancy and failover systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>24/7 monitoring and incident response</span>
                    </li>
                  </ul>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Compliance Standards */}
          <section className="mb-20">
            <FadeIn>
              <h2 className="text-2xl font-semibold text-white mb-8">Compliance Standards</h2>
            </FadeIn>

            <div className="space-y-6">
              <FadeIn delay={0.1}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <div className="flex items-start gap-4">
                    <DocumentTextIcon className="h-8 w-8 text-blue-400 shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-3">SOC 2 Type II Framework</h3>
                      <p className="text-gray-400 mb-4 leading-relaxed">
                        Our development and operational practices align with SOC 2 Type II requirements for Security, Availability, Processing Integrity, Confidentiality, and Privacy.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="text-white font-medium mb-2">Security Controls</h4>
                          <ul className="space-y-1 text-gray-400">
                            <li>• Access control and authentication</li>
                            <li>• Data encryption protocols</li>
                            <li>• Incident response procedures</li>
                            <li>• Vendor management program</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-white font-medium mb-2">Operational Controls</h4>
                          <ul className="space-y-1 text-gray-400">
                            <li>• Change management processes</li>
                            <li>• Backup and recovery testing</li>
                            <li>• Performance monitoring</li>
                            <li>• Business continuity planning</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FadeIn delay={0.2}>
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">GDPR Compliance</h4>
                    <p className="text-gray-400 text-sm mb-4">European data protection regulation compliance for global clients.</p>
                    <ul className="space-y-2 text-xs text-gray-400">
                      <li>• Data processing agreements</li>
                      <li>• Right to be forgotten</li>
                      <li>• Consent management</li>
                      <li>• Data portability support</li>
                    </ul>
                  </div>
                </FadeIn>

                <FadeIn delay={0.3}>
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">CCPA Compliance</h4>
                    <p className="text-gray-400 text-sm mb-4">California Consumer Privacy Act requirements for US-based clients.</p>
                    <ul className="space-y-2 text-xs text-gray-400">
                      <li>• Privacy policy disclosure</li>
                      <li>• Consumer request handling</li>
                      <li>• Data sale prohibitions</li>
                      <li>• Third-party disclosures</li>
                    </ul>
                  </div>
                </FadeIn>

                <FadeIn delay={0.4}>
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Industry Standards</h4>
                    <p className="text-gray-400 text-sm mb-4">Additional frameworks for specialized industries.</p>
                    <ul className="space-y-2 text-xs text-gray-400">
                      <li>• HIPAA (Healthcare)</li>
                      <li>• PCI DSS (Payments)</li>
                      <li>• FERPA (Education)</li>
                      <li>• Custom compliance needs</li>
                    </ul>
                  </div>
                </FadeIn>
              </div>
            </div>
          </section>

          {/* Business Continuity */}
          <section className="mb-20">
            <FadeIn>
              <h2 className="text-2xl font-semibold text-white mb-8">Business Continuity</h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FadeIn delay={0.1}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Uptime Guarantees</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-gray-400">Professional Tier</span>
                      <span className="text-white font-semibold">99.9% SLA</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-gray-400">Business Tier</span>
                      <span className="text-white font-semibold">99.95% SLA</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400">Enterprise Tier</span>
                      <span className="text-white font-semibold">99.99% SLA</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Includes performance credits for SLA breaches and 24/7 monitoring
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Disaster Recovery</h3>
                  <ul className="space-y-3 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Real-time data replication across regions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Recovery Time Objective (RTO): &lt; 4 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Recovery Point Objective (RPO): &lt; 1 hour</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Quarterly disaster recovery testing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Emergency communication protocols</span>
                    </li>
                  </ul>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Documentation */}
          <section className="mb-16">
            <FadeIn>
              <h2 className="text-2xl font-semibold text-white mb-8">Enterprise Documentation</h2>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-8">
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Complete documentation package available for enterprise clients including security policies, 
                  compliance certifications, and vendor assessment questionnaires.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="text-white font-medium mb-3">Security Documentation</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li>• Information Security Policy</li>
                      <li>• Data Protection Impact Assessment</li>
                      <li>• Incident Response Procedures</li>
                      <li>• Risk Assessment Framework</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-3">Compliance Artifacts</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li>• SOC 2 Type II Report (Available)</li>
                      <li>• Penetration Testing Reports</li>
                      <li>• Compliance Matrix Templates</li>
                      <li>• Vendor Security Questionnaire</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-3">Operational Guides</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li>• Business Continuity Plan</li>
                      <li>• Change Management Process</li>
                      <li>• Backup and Recovery Procedures</li>
                      <li>• Performance Monitoring SLA</li>
                    </ul>
                  </div>
                </div>
              </div>
            </FadeIn>
          </section>

          {/* Contact CTA */}
          <FadeIn>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-8 text-center">
              <h3 className="text-2xl font-semibold text-white mb-4">Enterprise Security Questions?</h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Our security team can provide detailed compliance documentation, conduct security assessments, 
                and answer specific enterprise requirements during your consultation.
              </p>
              <a
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200"
              >
                Contact Security Team
              </a>
            </div>
          </FadeIn>

        </div>
      </main>

      <Footer />
    </div>
  );
}