import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Drive API setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Email notification setup (using Resend or similar)
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface IntakeFormData {
  companyName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactTitle: string;
  contactPhone?: string;
  budgetRange: string;
  timeline: string;
  objectives: string[];
  portfolioReference: string;
  successMetrics: string;
  specialRequirements?: string;
  submittedAt: string;
  userAgent?: string;
  referrer?: string;
  // ... other fields
}

async function createClientFolder(formData: IntakeFormData) {
  try {
    // Create main client folder
    const clientFolderName = `${formData.companyName} - ${new Date().toISOString().split('T')[0]}`;
    
    const folderMetadata = {
      name: clientFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID], // Your main "Clients" folder
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id,name,webViewLink',
    });

    // Create intake document with all form data
    const intakeDoc = {
      name: `${formData.companyName} - Project Intake.txt`,
      parents: [folder.data.id],
    };

    const intakeContent = generateIntakeDocument(formData);
    
    await drive.files.create({
      requestBody: intakeDoc,
      media: {
        mimeType: 'text/plain',
        body: intakeContent,
      },
    });

    // Create project status doc
    const statusDoc = {
      name: `${formData.companyName} - Project Status.txt`,
      parents: [folder.data.id],
    };

    const statusContent = `Project Status: New Intake
Submitted: ${formData.submittedAt}
Next Action: Technical Review & Response (Due: ${new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()})
Budget Tier: ${formData.budgetRange}
Timeline: ${formData.timeline}

--- INTERNAL NOTES ---
[Add internal notes and progress updates here]

--- COMMUNICATION LOG ---
${formData.submittedAt} - Initial intake form submitted
`;

    await drive.files.create({
      requestBody: statusDoc,
      media: {
        mimeType: 'text/plain',
        body: statusContent,
      },
    });

    return {
      folderId: folder.data.id,
      folderName: folder.data.name,
      folderLink: folder.data.webViewLink,
    };

  } catch (error) {
    console.error('Error creating client folder:', error);
    throw new Error('Failed to create client folder');
  }
}

function generateIntakeDocument(formData: IntakeFormData): string {
  return `
🏢 CLIENT INTAKE FORM
=====================================

BUSINESS INFORMATION
-------------------
Company Name: ${formData.companyName}
Industry: ${formData.industry}
Location: ${formData.location || 'Not specified'}
Revenue Range: ${formData.revenue || 'Not specified'}
Current Website: ${formData.currentWebsite || 'None'}

PRIMARY CONTACT
--------------
Name: ${formData.contactName}
Title: ${formData.contactTitle}
Email: ${formData.contactEmail}
Phone: ${formData.contactPhone || 'Not provided'}

PROJECT GOALS & VISION
---------------------
Primary Objectives: ${formData.objectives.join(', ')}
Success Metrics: ${formData.successMetrics}
Primary Audience: ${formData.primaryAudience}
Secondary Audience: ${formData.secondaryAudience || 'Not specified'}
Geographic Focus: ${formData.geographicFocus || 'Not specified'}

PORTFOLIO REFERENCE & STYLE
---------------------------
Portfolio Reference: ${formData.portfolioReference}
Visual Style: ${formData.visualStyle || 'Not specified'}
Reference Websites: ${formData.referenceWebsites || 'None provided'}

TIMELINE & BUDGET
----------------
Timeline Preference: ${formData.timeline}
Target Launch Date: ${formData.targetDate || 'Not specified'}
Budget Range: ${formData.budgetRange}
Maintenance Preference: ${formData.maintenancePreference || 'Not specified'}

ADDITIONAL INFORMATION
---------------------
Special Requirements: ${formData.specialRequirements || 'None'}
Questions for Us: ${formData.questionsForUs || 'None'}

TECHNICAL METADATA
-----------------
Submitted: ${formData.submittedAt}
User Agent: ${formData.userAgent || 'Unknown'}
Referrer: ${formData.referrer || 'Direct'}

=====================================
Auto-generated from website intake form
`;
}

async function sendEmailNotifications(formData: IntakeFormData, folderInfo: any) {
  if (!RESEND_API_KEY) {
    console.log('No email API key configured, skipping email notifications');
    return;
  }

  // Client confirmation email
  const clientEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Project Intake Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Thank you for your project submission!</h1>
        
        <p>Hi ${formData.contactName},</p>
        
        <p>We've received your website project intake for <strong>${formData.companyName}</strong> and have created a dedicated project folder in our system.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">Next Steps:</h3>
            <ol style="margin: 0;">
                <li><strong>Review (within 4 hours):</strong> Our team will analyze your requirements</li>
                <li><strong>Technical Assessment:</strong> We'll evaluate complexity and recommend the best service tier</li>
                <li><strong>Consultation Call:</strong> 30-minute discussion about approach and timeline</li>
                <li><strong>Detailed Proposal:</strong> Transparent pricing and project scope</li>
            </ol>
        </div>
        
        <p><strong>Budget Tier:</strong> ${formData.budgetRange}<br>
        <strong>Timeline:</strong> ${formData.timeline}</p>
        
        <p>If you have any immediate questions, feel free to reply to this email or call us directly.</p>
        
        <p>Best regards,<br>
        The Aetheris Vision Team</p>
    </div>
</body>
</html>
`;

  // Internal notification email
  const internalEmailContent = `
🚨 NEW PROJECT INTAKE SUBMITTED

Company: ${formData.companyName} (${formData.industry})
Contact: ${formData.contactName} (${formData.contactTitle})
Email: ${formData.contactEmail}
Budget: ${formData.budgetRange}
Timeline: ${formData.timeline}

Portfolio Reference: ${formData.portfolioReference}
Primary Goals: ${formData.objectives.join(', ')}

Google Drive Folder: ${folderInfo.folderLink}

⏰ RESPONSE DUE: Within 4 hours (by ${new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleString()})

---
Full intake details available in the client folder.
`;

  try {
    // Send client confirmation
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
        html: clientEmailContent,
      }),
    });

    // Send internal notification
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'system@aetherisvision.com',
        to: ['contact@aetherisvision.com'], // Your email
        subject: `🚨 NEW INTAKE: ${formData.companyName} - ${formData.budgetRange}`,
        text: internalEmailContent,
      }),
    });

  } catch (error) {
    console.error('Email notification error:', error);
    // Don't fail the entire request if email fails
  }
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
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      geography: request.geo?.country || 'unknown',
    };

    // Log analytics (you can send this to your analytics service)
    console.log('📊 INTAKE FORM ANALYTICS:', JSON.stringify(analyticsData, null, 2));

    // Create Google Drive folder
    const folderInfo = await createClientFolder(formData);
    
    // Send email notifications
    await sendEmailNotifications(formData, folderInfo);

    // Optional: Log to external analytics service
    // await logToAnalyticsService(analyticsData);

    return NextResponse.json({
      success: true,
      message: 'Intake form submitted successfully',
      clientFolder: folderInfo,
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

// Optional: Analytics service integration
async function logToAnalyticsService(data: any) {
  // Example integration with analytics service
  // await fetch('YOUR_ANALYTICS_ENDPOINT', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
}