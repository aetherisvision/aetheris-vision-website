import { NextRequest, NextResponse } from 'next/server';

// Email notification setup (using Resend or similar)
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface IntakeFormData {
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
  
  // Metadata
  submittedAt?: string;
  userAgent?: string;
  referrer?: string;
}

// Fallback handler that works without Google Drive API
async function handleEmailSubmission(formData: IntakeFormData, analyticsData: any) {
  const emailContent = generateEmailContent(formData, analyticsData);
  
  if (RESEND_API_KEY) {
    try {
      // Send to your email
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'system@aetherisvision.com',
          to: ['contact@aetherisvision.com'],
          subject: `🚨 NEW INTAKE: ${formData.companyName} - ${formData.budgetRange}`,
          text: emailContent,
        }),
      });

      // Send confirmation to client
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'projects@aetherisvision.com',
          to: [formData.contactEmail],
          subject: `Project Intake Received - ${formData.companyName}`,
          text: `Hi ${formData.contactName},\n\nWe've received your project intake for ${formData.companyName}. Our team will review your requirements and respond within 4 hours during business days.\n\nThank you,\nAetheris Vision Team`,
        }),
      });

    } catch (emailError) {
      console.error('Email error:', emailError);
      // Fallback to console log if email fails
      console.log('📧 INTAKE SUBMISSION (EMAIL FALLBACK):', emailContent);
    }
  } else {
    // Ultimate fallback - log to console
    console.log('📧 INTAKE SUBMISSION (NO EMAIL CONFIG):', emailContent);
  }

  return true;
}

function generateEmailContent(formData: IntakeFormData, analyticsData: any): string {
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
Objectives: ${formData.objectives.join(', ')}

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
    const formData: IntakeFormData = await request.json();

    // Validate required fields
    if (!formData.companyName || !formData.contactName || !formData.contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Enhanced analytics tracking
    const analyticsData = {
      timestamp: new Date().toISOString(),
      companyName: formData.companyName,
      industry: formData.industry,
      budgetRange: formData.budgetRange,
      portfolioReference: formData.portfolioReference,
      objectives: formData.objectives,
      userAgent: formData.userAgent,
      referrer: formData.referrer,
      ipAddress: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown',
      geography: request.headers.get('cf-ipcountry') || 'unknown',
    };

    // Log analytics
    console.log('📊 INTAKE FORM ANALYTICS:', JSON.stringify(analyticsData, null, 2));

    // Process submission with email system
    const result = await handleEmailSubmission(formData, analyticsData);

    return NextResponse.json({
      success: true,
      message: 'Intake form submitted successfully',
      nextSteps: [
        'Technical review within 4 hours',
        'Consultation call scheduling',
        'Detailed proposal delivery'
      ]
    });

  } catch (error) {
    console.error('Intake form submission error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process intake form',
        message: 'Please try again or email us directly at contact@aetherisvision.com'
      },
      { status: 500 }
    );
  }
}

// Fallback handler that works without Google Drive API
async function handleEmailOnlySubmission(formData: IntakeFormData, analyticsData: any) {
  const emailContent = generateEmailContent(formData, analyticsData);
  
  if (RESEND_API_KEY) {
    try {
      // Send to your email
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'system@aetherisvision.com',
          to: ['contact@aetherisvision.com'],
          subject: `🚨 NEW INTAKE: ${formData.companyName} - ${formData.budgetRange}`,
          text: emailContent,
        }),
      });

      // Send confirmation to client
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'projects@aetherisvision.com',
          to: [formData.contactEmail],
          subject: `Project Intake Received - ${formData.companyName}`,
          text: `Hi ${formData.contactName},\n\nWe've received your project intake for ${formData.companyName}. Our team will review your requirements and respond within 4 hours during business days.\n\nThank you,\nAetheris Vision Team`,
        }),
      });

    } catch (emailError) {
      console.error('Email error:', emailError);
      // Fallback to console log if email fails
      console.log('📧 INTAKE SUBMISSION (EMAIL FALLBACK):', emailContent);
    }
  } else {
    // Ultimate fallback - log to console
    console.log('📧 INTAKE SUBMISSION (NO EMAIL CONFIG):', emailContent);
  }

  return NextResponse.json({
    success: true,
    message: 'Intake form submitted successfully',
    nextSteps: [
      'Technical review within 4 hours',
      'Consultation call scheduling', 
      'Detailed proposal delivery'
    ]
  });
}

// Optional: Analytics service integration  
async function logToAnalyticsService(data: IntakeFormData & { analyticsData: any }) {
  // Future enhancement: send to analytics service
  console.log('Intake submitted:', {
    company: data.companyName,
    budget: data.budgetRange,
    timeline: data.timeline,
    country: data.analyticsData.geography
  });
}