import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple in-memory rate limit: max 5 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.reset < now) {
    rateLimitMap.set(ip, { count: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

interface IntakeFormData {
  companyName: string;
  industry: string;
  currentWebsite: string;
  location: string;
  revenue: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  objectives: string[];
  successMetrics: string;
  primaryAudience: string;
  secondaryAudience: string;
  geographicFocus: string;
  portfolioReference: string;
  visualStyle: string;
  referenceWebsites: string;
  contentPages: string[];
  estimatedPages: string;
  interactiveFeatures: string[];
  ecommerceFeatures: string[];
  userAccountFeatures: string[];
  dataComplexity: string;
  integrations: string[];
  contentManagement: string[];
  trafficExpectations: string;
  geographicReach: string;
  performancePriorities: string[];
  securityRequirements: string[];
  complianceNeeds: string[];
  uptimeRequirements: string;
  backupNeeds: string;
  supportRequirements: string;
  timeline: string;
  targetDate: string;
  budgetRange: string;
  maintenancePreference: string;
  specialRequirements: string;
  questionsForUs: string;
  submittedAt?: string;
  userAgent?: string;
  referrer?: string;
}

function generateEmailContent(formData: IntakeFormData, analyticsData: Record<string, string>): string {
  return `
🚨 NEW PROJECT INTAKE SUBMITTED

BUSINESS INFORMATION
===================
Company: ${formData.companyName}
Industry: ${formData.industry}
Location: ${formData.location || 'Not specified'}
Revenue: ${formData.revenue || 'Not specified'}

PRIMARY CONTACT
==============
Name: ${formData.contactName}
Title: ${formData.contactTitle}
Email: ${formData.contactEmail}
Phone: ${formData.contactPhone || 'Not provided'}

PROJECT DETAILS
==============
Budget Range: ${formData.budgetRange}
Timeline: ${formData.timeline}
Target Date: ${formData.targetDate || 'Not specified'}
Portfolio Reference: ${formData.portfolioReference}
Objectives: ${(formData.objectives ?? []).join(', ')}

SUCCESS METRICS
==============
${formData.successMetrics}

AUDIENCES
=========
Primary: ${formData.primaryAudience}
Secondary: ${formData.secondaryAudience || 'Not specified'}

STYLE PREFERENCES
================
Visual Style: ${formData.visualStyle || 'Not specified'}
Reference Websites: ${formData.referenceWebsites || 'None provided'}

ADDITIONAL INFO
==============
Special Requirements: ${formData.specialRequirements || 'None'}
Questions: ${formData.questionsForUs || 'None'}

TECHNICAL METADATA
=================
Submitted: ${formData.submittedAt}
IP: ${analyticsData.ipAddress}
Country: ${analyticsData.geography}
User Agent: ${formData.userAgent}
Referrer: ${formData.referrer || 'Direct'}

⏰ RESPONSE DUE: Within 4 hours (by ${new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleString()})

=====================================
Auto-generated from intake form system
`;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
              ?? request.headers.get('x-real-ip')
              ?? 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const formData: IntakeFormData = await request.json();

    if (!formData.companyName || !formData.contactName || !formData.contactEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const analyticsData = {
      timestamp: new Date().toISOString(),
      ipAddress: ip,
      geography: request.headers.get('cf-ipcountry') ?? 'unknown',
    };

    console.log('📊 INTAKE FORM:', JSON.stringify({
      company: formData.companyName,
      budget: formData.budgetRange,
      industry: formData.industry,
      ...analyticsData,
    }));

    const emailContent = generateEmailContent(formData, analyticsData);

    try {
      await resend.emails.send({
        from: 'system@aetherisvision.com',
        to: ['contact@aetherisvision.com'],
        subject: `🚨 NEW INTAKE: ${formData.companyName} - ${formData.budgetRange}`,
        text: emailContent,
      });

      await resend.emails.send({
        from: 'projects@aetherisvision.com',
        to: [formData.contactEmail],
        subject: `Project Intake Received - ${formData.companyName}`,
        text: `Hi ${formData.contactName},\n\nWe've received your project intake for ${formData.companyName}. Our team will review your requirements and respond within 4 hours during business days.\n\nThank you,\nAetheris Vision Team`,
      });
    } catch (emailError) {
      console.error('Email delivery failed:', emailError);
      // Log full submission so no data is lost even if email fails
      console.log('📧 INTAKE FALLBACK LOG:', emailContent);
    }

    return NextResponse.json({
      success: true,
      message: 'Intake form submitted successfully',
      nextSteps: [
        'Technical review within 4 hours',
        'Consultation call scheduling',
        'Detailed proposal delivery',
      ],
    });

  } catch (error) {
    console.error('Intake submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process intake form', message: 'Please try again or email us directly at contact@aetherisvision.com' },
      { status: 500 }
    );
  }
}
