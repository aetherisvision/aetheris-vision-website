import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@/lib/db';

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get('av-admin-session')?.value === 'authenticated';
}

// Tier detection based on budget and complexity signals
function detectTier(budget: string | null, objectives: string[] | null, features: string[]): {
  tier: 'Professional' | 'Business' | 'Enterprise';
  rationale: string;
} {
  const b = (budget ?? '').toLowerCase();
  const obj = objectives ?? [];
  const enterpriseSignals = [
    b.includes('20,000') || b.includes('25,000') || b.includes('30,000') ||
    b.includes('40,000') || b.includes('50,000') || b.includes('75,000') ||
    b.includes('100') || b.includes('+'),
    features.some(f => ['portal', 'auth', 'login', 'dashboard', 'api'].includes(f.toLowerCase())),
    obj.some(o => ['portal', 'ecommerce', 'marketplace', 'saas'].some(k => o.toLowerCase().includes(k))),
  ].filter(Boolean).length;

  const businessSignals = [
    b.includes('5,000') || b.includes('7,500') || b.includes('10,000') ||
    b.includes('12,000') || b.includes('15,000'),
    obj.some(o => ['cms', 'blog', 'content', 'ecommerce', 'store'].some(k => o.toLowerCase().includes(k))),
  ].filter(Boolean).length;

  if (enterpriseSignals >= 2) {
    return { tier: 'Enterprise', rationale: 'Budget and feature complexity indicate Enterprise tier.' };
  }
  if (enterpriseSignals === 1 || businessSignals >= 1) {
    return { tier: 'Business', rationale: 'Budget and objectives indicate Business tier.' };
  }
  return { tier: 'Professional', rationale: 'Scope and budget fit Professional tier.' };
}

const STANDARD_FEATURES = `
## Standard Features (Included in All Engagements)
The following are included in every Aetheris Vision project regardless of tier:

- **Mobile-responsive design** — optimized for all screen sizes and devices
- **Cross-browser compatibility** — tested in Chrome, Firefox, Safari, and Edge
- **On-page SEO** — title tags, meta descriptions, heading hierarchy, sitemap.xml, robots.txt, and Schema.org structured data markup
- **SSL/HTTPS configuration** — enforced with proper redirect rules
- **Security headers** — HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options
- **Contact form with spam protection** — honeypot and/or reCAPTCHA
- **Google Analytics 4 setup** — property creation and tag installation
- **Accessibility (WCAG 2.1 AA)** — semantic HTML, keyboard navigation, sufficient color contrast, alt text
- **Basic data privacy compliance** — Privacy Policy page, cookie consent notice (CCPA/GDPR-aware)
- **Core Web Vitals optimization** — image compression, lazy loading, LCP/CLS/FID targets
- **Staging environment** — browser-tested delivery to staging before production go-live
- **30-day post-launch bug fix warranty** — defects in delivered work corrected at no charge
`.trim();

const TIER_DETAILS = {
  Professional: `
**Professional Tier — up to 10 pages**
- Static or lightly dynamic site
- 1 third-party integration (e.g., Google Analytics, Calendly embed, or contact form service)
- Basic custom animations
- Hosting setup assistance (Vercel or Netlify)
- 1-hour handoff and training session
- Post-launch support: 30 days (included in standard features)
`.trim(),

  Business: `
**Business Tier — up to 25 pages**
- CMS integration (content editing without code)
- Blog / news section
- Standard animations and transitions
- Up to 3 third-party integrations
- E-commerce support (up to 50 products, Stripe or Shopify)
- Hosting setup assistance + basic CDN configuration
- 99.5% uptime target
- 2-hour handoff and training session
- Post-launch support: 60 days
`.trim(),

  Enterprise: `
**Enterprise Tier — unlimited pages**
- Full CMS with multi-user roles
- Advanced animations and interactions
- Unlimited third-party integrations and custom API development
- E-commerce: full catalog, inventory, fulfillment integrations
- Client portal with authentication and role-based access
- Performance SLA: 99.9% uptime with monitoring and alerting
- Custom hosting architecture (AWS, GCP, or Vercel Enterprise)
- 4-hour handoff and training session
- Post-launch support: 90 days + optional retainer
`.trim(),
};

function buildPrompt(submission: Record<string, unknown>, tier: string, tierRationale: string): string {
  return `
You are drafting a Statement of Work (SOW) for Aetheris Vision LLC, a technology consulting firm owned by Marston Ward.

## Client Intake Data
- **Company:** ${submission.company_name}
- **Industry:** ${submission.industry ?? 'Not specified'}
- **Location:** ${submission.location ?? 'Not specified'}
- **Revenue:** ${submission.revenue ?? 'Not specified'}
- **Contact:** ${submission.contact_name}${submission.contact_title ? `, ${submission.contact_title}` : ''} — ${submission.contact_email}${submission.contact_phone ? ` / ${submission.contact_phone}` : ''}
- **Budget Range:** ${submission.budget_range ?? 'Not specified'}
- **Timeline:** ${submission.timeline ?? 'Not specified'}
- **Objectives:** ${Array.isArray(submission.objectives) && submission.objectives.length > 0 ? (submission.objectives as string[]).join(', ') : 'Not specified'}
- **Special Requirements:** ${submission.special_requirements ?? 'None'}
- **Questions for Us:** ${submission.questions_for_us ?? 'None'}

## Recommended Tier
**${tier}** — ${tierRationale}

## Your Task
Draft a complete, professional Statement of Work. Structure it exactly as follows:

1. **Project Overview** — 2-3 sentences summarizing what we are building and why, written for this specific client's industry and situation.

2. **Recommended Approach** — A paragraph analyzing the client's needs and explaining the technical approach Aetheris Vision will take. Be specific to their industry (${submission.industry ?? 'their industry'}). Mention any patterns or risks relevant to their type of business.

3. **Service Tier: ${tier}**
${TIER_DETAILS[tier as keyof typeof TIER_DETAILS]}

4. **Standard Features**
${STANDARD_FEATURES}

5. **Scope of Work — Deliverables**
List specific, numbered deliverables tailored to this client. Draw from their objectives and special requirements. Be concrete — name pages, features, and integrations they mentioned.

6. **Project Timeline & Milestones**
Break the project into phases with realistic durations based on the ${tier} tier and their stated timeline (${submission.timeline ?? 'TBD'}):
- Phase 1: Discovery & Requirements (week 1–2)
- Phase 2: Design (week X–X)
- Phase 3: Development (week X–X)
- Phase 4: QA & Staging Review (week X)
- Phase 5: Launch & Handoff (week X)

7. **Investment**
Provide a realistic price range for the ${tier} tier given their budget (${submission.budget_range ?? 'TBD'}) and scope. Format as:
- Project Fee: $X,XXX – $X,XXX
- Payment Schedule: 50% deposit / 25% mid-project / 25% on launch
- Optional add-ons if relevant (e.g., content writing, SEO audit, ongoing retainer)

8. **Out of Scope**
List 4-6 items clearly excluded (e.g., logo design, copywriting, third-party licensing fees, ongoing hosting fees after launch).

9. **Change Order Policy**
Standard 1-paragraph policy: changes to agreed scope require written change order with revised timeline and cost estimate.

10. **Acceptance & Warranty**
Standard clause: client has 5 business days to review each milestone. 30-day post-launch bug fix warranty for defects in delivered work.

Write in clean professional prose. Use markdown formatting (## headings, **bold**, bullet lists). Do not include signature blocks — those will be added separately via DocuSeal. Do not add preamble or meta-commentary — output the SOW directly.
`.trim();
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { intake_id } = await request.json();
    if (!intake_id) {
      return NextResponse.json({ error: 'intake_id required' }, { status: 400 });
    }

    // Fetch the intake submission
    const rows = await sql`
      SELECT * FROM intake_submissions WHERE id = ${intake_id}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Intake submission not found' }, { status: 404 });
    }
    const submission = rows[0];

    // Detect tier
    const rawData = (submission.raw_data ?? {}) as Record<string, unknown>;
    const interactiveFeatures = Array.isArray(rawData.interactiveFeatures) ? rawData.interactiveFeatures as string[] : [];
    const userAccountFeatures = Array.isArray(rawData.userAccountFeatures) ? rawData.userAccountFeatures as string[] : [];
    const allFeatures = [...interactiveFeatures, ...userAccountFeatures];
    const { tier, rationale } = detectTier(
      submission.budget_range as string | null,
      submission.objectives as string[] | null,
      allFeatures,
    );

    // Generate SOW via Claude API (lazy init — ANTHROPIC_API_KEY is Vercel-only)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = buildPrompt(submission as Record<string, unknown>, tier, rationale);
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'You are a technical consultant and writer at Aetheris Vision LLC. Produce well-structured, professional output. Output the deliverable directly without preamble.',
      messages: [{ role: 'user', content: prompt }],
    });

    const sowContent = (message.content[0] as { text: string }).text;
    const title = `SOW — ${submission.company_name} (${tier} Tier) — Draft`;

    // Save to documents table
    let documentId: number | null = null;
    if (submission.client_id) {
      const doc = await sql`
        INSERT INTO documents (client_id, title, content)
        VALUES (${submission.client_id}, ${title}, ${sowContent})
        RETURNING id
      `;
      documentId = doc[0].id;
    }

    // Update intake status to in_review
    await sql`
      UPDATE intake_submissions SET status = 'in_review' WHERE id = ${intake_id}
    `;

    return NextResponse.json({
      success: true,
      tier,
      document_id: documentId,
      title,
      content: sowContent,
    });

  } catch (error) {
    console.error('SOW generation failed:', error);
    return NextResponse.json({ error: 'SOW generation failed' }, { status: 500 });
  }
}
