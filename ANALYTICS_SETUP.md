# Environment Variables Setup

This document outlines all required environment variables for the complete client intake and analytics system.

## 🔐 Google Drive Integration

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Google Drive API - Client Folder Creation
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here...\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_CLIENTS_FOLDER_ID=1ABC123xyz_your_main_clients_folder_id

# Email Notifications (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# AI Chat Assistant (Anthropic)
ANTHROPIC_API_KEY=sk-ant-your_key_here

# Google Analytics (Optional but Recommended)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Google Drive Setup Steps

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing one
   - Enable Google Drive API

2. **Create Service Account**:
   - Navigate to IAM & Admin > Service Accounts
   - Create service account with appropriate name
   - Generate and download JSON key file
   - Extract `client_email` and `private_key` for environment variables

3. **Setup Drive Folder Structure**:
   ```
   📁 Clients (Main folder - get this ID for GOOGLE_DRIVE_CLIENTS_FOLDER_ID)
   └── 📁 Company Name - 2026-03-08 (Auto-created for each client)
       ├── 📄 Company Name - Project Intake.txt
       └── 📄 Company Name - Project Status.txt
   ```

4. **Share Folder with Service Account**:
   - Right-click main "Clients" folder in Google Drive
   - Share with service account email (Editor permissions)
   - Copy folder ID from URL for environment variable

### Folder ID Location
The folder ID is in the Google Drive URL:
```
https://drive.google.com/drive/folders/[FOLDER_ID_HERE]
```

## 📧 Email Setup (Resend)

1. **Create Resend Account**: [resend.com](https://resend.com)
2. **Add Domain**: Verify your domain (e.g., `aetherisvision.com`)
3. **Get API Key**: Copy from dashboard to `RESEND_API_KEY`
4. **Update Email Addresses** in `/src/app/api/intake/route.ts`:
   ```typescript
   from: 'projects@yourdomain.com',  // Update this
   to: ['contact@yourdomain.com'],   // Update this
   ```

## 📊 Analytics Configuration

### Current Setup: Vercel Analytics
✅ **Already Active** - Basic page views and performance metrics

### Enhanced Analytics: Google Analytics 4

Add comprehensive behavior tracking:

1. **Create GA4 Property**: [analytics.google.com](https://analytics.google.com)
2. **Get Measurement ID**: Copy `G-XXXXXXXXXX` ID
3. **Add to Environment**: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

### Analytics Data Captured

#### Automatic (Vercel Analytics):
- Page views and unique visitors
- Performance metrics (Core Web Vitals)
- Geographic data and referrer sources

#### Enhanced (Google Analytics 4):
- **Form Interactions**: Intake form submissions, field completion rates
- **Conversion Tracking**: Discovery call bookings, quote requests
- **Portfolio Engagement**: Which demos are viewed most
- **Client Journey**: Path from initial visit to intake submission

#### Custom Business Intelligence:
- **Client Profile Analytics**: Industry distribution, budget ranges
- **Portfolio Performance**: Which examples drive most inquiries
- **Geographic Insights**: Where high-value clients are located
- **Conversion Optimization**: Form abandonment points, successful paths

### Intake Form Analytics Events

The system automatically tracks:

```typescript
// Form submission attempt
gtag('event', 'form_submit', {
  event_category: 'engagement',
  event_label: 'project_intake_form',
  value: formData.budgetRange
});

// Successful conversion
gtag('event', 'conversion', {
  send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
  event_category: 'lead_generation',
  event_label: 'project_intake_completed'
});
```

## 🚀 Deployment Checklist

### Vercel Environment Variables

In your Vercel dashboard, add:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
GOOGLE_DRIVE_CLIENTS_FOLDER_ID
RESEND_API_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_GA_MEASUREMENT_ID
```

**Note on ANTHROPIC_API_KEY:** Currently under personal Anthropic account. Move to business account when the Aetheris Vision business account is created.

**Important**: Use "Encrypted" sensitivity level for all keys.

### Vercel Domain Setup

1. **Custom Domain**: Add your domain in Vercel settings
2. **Email Domain**: Ensure email domain matches Resend verification
3. **SSL Certificate**: Auto-provisioned by Vercel

## 📈 Business Intelligence Dashboard

### Client Folder Organization
Each intake creates:
```
📁 [Company Name] - [Date]
├── 📄 Project Intake.txt (All form responses)
├── 📄 Project Status.txt (Internal tracking)
└── 📁 Communications (Added during project)
    ├── 📄 Initial Response.txt
    ├── 📄 Proposal.pdf
    └── 📄 Contract.pdf
```

### Analytics Reports Available

1. **Lead Quality Report**:
   - Budget tier distribution
   - Industry vertical analysis
   - Geographic concentration
   - Conversion rate by source

2. **Portfolio Performance**:
   - Most referenced portfolio pieces
   - Correlation between style preference and budget
   - Industry-specific portfolio preferences

3. **Process Optimization**:
   - Form completion rates by section
   - Average time to complete intake
   - Common drop-off points

## 🔒 Security & Privacy

### Data Protection
- **Encryption**: All API keys encrypted in Vercel
- **Access Control**: Service account has minimal required permissions
- **Data Retention**: Client data stored securely in Google Drive
- **Privacy Compliance**: Form includes privacy policy acceptance

### Monitoring & Alerts
- **Error Tracking**: API failures logged and monitored
- **Uptime Monitoring**: Form availability tracked
- **Response Time**: 4-hour response commitment tracked

---

## Quick Setup Summary

1. ✅ Create Google Cloud project + service account
2. ✅ Create "Clients" folder in Google Drive, share with service account
3. ✅ Setup Resend account + verify domain
4. ✅ Create GA4 property (optional)
5. ✅ Add all environment variables to Vercel
6. ✅ Test form submission
7. ✅ Verify folder creation and email delivery

**Result**: Professional intake system with automated client folder creation, email notifications, and comprehensive analytics tracking.