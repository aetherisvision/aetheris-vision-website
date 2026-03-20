# Aetheris Vision Business System Documentation

**Version**: 2.1
**Date**: March 19, 2026
**Reading Level**: 8th Grade  
**Purpose**: Complete system documentation for business continuity  

---

## What This Document Does

This document explains everything about your website business system. Think of it like an instruction manual for running a restaurant - it tells you how to take orders, cook food, handle money, and keep customers happy.

If something happens and the main developer isn't available, anyone can use this document to:
- Keep the website running
- Handle new customers
- Fix problems
- Add new features

---

## Table of Contents

1. [What We Built (The Big Picture)](#1-what-we-built)
2. [How Customers Find and Hire You](#2-customer-journey)
3. [The Client Intake System](#3-client-intake-system)
4. [Email Notifications System](#4-email-system)
5. [Portfolio Demonstrations](#5-portfolio-demos)
6. [Security and Compliance](#6-security-compliance)
7. [Daily Operations Guide](#7-daily-operations)
8. [Troubleshooting Common Problems](#8-troubleshooting)
9. [Adding New Features](#9-adding-features)
10. [Emergency Procedures](#10-emergency-procedures)

---

## 1. What We Built (The Big Picture)

### Your Website is Now a Professional Sales Machine

Think of your website like a high-end car dealership. When potential customers walk in, they see:

**🏢 Professional Showroom** (Your Portfolio)
- 7 different website examples showing your skills
- Each one demonstrates different capabilities
- From simple restaurant sites to complex business platforms

**📋 Professional Sales Process** (Client Intake System)
- Customers fill out detailed forms about their needs
- You get emails with all their requirements
- No more guessing what they want or missing details

**💰 Premium Pricing Strategy** (Business Positioning)
- Your prices now range from $2,400 to $8,500+
- Positioned as enterprise-level professional service
- Includes security compliance for big companies

**🤖 AI Chat Assistant** (24/7 Visitor Support)
- Floating chat widget on every page
- Answers questions about services, pricing, and state/federal contracting instantly
- Powered by Claude AI; scoped to Aetheris Vision content only
- Rate-limited to prevent abuse; routes serious inquiries to booking

**🔒 Enterprise Security** (SOC-2 Compliance)
- Documentation that shows you meet enterprise security standards
- Required for working with large companies
- Builds trust with professional clients

### Why This Matters for Your Business

**Before**: You were like a street vendor with a simple cart
- Hard to explain what you do
- Customers didn't know your quality level
- Difficult to charge premium prices

**Now**: You're like a BMW dealership
- Professional presentation shows your capabilities
- Detailed process captures customer requirements
- Premium positioning justifies higher prices
- Enterprise compliance opens doors to big contracts

---

## 2. Customer Journey (How People Become Paying Clients)

### Step 1: Discovery
**How they find you:**
- Google searches for web developers
- LinkedIn recommendations
- Referrals from existing clients
- Business networking events

**What they see first:**
- Professional website at your domain
- Clean portfolio showcasing different types of projects
- Clear pricing and service descriptions

### Step 2: Evaluation
**What they browse:**
- **Portfolio page** (`/portfolio`) - See 7 different project types
- **Capabilities page** (`/capabilities`) - Understand your skills and state/federal contracting credentials
- **Security page** (`/security`) - Check your professional standards
- **AI Chat Assistant** (bottom-right button) - Ask questions instantly without filling out a form

**What they're thinking:**
- "Can this person build what I need?"
- "Do they understand businesses like mine?"
- "Are they professional enough for our company?"
- "Do they work with state agencies, not just federal?"

### Step 3: Initial Contact
**The intake process:**
1. They click "Start Project Discussion" or visit `/intake`
2. Fill out comprehensive form with project details
3. Submit form - takes about 10-15 minutes
4. Automatic confirmation email sent to them
5. Detailed project brief email sent to you

### Step 4: Your Response
**What you receive by email:**
```
🚨 NEW INTAKE: Acme Corp - $5,000-$8,500

BUSINESS INFORMATION
Company: Acme Corp
Industry: Technology
Budget: $5,000-$8,500
Timeline: 6-8 weeks

PROJECT DETAILS
[Complete requirements, features, timeline, contact info]

⏰ RESPONSE DUE: Within 4 hours
```

**Your professional response process:**
1. Review their complete requirements (no phone tag needed)
2. Prepare accurate quote based on their specifications
3. Reply within 4 hours with proposal
4. Schedule consultation call if needed
5. Send detailed contract and begin project

### Step 5: Closing the Deal
**Why they choose you:**
- Professional presentation builds confidence
- Detailed intake shows you understand their needs
- Enterprise security compliance (for corporate clients)
- Portfolio demonstrates exact capabilities they need

---

## 3. Client Intake System (The Heart of Your Sales Process)

### What It Does (Simple Explanation)

Think of the intake system like a restaurant order form, but for websites:

**Traditional way** (like most developers):
- Customer says: "I want a website"
- You guess what they mean
- Lots of back-and-forth emails
- Often miss important requirements

**Your new system** (like a detailed restaurant order):
- Customer fills out comprehensive form
- Specifies budget, timeline, features wanted
- Describes their business and audience
- Lists technical requirements
- You get complete picture before quoting

### Technical Implementation

**Where the code lives:**
- Main form: `/src/app/intake/page.tsx`
- Form component: `/src/components/ProjectIntakeForm.tsx`  
- Processing logic: `/src/app/api/intake/route.ts`

**How it works technically:**
1. **Frontend Form** - Customer sees professional multi-step form
2. **Data Collection** - Form captures 40+ data points about their project
3. **Validation** - Ensures required fields are completed
4. **API Processing** - Sends data to your email system
5. **Email Delivery** - You receive formatted project brief
6. **Customer Confirmation** - They get professional acknowledgment

**Data captured includes:**
- Business information (company, industry, revenue)
- Project goals and success metrics
- Technical requirements (features, integrations, security)
- Timeline and budget expectations
- Contact details for follow-up

### Email Integration

**Service used:** Resend (professional email API)
- More reliable than regular contact forms
- Professional formatting
- Automatic confirmations
- Delivery tracking

**Configuration in Vercel:**
- Environment variable: `RESEND_API_KEY`
- Emails sent from: `onboarding@resend.dev`
- Delivered to: `contact@aetherisvision.com`

### Form Sections (What Customers Fill Out)

**1. Business Information**
- Company name and industry
- Current website (if any)
- Company size and revenue
- Primary contact details

**2. Project Goals**
- What they want to achieve
- Target audience
- Success metrics
- Geographic focus

**3. Portfolio Reference**
- Which of your portfolio examples matches their vision
- Style preferences
- Reference websites they like

**4. Technical Requirements**  
- Content pages needed
- Interactive features
- E-commerce requirements
- User account systems
- Backend complexity
- Third-party integrations

**5. Infrastructure Needs**
- Expected website traffic
- Performance priorities
- Security requirements
- Compliance needs
- Backup and support preferences

**6. Timeline and Budget**
- Project timeline
- Target completion date
- Budget range
- Ongoing maintenance needs

---

## 4. Email System (How You Get Notified)

### The Problem This Solves

**Before:** Contact forms that don't work
- Messages get lost in spam
- No confirmation they submitted  
- You miss potential clients

**Now:** Professional email system
- Reliable delivery to your inbox
- Professional formatting
- Customer gets confirmation
- All requirements clearly organized

### Technical Setup

**Email Service:** Resend API
- Industry-standard email service
- High delivery rates
- Professional formatting
- Detailed tracking and logs

**Configuration Steps:**
1. Sign up at resend.com
2. Create API key
3. Add `RESEND_API_KEY` to Vercel environment variables
4. System automatically sends emails when forms submitted

**Email Templates:**

**To You (Project Brief):**
```
Subject: 🚨 NEW INTAKE: [Company Name] - [Budget Range]

BUSINESS INFORMATION
===================
Company: [Company Name]
Industry: [Industry]
Revenue: [Revenue Level]

PROJECT DETAILS
==============
Budget Range: [Budget]
Timeline: [Timeline]
Features Needed: [List]

CONTACT INFORMATION
==================
Name: [Contact Name]
Email: [Contact Email]
Phone: [Phone]

⏰ RESPONSE DUE: Within 4 hours
```

**To Customer (Confirmation):**
```
Subject: Project Intake Received - [Company Name]

Hi [Customer Name],

We've received your project intake for [Company Name]. Our team will review your requirements and respond within 4 hours during business days.

Thank you,
Aetheris Vision Team
```

### Backup System

**If email fails:** All submissions are logged in Vercel function logs
- Go to Vercel Dashboard → Your Project → Functions
- Click on `/api/intake` function  
- View logs to see form submissions

---

## 5. Portfolio Demos (Your Professional Showcase)

### Why These Matter

Think of your portfolio like a restaurant's display case. Instead of telling customers "we make good food," you show them exactly what the food looks like.

**Instead of saying:** "I build websites"
**You show:** 7 different working websites they can click through

### The 7 Portfolio Examples

**1. Analytics Dashboard** (`/portfolio/analytics-dashboard`)
- **What it shows:** Complex business data visualization
- **Target client:** Companies needing internal dashboards
- **Key features:** Charts, real-time data, user authentication
- **Price range:** $8,500+ (enterprise complexity)

**2. International Market** (`/portfolio/international-market`)  
- **What it shows:** E-commerce with cultural customization
- **Target client:** Companies selling globally
- **Key features:** Multi-language, product catalogs, cultural sections
- **Price range:** $5,000-$8,500 (e-commerce complexity)

**3. Portal Pro** (`/portfolio/portal-pro`)
- **What it shows:** Complete business platform
- **Target client:** Service companies needing client portals
- **Key features:** User roles, project management, document sharing
- **Price range:** $8,500+ (custom platform)

**4. Law Firm** (`/portfolio/law-firm`)
- **What it shows:** Professional services website
- **Target client:** Lawyers, consultants, professional services
- **Key features:** Case studies, team profiles, consultation booking
- **Price range:** $2,400-$4,800 (professional services)

**5. Restaurant** (`/portfolio/restaurant`)
- **What it shows:** Local business with bookings
- **Target client:** Restaurants, cafes, local services
- **Key features:** Menu display, reservations, online ordering
- **Price range:** $2,400-$4,800 (local business)

**6. Trades Contractor** (`/portfolio/trades-contractor`)
- **What it shows:** Service business with project galleries
- **Target client:** Contractors, tradespeople, service providers
- **Key features:** Project galleries, quote requests, service areas
- **Price range:** $2,400-$4,800 (service business)

**7. Veteran Nonprofit** (`/portfolio/veteran-nonprofit`)
- **What it shows:** Mission-driven organization
- **Target client:** Nonprofits, charities, community organizations
- **Key features:** Donation systems, volunteer management, events
- **Price range:** $2,400-$4,800 (nonprofit pricing)

### How Customers Use These

**During sales conversations:**
- "I like what you did for the law firm, but with more e-commerce like the international market"
- "The analytics dashboard is close, but we need it simpler"
- "Can you build something like Portal Pro but for restaurants?"

**This helps you:**
- Skip explaining what you can build
- Start conversations about customization
- Justify premium pricing with working examples
- Close deals faster with visual proof

---

## 6. Security & Compliance (Enterprise Readiness)

### Why This Matters

Large companies can't hire just anyone. They need to check boxes for security and compliance. Your website now has documentation that shows you meet enterprise standards.

### SOC-2 Compliance Page (`/security`)

**What SOC-2 means:** Security Organization Control Type 2
- Industry standard for security practices
- Required by many enterprise clients
- Shows you take security seriously

**What's documented:**
- Security controls and procedures
- Data protection practices  
- Business continuity planning
- Disaster recovery procedures
- Regular security assessments

**Business impact:**
- Qualifies you for enterprise contracts
- Justifies premium pricing
- Builds trust with corporate clients
- Differentiates from typical freelancers

### Security Features Built Into Your System

**1. Secure Data Handling**
- All form data encrypted in transit
- No sensitive data stored on servers
- Professional email delivery only

**2. Privacy Compliance**
- GDPR compliant data collection
- CCPA compliance for California clients
- Clear privacy policies
- Customer data protection

**3. Infrastructure Security**
- Hosted on Vercel's enterprise infrastructure
- Automatic HTTPS/SSL encryption
- DDoS protection included
- 99.9% uptime guarantee

**4. Code Security**
- Regular dependency updates
- Security vulnerability scanning
- Modern security practices
- No known security issues

---

## 7. Daily Operations Guide

### Morning Routine (5 minutes)

**Check for new clients:**
1. Check email for intake notifications
2. Look for subject lines: "🚨 NEW INTAKE:"
3. Review any new submissions

**If you got a new intake:**
1. Read through their requirements carefully
2. Note their budget range and timeline
3. Check which portfolio example they referenced
4. Prepare initial response within 4 hours

### Client Response Process

**Step 1: Initial Response (Within 4 hours)**
```
Hi [Customer Name],

Thanks for taking the time to complete our intake form for [Company Name]. I've reviewed your requirements and have some initial thoughts:

[Specific comments about their project]

Based on your needs, I estimate:
- Timeline: [X] weeks
- Investment: $[X] - $[X] range
- Key features: [List main items]

I'd love to discuss this further. Are you available for a 30-minute consultation call this week?

Best regards,
[Your name]
```

**Step 2: Consultation Call**
- Review their requirements in detail
- Ask clarifying questions
- Explain your process and timeline
- Discuss any technical challenges

**Step 3: Formal Proposal**
- Detailed scope of work
- Fixed pricing structure
- Timeline with milestones
- Terms and conditions

**Step 4: Contract and Deposit**
- Send contract for signature
- Request deposit (typically 50%)
- Schedule project kickoff

### Weekly Maintenance (30 minutes)

**Monday:**
- Review website analytics
- Check for any error messages
- Ensure all portfolio demos still work

**Wednesday:**
- Check email system is working
- Test intake form submission
- Review any customer feedback

**Friday:**
- Update portfolio if you completed new projects
- Check security updates available
- Plan any improvements for next week

---

## 8. Troubleshooting Common Problems

### Problem: Intake Form Not Sending Emails

**Symptoms:**
- Customers submit forms but you don't get emails
- Form shows "success" but no notification arrives

**Check these in order:**
1. **Vercel Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Confirm `RESEND_API_KEY` exists and has correct value

2. **Resend Account Status**
   - Check resend.com dashboard
   - Ensure account is active and in good standing
   - Check if you've hit sending limits

3. **Email Spam Folder**
   - Check your spam/junk folder
   - Add `onboarding@resend.dev` to safe senders

4. **Function Logs**
   - Go to Vercel Dashboard → Functions → `/api/intake`
   - Check logs for error messages

**Quick Fix:** Test submission yourself
- Go to your website `/intake`
- Fill out form with your own email
- Submit and see if you receive notification

### Problem: Portfolio Demos Not Working

**Symptoms:**
- Portfolio links return 404 errors
- Demos appear but don't function correctly

**Solution:**
1. Check if Vercel deployment completed successfully
2. Verify all portfolio files exist in correct directories
3. Test each demo individually
4. Check browser console for JavaScript errors

### Problem: Website Down or Not Loading

**Quick Checks:**
1. Visit Vercel Dashboard - check deployment status
2. Test from different device/network
3. Check if it's just your connection

**If website is actually down:**
1. Check Vercel status page
2. Redeploy from Vercel dashboard
3. Contact Vercel support if needed

### Problem: Not Getting Quality Leads

**Common Causes:**
1. **Pricing too low** - Attracts bargain hunters, not quality clients
2. **Positioning unclear** - Customers don't understand your value
3. **Portfolio outdated** - Examples don't match current market needs

**Solutions:**
1. Review and increase pricing annually
2. Update portfolio with recent, relevant projects
3. Improve intake form to filter better prospects

---

## 9. Adding New Features

### How to Add a New Portfolio Example

**When to add new examples:**
- You complete a project you're proud of
- You want to target a new industry
- Current examples become outdated

**Steps to add:**
1. **Create new directory:** `/src/app/portfolio/[project-name]/`
2. **Build demo pages** showing the project
3. **Add to main portfolio page** with description
4. **Update intake form** if targeting new audience
5. **Test thoroughly** before announcing

**What to include:**
- Working demo of key features
- Screenshots of full project
- Description of challenges solved
- Technology used
- Results achieved (if possible)

### How to Add New Intake Form Sections

**When to add new sections:**
- You're targeting different types of clients
- You need more specific information for quotes
- Feedback shows you're missing important details

**Example: Adding "Marketing Integration" section:**
1. Edit `/src/components/ProjectIntakeForm.tsx`
2. Add new form fields in appropriate section
3. Update interface in `/src/app/api/intake/route.ts`
4. Modify email template to include new data
5. Test form submission end-to-end

### How to Update Pricing

**When to update:**
- Market rates increase
- Your skills/experience improve
- Cost of living changes
- Demand exceeds capacity

**Where pricing appears:**
- Intake form budget ranges
- Capabilities page descriptions
- Email templates and responses
- Portfolio project descriptions

**Update process:**
1. Research current market rates
2. Update all pricing references consistently
3. Test intake form with new ranges
4. Update any sales materials

---

## 10. Emergency Procedures

### If Main Developer Becomes Unavailable

**Immediate Actions (First 24 hours):**
1. **Change critical passwords**
   - Vercel account
   - Domain registrar
   - Email accounts
   - Any other service accounts

2. **Secure ongoing client work**
   - Contact active clients
   - Explain transition plan
   - Arrange temporary support if needed

3. **Protect business continuity**
   - Download all code repositories
   - Export client contact information
   - Secure access to documentation

**Short-term Actions (First week):**
1. **Find replacement developer**
   - Look for Next.js/React experience
   - Priority: someone who can understand this documentation
   - Temporary help acceptable initially

2. **Knowledge transfer**
   - Share this documentation
   - Walk through codebase online
   - Explain client processes and expectations

3. **Maintain client relationships**
   - Send professional communication about transition
   - Ensure no interruption in service
   - Honor existing commitments

### If Website Goes Down During Critical Periods

**Immediate response:**
1. Check Vercel dashboard for system status
2. Try redeploying from dashboard
3. If redeployment fails, check GitHub repository status

**Communication plan:**
1. Update social media/LinkedIn with status
2. Email any clients expecting deliveries
3. Set up temporary landing page if needed

**Prevention measures:**
1. Monitor website uptime with external service
2. Keep backup of all critical files
3. Maintain list of emergency contacts

### If You Lose Access to Critical Services

**Domain name issues:**
- Contact domain registrar immediately
- Provide ownership verification documents
- Set up temporary redirect if needed

**Vercel account issues:**
- Contact Vercel support with project details
- Provide payment method verification
- Use GitHub repository as backup

**Email delivery issues:**
- Switch to backup email system temporarily
- Update contact information on website
- Test alternative delivery methods

---

## Glossary (Technical Terms Explained Simply)

**API (Application Programming Interface)**
- Like a waiter in a restaurant - takes your order (request) and brings your food (data)
- Your intake form uses APIs to send emails

**ATBD (Algorithm Theoretical Basis Document)**
- Technical instruction manual explaining how everything works
- Like a recipe book for your website

**Build Process**
- Converting your code into a format that web browsers can understand
- Like translating a book from English to Spanish

**CDN (Content Delivery Network)**
- Network of servers around the world that make websites load faster
- Like having multiple restaurant locations instead of just one

**Deployment**
- Publishing your website so people can visit it online
- Like opening a restaurant to the public

**Environment Variables**
- Secret settings that your website needs to function
- Like the keys to different rooms in a building

**Next.js**
- The main framework (foundation) your website is built on
- Like the foundation and frame of a house

**React**
- Library for building user interfaces (what people see and click)
- Like the interior design of a house

**Repository**
- Storage location for all your website code
- Like a filing cabinet for all your documents

**Vercel**
- Hosting service that makes your website available on the internet
- Like the landlord who provides the building for your restaurant

**TypeScript**
- Programming language that helps prevent errors in code
- Like spell-check for computer code

---

## Contact Information for Emergencies

**Primary Services:**
- **Hosting:** Vercel (vercel.com)
- **Email:** Resend (resend.com)
- **Code Storage:** GitHub (github.com) — transfer to business org when ready
- **AI Chat:** Anthropic (console.anthropic.com) — move API key to business account when ready
- **Domain:** [Your domain registrar]

**Key Account Information:**
- Keep master list of usernames/emails for all accounts
- Store recovery information securely
- Maintain backup access methods

**Professional Network:**
- List of other developers who could provide emergency help
- Business contacts who understand your client relationships
- Industry professionals for advice and support

---

*This documentation should be reviewed and updated every 3 months to ensure accuracy and completeness.*

**Document Status:** Living document - update as system changes
**Next Review Date:** June 19, 2026
**Responsibility:** Business owner or designated successor