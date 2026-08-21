"use client";

import { useRef, useState } from "react";
import EmailVerificationStep from "@/components/EmailVerificationStep";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import TurnstileWidget from "@/components/TurnstileWidget";
import { createSubmissionId } from "@/lib/client-submission-id";

interface FormData {
  // Business Information
  companyName: string;
  industry: string;
  currentWebsite: string;
  location: string;
  revenue: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  
  // Project Goals
  objectives: string[];
  successMetrics: string;
  primaryAudience: string;
  secondaryAudience: string;
  geographicFocus: string;
  
  // Portfolio Reference
  portfolioReference: string;
  visualStyle: string;
  referenceWebsites: string;
  
  // Technical Requirements
  contentPages: string[];
  estimatedPages: string;
  interactiveFeatures: string[];
  ecommerceFeatures: string[];
  userAccountFeatures: string[];
  
  // Backend Complexity
  dataComplexity: string;
  integrations: string[];
  contentManagement: string[];
  
  // Infrastructure
  trafficExpectations: string;
  geographicReach: string;
  performancePriorities: string[];
  securityRequirements: string[];
  complianceNeeds: string[];
  
  // Emergency & Backup
  uptimeRequirements: string;
  backupNeeds: string;
  supportRequirements: string;
  
  // Platform
  platformPreference: string;

  // Timeline & Budget
  timeline: string;
  targetDate: string;
  budgetRange: string;
  maintenancePreference: string;
  
  // Additional
  specialRequirements: string;
  questionsForUs: string;
}

const portfolioOptions = [
  { id: "analytics-dashboard", label: "Analytics Dashboard: Enterprise SaaS platform with real-time metrics" },
  { id: "international-market", label: "International Market: E-commerce with cultural sections and product management" },
  { id: "portal-pro", label: "Portal Pro: Comprehensive business platform with role-based authentication" },
  { id: "law-firm", label: "Law Firm: Professional services with case studies and client testimonials" },
  { id: "restaurant", label: "Restaurant: Local business with menu, reservations, and online ordering" },
  { id: "trades-contractor", label: "Trades Contractor: Service business with project galleries and quote requests" },
  { id: "veteran-nonprofit", label: "Veteran Nonprofit: Nonprofit with donation and volunteer systems" },
  { id: "healthcare", label: "Healthcare: Medical practice with physician profiles, insurance info, and appointment booking" },
  { id: "wp-editorial", label: "Editorial / Publishing: Content-heavy publication managed via WordPress CMS" },
  { id: "real-estate", label: "Real Estate: Property listings, agent profiles, and home valuation form" },
  { id: "fitness", label: "Fitness / Gym: Membership tiers, class schedule, and free trial CTA" },
  { id: "none", label: "None match. I need something completely different" },
];

export default function ProjectIntakeForm() {
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    industry: "",
    currentWebsite: "",
    location: "",
    revenue: "",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
    objectives: [],
    successMetrics: "",
    primaryAudience: "",
    secondaryAudience: "",
    geographicFocus: "",
    portfolioReference: "",
    visualStyle: "",
    referenceWebsites: "",
    contentPages: [],
    estimatedPages: "",
    interactiveFeatures: [],
    ecommerceFeatures: [],
    userAccountFeatures: [],
    dataComplexity: "",
    integrations: [],
    contentManagement: [],
    trafficExpectations: "",
    geographicReach: "",
    performancePriorities: [],
    securityRequirements: [],
    complianceNeeds: [],
    uptimeRequirements: "",
    backupNeeds: "",
    supportRequirements: "",
    timeline: "",
    targetDate: "",
    budgetRange: "",
    platformPreference: "",
    maintenancePreference: "",
    specialRequirements: "",
    questionsForUs: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState("");
  const [step, setStep] = useState<"details" | "verification">("details");
  const [challengeId, setChallengeId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [humanAttestation, setHumanAttestation] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const submissionIdRef = useRef<string | null>(null);
  const formStartedAtRef = useRef(Date.now());
  const requiresTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submissionPayload = () => ({
    ...formData,
    submissionId: submissionIdRef.current,
    humanAttestation,
    interactionDurationMs: Date.now() - formStartedAtRef.current,
    _gotcha: honeypot,
  });

  const responseError = async (response: Response, fallback: string) => {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return body?.error || fallback;
  };

  const resetTurnstile = () => {
    setTurnstileToken(null);
    setTurnstileResetKey((key) => key + 1);
  };

  const startOver = () => {
    setStep("details");
    setChallengeId("");
    setVerificationCode("");
    setSubmitStatus("idle");
    setErrorDetail("");
    setHumanAttestation(false);
    submissionIdRef.current = null;
    formStartedAtRef.current = Date.now();
    resetTurnstile();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!humanAttestation) {
      setSubmitStatus("error");
      setErrorDetail("Confirm that you are personally submitting this project request.");
      return;
    }
    if (requiresTurnstile && !turnstileToken) {
      setSubmitStatus("error");
      setErrorDetail("Complete the security check before sending your project details.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorDetail("");
    submissionIdRef.current ??= createSubmissionId();

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...submissionPayload(),
          turnstileToken,
        }),
      });

      if (!response.ok) {
        setSubmitStatus("error");
        setErrorDetail(await responseError(response, "We could not start email verification. Please try again."));
        resetTurnstile();
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        stage?: string;
        challengeId?: string;
      } | null;
      if (body?.stage !== "verification" || !body.challengeId) {
        setSubmitStatus("error");
        setErrorDetail("The verification service returned an unexpected response. Please try again.");
        resetTurnstile();
        return;
      }

      setChallengeId(body.challengeId);
      setStep("verification");

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "form_submit", {
          event_category: "engagement",
          event_label: "project_intake_verification_requested",
          value: 0,
        });
      }
    } catch {
      setSubmitStatus("error");
      setErrorDetail("We could not reach the verification service. Check your connection and try again.");
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorDetail("");

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionPayload(),
          challengeId,
          verificationCode,
        }),
      });

      if (!response.ok) {
        setSubmitStatus("error");
        setErrorDetail(await responseError(response, "We could not verify that code. Please try again."));
        return;
      }

      const body = (await response.json().catch(() => null)) as { stage?: string } | null;
      if (body?.stage !== "submitted") {
        setSubmitStatus("error");
        setErrorDetail("The submission service returned an unexpected response. Please try again.");
        return;
      }

      setSubmitStatus("success");
      submissionIdRef.current = null;

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "conversion", {
          event_category: "lead_generation",
          event_label: "project_intake_completed",
        });
      }
    } catch {
      setSubmitStatus("error");
      setErrorDetail("We could not reach the submission service. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-6">
          <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4">Project details received</h3>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          Thank you. Aetheris Vision will review the information you provided and follow up about the next step.
        </p>
        <p className="text-sm text-gray-500">
          Your project details have been saved. We&apos;ll use <span className="text-white">{formData.contactEmail}</span> for any follow-up.
        </p>
        <div className="mt-8">
          <a
            href="/services/web"
            className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition mr-4"
          >
            See what we build
          </a>
          <a
            href="/book"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 bg-black/50 px-6 text-sm font-medium text-white hover:bg-white/5 transition"
          >
            Book a consultation
          </a>
        </div>
      </div>
    );
  }

  if (step === "verification") {
    return (
      <form onSubmit={handleVerificationSubmit} className="space-y-8">
        <EmailVerificationStep
          email={formData.contactEmail}
          code={verificationCode}
          onCodeChange={setVerificationCode}
          onStartOver={startOver}
          submitting={isSubmitting}
          error={submitStatus === "error" ? errorDetail : ""}
          submitLabel="Confirm and send project details"
        />
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Business Information */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">1</span>
          Business Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Company Name *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your company name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Industry *</label>
            <input
              type="text"
              required
              value={formData.industry}
              onChange={(e) => handleInputChange("industry", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Healthcare, Manufacturing, Professional Services"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Current Website (if any)</label>
            <input
              type="url"
              value={formData.currentWebsite}
              onChange={(e) => handleInputChange("currentWebsite", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Primary Business Location *</label>
            <LocationAutocomplete
              required
              value={formData.location}
              onChange={(val) => handleInputChange("location", val)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Annual Revenue Range</label>
            <select
              value={formData.revenue}
              onChange={(e) => handleInputChange("revenue", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select revenue range</option>
              <option value="under-100k">Under $100K</option>
              <option value="100k-500k">$100K - $500K</option>
              <option value="500k-1m">$500K - $1M</option>
              <option value="1m-5m">$1M - $5M</option>
              <option value="5m-plus">$5M+</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-medium text-white">Primary Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Contact Name *</label>
              <input
                type="text"
                required
                value={formData.contactName}
                onChange={(e) => handleInputChange("contactName", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Title/Role *</label>
              <input
                type="text"
                required
                value={formData.contactTitle}
                onChange={(e) => handleInputChange("contactTitle", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., CEO, Marketing Director, Business Owner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Email Address *</label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Project Goals */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">2</span>
          Project Goals & Vision
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">Primary Objectives (check all that apply) *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Generate leads and inquiries",
                "Sell products/services online", 
                "Provide customer self-service portal",
                "Showcase portfolio/work samples",
                "Build brand credibility and trust",
                "Automate business processes",
                "Integrate with existing systems",
                "Replace outdated website",
                "Enter new markets/demographics"
              ].map((objective) => (
                <label key={objective} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.objectives.includes(objective)}
                    onChange={(e) => handleCheckboxChange("objectives", objective, e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">{objective}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Success Metrics *</label>
            <textarea
              required
              value={formData.successMetrics}
              onChange={(e) => handleInputChange("successMetrics", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="How will you measure the success of this website? (e.g., 50% more leads, 25% increase in online sales, reduce support calls by 30%)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Primary Target Audience *</label>
              <input
                type="text"
                required
                value={formData.primaryAudience}
                onChange={(e) => handleInputChange("primaryAudience", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Small business owners, Healthcare providers, Tech professionals"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Secondary Audience</label>
              <input
                type="text"
                value={formData.secondaryAudience}
                onChange={(e) => handleInputChange("secondaryAudience", e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Secondary target group"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Reference */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">3</span>
          Portfolio Reference & Style
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">Which portfolio example comes closest to your vision? *</label>
            <div className="space-y-3">
              {portfolioOptions.map((option) => (
                <label key={option.id} className="flex items-start">
                  <input
                    type="radio"
                    name="portfolioReference"
                    value={option.id}
                    checked={formData.portfolioReference === option.id}
                    onChange={(e) => handleInputChange("portfolioReference", e.target.value)}
                    className="h-4 w-4 mt-1 border-white/10 bg-white/5 text-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Preferred Visual Style</label>
            <select
              value={formData.visualStyle}
              onChange={(e) => handleInputChange("visualStyle", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select visual style</option>
              <option value="clean-minimal">Clean and minimal</option>
              <option value="bold-modern">Bold and modern</option>
              <option value="professional-corporate">Professional and corporate</option>
              <option value="creative-artistic">Creative and artistic</option>
              <option value="industry-traditional">Industry-specific traditional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Reference Websites (2-3 sites you admire)</label>
            <textarea
              value={formData.referenceWebsites}
              onChange={(e) => handleInputChange("referenceWebsites", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="List websites you like (any industry). Include what specifically you like about each one."
            />
          </div>
        </div>
      </section>

      {/* Platform Preference */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">4</span>
          Platform Preference
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Not sure? Choose &quot;Help me decide&quot; and we&apos;ll recommend the right stack based on your goals.</p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: "nextjs", label: "Custom Next.js: Fast, modern, fully custom frontend. Best for performance and brand differentiation." },
              { id: "headless-wp", label: "Headless WordPress: WordPress CMS for editors plus a Next.js frontend. Best for content-heavy, editorial, or publication sites." },
              { id: "managed-wp", label: "Managed WordPress: Standard WordPress with custom theme and full monthly maintenance. Best if you're already on WP or want the familiar dashboard." },
              { id: "decide", label: "Help me decide. I'm not sure yet. Recommend based on my goals." },
            ].map((option) => (
              <label key={option.id} className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="platformPreference"
                  value={option.id}
                  checked={formData.platformPreference === option.id}
                  onChange={(e) => handleInputChange("platformPreference", e.target.value)}
                  className="h-4 w-4 mt-1 border-white/10 bg-white/5 text-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">5</span>
          Security & Compliance Requirements
        </h3>
        
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-500/20 bg-blue-950/10 p-4 mb-6">
            <p className="text-sm text-blue-200 leading-relaxed">
              <strong>Security by Design:</strong> Select any requirements that apply to your industry or business. Select any requirements that apply to your industry or business needs.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">Security Features (Select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: "ssl-tls", label: "SSL/TLS Encryption (A+ Grade)", desc: "256-bit encryption, HSTS, perfect forward secrecy" },
                { id: "security-headers", label: "Comprehensive Security Headers", desc: "CSP, XSS protection, clickjacking prevention" },
                { id: "rate-limiting", label: "Rate Limiting & DDoS Protection", desc: "Automated abuse prevention and traffic throttling" },
                { id: "mfa", label: "Multi-Factor Authentication", desc: "SMS, TOTP, or hardware key support for admin access" },
                { id: "data-encryption", label: "Data Encryption at Rest", desc: "Database encryption and secure data storage" },
                { id: "audit-logging", label: "Comprehensive Audit Logging", desc: "Track all user actions and system changes" },
                { id: "backup-security", label: "Encrypted Backups", desc: "Automated, encrypted backup with disaster recovery" },
                { id: "penetration-testing", label: "Security Audit & Penetration Testing", desc: "Professional security assessment and validation" }
              ].map((option) => (
                <label key={option.id} className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.securityRequirements.includes(option.id)}
                    onChange={(e) => handleCheckboxChange("securityRequirements", option.id, e.target.checked)}
                    className="h-4 w-4 mt-1 border-white/10 bg-white/5 text-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm text-white font-medium">{option.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">Compliance Requirements (Select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: "soc2", label: "SOC 2 Type II Compliance", desc: "Business operations security framework", tier: "Business/Enterprise" },
                { id: "gdpr", label: "GDPR Compliance", desc: "European data protection regulation", tier: "All Tiers" },
                { id: "ccpa", label: "CCPA Compliance", desc: "California Consumer Privacy Act", tier: "Business/Enterprise" },
                { id: "hipaa", label: "HIPAA Compliance", desc: "Healthcare data protection", tier: "Enterprise" },
                { id: "pci-dss", label: "PCI DSS Compliance", desc: "Payment card industry standards", tier: "Business/Enterprise" },
                { id: "nist", label: "NIST Cybersecurity Framework", desc: "Federal cybersecurity guidelines", tier: "Enterprise" },
                { id: "fisma", label: "FISMA Compliance", desc: "Federal information system security", tier: "Enterprise" },
                { id: "cmmc", label: "CMMC Level 1-2", desc: "Defense contractor cybersecurity", tier: "Enterprise" }
              ].map((option) => (
                <label key={option.id} className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.complianceNeeds.includes(option.id)}
                    onChange={(e) => handleCheckboxChange("complianceNeeds", option.id, e.target.checked)}
                    className="h-4 w-4 mt-1 border-white/10 bg-white/5 text-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm text-white font-medium">{option.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{option.desc}</div>
                    <div className="text-xs text-blue-400 mt-0.5 font-medium">{option.tier}</div>
                  </div>
                </label>
              ))}
            </div>
            {(formData.complianceNeeds.includes("cmmc") || formData.complianceNeeds.includes("fisma")) && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
                <p className="text-sm text-amber-200 leading-relaxed">
                  <strong>Scoping consultation required:</strong> CMMC Level 2 and FISMA compliance involve infrastructure changes (AWS GovCloud, isolated VPCs) and documentation packages (SSP, POA&M, ATO) that cannot be priced from this form. These engagements typically start at $40,000. We will reach out to schedule a dedicated scoping call before any proposal is issued.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h4 className="text-sm font-medium text-white mb-2">Industry-Specific Security Needs</h4>
            <textarea
              value={formData.specialRequirements}
              onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe any industry-specific security requirements, government contracts, or special compliance needs..."
            />
          </div>

          <div className="bg-gray-900 border border-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300">Security Expertise:</strong> The principal holds an active U.S. Government Secret clearance and applies NIST and CMMC frameworks where a project requires them.
            </p>
          </div>
        </div>
      </section>

      {/* Budget & Timeline */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">6</span>
          Timeline & Budget
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Project Timeline *</label>
            <select
              required
              value={formData.timeline}
              onChange={(e) => handleInputChange("timeline", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select timeline preference</option>
              <option value="flexible">Flexible - Quality over speed</option>
              <option value="target">Target launch date (specify below)</option>
              <option value="fixed">Fixed deadline - Must launch by specific date</option>
              <option value="phased">Phased approach - Launch basic version first</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Target Launch Date (if applicable)</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => handleInputChange("targetDate", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Budget Range *</label>
            <select
              required
              value={formData.budgetRange}
              onChange={(e) => handleInputChange("budgetRange", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select budget range</option>
              <option value="professional">Professional Tier - $2,800 range</option>
              <option value="business">Business Tier - $4,800 range</option>
              <option value="enterprise">Enterprise Tier - $8,500+ range</option>
              <option value="flexible">Flexible - Show me options</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Ongoing Maintenance Preference</label>
            <select
              value={formData.maintenancePreference}
              onChange={(e) => handleInputChange("maintenancePreference", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select preference</option>
              <option value="self-managed">Self-managed - I&apos;ll handle updates</option>
              <option value="professional-care">Professional Care - $149/mo</option>
              <option value="business-care">Business Care - $299/mo</option>
              <option value="custom">Custom plan - Let&apos;s discuss</option>
            </select>
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">7</span>
          Additional Information
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Special Requirements or Concerns</label>
            <textarea
              value={formData.specialRequirements}
              onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Anything else we should know about your project, industry requirements, or special considerations?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Questions for Us</label>
            <textarea
              value={formData.questionsForUs}
              onChange={(e) => handleInputChange("questionsForUs", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What questions do you have about our process, timeline, or capabilities?"
            />
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="pt-6">
        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="project-intake-company-website">Company website</label>
          <input
            id="project-intake-company-website"
            name="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>

        <div className="mb-5">
          <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-gray-300">
            <input
              type="checkbox"
              required
              checked={humanAttestation}
              onChange={(event) => {
                setHumanAttestation(event.target.checked);
                if (event.target.checked && submitStatus === "error") {
                  setSubmitStatus("idle");
                  setErrorDetail("");
                }
              }}
              className="mt-1 h-4 w-4 shrink-0 accent-blue-500"
            />
            <span>
              I confirm I am a person authorized to submit this project request, not an
              automated agent or bot.
            </span>
          </label>

          <TurnstileWidget
            action="intake"
            onTokenChange={setTurnstileToken}
            resetKey={turnstileResetKey}
          />
        </div>

        {submitStatus === "error" && (
          <div className="mb-4 rounded-md bg-red-900/20 border border-red-500/20 p-4" role="alert">
            <p className="text-red-400 text-sm">
              {errorDetail || "There was an error submitting your form. Please try again."}{" "}
              <a href="/contact" className="underline">Contact us</a> if the problem continues.
            </p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !humanAttestation ||
            (requiresTurnstile && !turnstileToken)
          }
          className="w-full inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send project details"}
        </button>
        
        <p className="mt-3 text-xs text-gray-500 text-center">
          By submitting this form, you agree to our{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-gray-300">
            privacy policy
          </a>
          . We&apos;ll review your information and follow up.
        </p>
      </div>
    </form>
  );
}
