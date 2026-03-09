"use client";

import { useState } from "react";
import { SITE } from "@/lib/constants";

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
  { id: "analytics-dashboard", label: "Analytics Dashboard - Enterprise SaaS platform with real-time metrics" },
  { id: "international-market", label: "International Market - E-commerce with cultural sections and product management" },
  { id: "portal-pro", label: "Portal Pro - Comprehensive business platform with role-based authentication" },
  { id: "law-firm", label: "Law Firm - Professional services with case studies and client testimonials" },
  { id: "restaurant", label: "Restaurant - Local business with menu, reservations, and online ordering" },
  { id: "trades-contractor", label: "Trades Contractor - Service business with project galleries and quote requests" },
  { id: "veteran-nonprofit", label: "Veteran Nonprofit - Mission-driven organization with donation and volunteer systems" },
  { id: "none", label: "None match - I need something completely different" },
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
    maintenancePreference: "",
    specialRequirements: "",
    questionsForUs: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Track form submission analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'form_submit', {
          event_category: 'engagement',
          event_label: 'project_intake_form',
          value: formData.budgetRange
        });
      }

      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setSubmitStatus("success");
      
      // Track successful submission
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // You'll need to set this up
          event_category: 'lead_generation',
          event_label: 'project_intake_completed'
        });
      }

    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus("error");
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
        <h3 className="text-2xl font-semibold text-white mb-4">Thank You!</h3>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          Your project intake has been submitted successfully. We've created a dedicated folder for your project and will review your requirements within 4 hours.
        </p>
        <p className="text-sm text-gray-500">
          You'll receive an email confirmation at <span className="text-white">{formData.contactEmail}</span> shortly.
        </p>
        <div className="mt-8">
          <a
            href="/portfolio"
            className="inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition mr-4"
          >
            View Our Portfolio
          </a>
          <a
            href="/book"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 bg-black/50 px-6 text-sm font-medium text-white hover:bg-white/5 transition"
          >
            Schedule a Call
          </a>
        </div>
      </div>
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
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="City, State or Country"
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
                placeholder="your@email.com"
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

      {/* Budget & Timeline */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">4</span>
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
              <option value="professional">Professional Tier - $2,400 range</option>
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
              <option value="self-managed">Self-managed - I'll handle updates</option>
              <option value="professional-care">Professional Care - $149/mo</option>
              <option value="business-care">Business Care - $299/mo</option>
              <option value="custom">Custom plan - Let's discuss</option>
            </select>
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white mr-3">5</span>
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
        {submitStatus === "error" && (
          <div className="mb-4 rounded-md bg-red-900/20 border border-red-500/20 p-4">
            <p className="text-red-400 text-sm">
              There was an error submitting your form. Please try again or email us directly at {SITE.email}.
            </p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Project Intake"}
        </button>
        
        <p className="mt-3 text-xs text-gray-500 text-center">
          By submitting this form, you agree to our privacy policy. We'll respond within 4 hours during business days.
        </p>
      </div>
    </form>
  );
}