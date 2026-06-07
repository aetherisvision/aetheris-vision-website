import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateComplianceScoping, REGULATED_FRAMEWORKS } from '@/lib/compliance-agent';
import { sql } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limit: 5 submissions per IP per 10 minutes. Distributed across Vercel
// instances when Upstash/Vercel KV is configured, else in-memory (issue #12).
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

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
  platformPreference: string;
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

    const { success } = await rateLimit(ip, {
      limit: RATE_LIMIT,
      windowMs: WINDOW_MS,
      prefix: 'intake',
    });
    if (!success) {
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

    // --- Persist to DB ---
    let clientId: number | null = null;
    let projectId: number | null = null;
    try {
      // Upsert client by email
      const existingClients = await sql`
        SELECT id FROM clients WHERE email = ${formData.contactEmail} LIMIT 1
      `;
      if (existingClients.length > 0) {
        clientId = existingClients[0].id;
      } else {
        const newClient = await sql`
          INSERT INTO clients (name, contact_name, email, phone)
          VALUES (${formData.companyName}, ${formData.contactName}, ${formData.contactEmail}, ${formData.contactPhone ?? null})
          RETURNING id
        `;
        clientId = newClient[0].id;
      }

      // Create project record
      const newProject = await sql`
        INSERT INTO projects (client_id, name, status)
        VALUES (${clientId}, ${`${formData.companyName} — Website Project`}, 'intake')
        RETURNING id
      `;
      projectId = newProject[0].id;

      // Save intake submission
      await sql`
        INSERT INTO intake_submissions (
          client_id, project_id, company_name, industry, location, revenue,
          contact_name, contact_title, contact_email, contact_phone,
          budget_range, timeline, objectives, special_requirements,
          questions_for_us, platform_preference, raw_data
        ) VALUES (
          ${clientId}, ${projectId}, ${formData.companyName}, ${formData.industry ?? null},
          ${formData.location ?? null}, ${formData.revenue ?? null},
          ${formData.contactName}, ${formData.contactTitle ?? null},
          ${formData.contactEmail}, ${formData.contactPhone ?? null},
          ${formData.budgetRange ?? null}, ${formData.timeline ?? null},
          ${formData.objectives ?? []}, ${formData.specialRequirements ?? null},
          ${formData.questionsForUs ?? null}, ${formData.platformPreference ?? null},
          ${JSON.stringify(formData)}
        )
      `;
    } catch (dbError) {
      console.error('DB persistence failed (non-fatal):', dbError);
    }

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

    // Fire compliance agent for regulated framework selections
    const triggeredFrameworks = (formData.complianceNeeds ?? []).filter(
      (f) => (REGULATED_FRAMEWORKS as readonly string[]).includes(f)
    );

    if (triggeredFrameworks.length > 0 && process.env.ANTHROPIC_API_KEY) {
      try {
        const scopingBrief = await generateComplianceScoping({
          companyName: formData.companyName,
          industry: formData.industry,
          revenue: formData.revenue,
          location: formData.location,
          primaryAudience: formData.primaryAudience,
          budgetRange: formData.budgetRange,
          specialRequirements: formData.specialRequirements,
          objectives: formData.objectives ?? [],
          complianceNeeds: formData.complianceNeeds ?? [],
        });

        if (scopingBrief) {
          await resend.emails.send({
            from: 'system@aetherisvision.com',
            to: ['marston@aetherisvision.com'],
            subject: `⚠️ COMPLIANCE SCOPING REQUIRED: ${formData.companyName} — ${triggeredFrameworks.join(', ').toUpperCase()}`,
            text: `COMPLIANCE SCOPING BRIEF\nGenerated by Claude API\n${'='.repeat(60)}\n\nClient: ${formData.companyName}\nContact: ${formData.contactName} <${formData.contactEmail}>\nFrameworks: ${triggeredFrameworks.join(', ').toUpperCase()}\n\n${'='.repeat(60)}\n\n${scopingBrief}\n\n${'='.repeat(60)}\nDo NOT issue a quote until scoping call is complete.\nAuto-generated from compliance-agent.ts`,
          });
        }
      } catch (agentError) {
        console.error('Compliance agent failed (non-fatal):', agentError);
      }
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
