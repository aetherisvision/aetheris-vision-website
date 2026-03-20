# Algorithm & Technical Basis Document (ATBD)

## Aetheris Vision — Complete System Architecture & Business Platform

**Version**: 2.2
**Date**: March 19, 2026
**Author**: Aetheris Vision Engineering
**Reading Level**: 8th Grade with Technical Details

### Who is this document for?

This document is written for anyone who needs to understand, maintain, or extend the Aetheris Vision business platform. It covers both the technical architecture and business processes in simple terms.

Whether you're a developer taking over the codebase, a business partner understanding the systems, or someone who needs to troubleshoot problems, this document provides step-by-step guidance.

Every technical term is explained when it first appears, and real-world analogies are used throughout. If you can understand how a restaurant works, you can understand how this business platform works.

---

## Table of Contents

1. [Complete System Overview](#1-complete-system-overview)
2. [Client Acquisition System (The Sales Engine)](#2-client-acquisition-system)
3. [Technical Architecture Deep Dive](#3-technical-architecture)
4. [Email &amp; Communication Systems](#4-email-communication-systems)
5. [Portfolio &amp; Demonstration Platform](#5-portfolio-demonstration-platform)
6. [Security &amp; Enterprise Compliance](#6-security-enterprise-compliance)
7. [Database &amp; Data Flow](#7-database-data-flow)
8. [Authentication &amp; User Management](#8-authentication-user-management)
9. [API Design &amp; Integration Points](#9-api-design-integration-points)
10. [Performance Optimization](#10-performance-optimization)
11. [Monitoring &amp; Analytics](#11-monitoring-analytics)
12. [Deployment &amp; Infrastructure](#12-deployment-infrastructure)
13. [Maintenance Procedures](#13-maintenance-procedures)
14. [Extension Roadmap](#14-extension-roadmap)
15. [Troubleshooting Guide](#15-troubleshooting-guide)

---

## 1. Complete System Overview

### Business Model Architecture

The Aetheris Vision platform operates as a **professional services sales and delivery system**. Think of it like a luxury car dealership combined with a custom manufacturing shop:

**Showroom** (Portfolio Demonstrations)

- 7 different website examples showing capabilities
- Each demo targets specific client types and price points
- Interactive experiences that customers can explore

**Sales Process** (Client Intake System)

- Comprehensive requirement gathering through intelligent forms
- Automated email notifications with complete project briefs
- Professional client communication and confirmation

**Service Delivery** (Development Platform)

- Next.js 16 framework for modern web applications
- TypeScript for error-free code development
- Component-based architecture for rapid customization

**Business Operations** (Enterprise Systems)

- SOC-2 compliance documentation for enterprise sales
- Email automation through Resend API
- Analytics and performance monitoring

### Technical Stack (Explained Simply)

**Foundation Layer - Vercel Hosting**

- **What it does:** Makes your website available on the internet
- **Why this choice:** Automatic scaling, global CDN, zero-downtime deployments
- **Analogy:** Like Amazon Web Services but specialized for web applications

**Framework Layer - Next.js 16**

- **What it does:** Handles routing, server-side rendering, API endpoints
- **Why this choice:** Industry standard, excellent performance, great developer experience
- **Analogy:** Like the engine and transmission of a car - handles the complex mechanics

**User Interface Layer - React 19**

- **What it does:** Creates interactive web pages and forms
- **Why this choice:** Modern, component-based, reusable code
- **Analogy:** Like the interior and controls of a car - what users see and interact with

**Styling Layer - Tailwind CSS**

- **What it does:** Makes everything look professional and responsive
- **Why this choice:** Consistent design, mobile-friendly, easy to customize
- **Analogy:** Like professional interior decorating - makes everything look cohesive

**Communication Layer - Resend API**

- **What it does:** Sends professional emails reliably
- **Why this choice:** Better delivery than regular contact forms, professional formatting
- **Analogy:** Like having a professional mail service instead of regular postal mail

**AI Layer - Anthropic Claude API**

- **What it does:** Powers the 24/7 AI chat assistant on every page
- **Model used:** claude-haiku-4-5 (fastest, lowest cost — ~$0.001/conversation)
- **Why this choice:** Claude understands nuanced business questions; scoped to Aetheris Vision content via system prompt
- **Rate limiting:** 20 requests per IP per 15-minute window to prevent abuse
- **Analogy:** Like a knowledgeable receptionist who never sleeps and knows everything about the business

### Website Stack Components (with Acronyms Expanded)

This is the practical checklist of what a modern website stack contains, written in plain English.

1. **Client Layer (Browser + Network)**

- Web browser (Chrome, Safari, Edge) and mobile browser
- Transport over **HTTP** (**Hypertext Transfer Protocol**) and **HTTPS** (**Hypertext Transfer Protocol Secure**)

2. **Frontend Layer (User Interface)**

- Visual pages and interactions built with HTML, CSS, and JavaScript
- React components rendered through Next.js

3. **Backend Layer (Server/API)**

- Server-side business logic, validation, authentication, and routing
- **API** means **Application Programming Interface** (the structured way systems talk to each other)

4. **Data Layer (Persistence)**

- Database storage (PostgreSQL) for clients, projects, expenses, and documents
- Optional object/file storage for media and uploads

5. **Caching & Performance Layer**

- **CDN** means **Content Delivery Network** (global edge locations that serve content fast)
- Browser cache, server cache, and session cache reduce repeated work

6. **Infrastructure Layer (Hosting + Delivery)**

- Vercel hosting runtime, deployment pipeline, and DNS routing
- **DNS** means **Domain Name System** (maps domain names to server addresses)

7. **Security Layer**

- **TLS** means **Transport Layer Security** (encryption in transit)
- **WAF** means **Web Application Firewall** (filters malicious traffic)
- **CSP** means **Content Security Policy** (controls what scripts/resources can run)
- **HSTS** means **HTTP Strict Transport Security** (forces HTTPS-only connections)

8. **Observability & Operations Layer**

- Logging, monitoring, error tracking, and analytics
- **CI/CD** means **Continuous Integration / Continuous Delivery** (automated test and deployment pipeline)
- **SEO** means **Search Engine Optimization** (improves discoverability in search engines)

### Data Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Customer      │────│  Intake Form     │────│  Email System   │
│   Visits Site   │    │  Collects Data   │    │  Notifies You   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browse         │    │  Form           │    │  Customer Gets  │
│   Portfolio     │    │  Validation     │    │  Confirmation   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Customer Journey Through System:**

1. **Discovery:** Customer finds website through search/referrals
2. **Evaluation:** Browses portfolio demos and capabilities; may ask the AI chat assistant questions about services, pricing, or contracting
3. **Engagement:** Fills out detailed intake form or books a discovery call
4. **Processing:** System validates and formats their information
5. **Notification:** You receive complete project brief via email
6. **Confirmation:** Customer receives professional acknowledgment
7. **Conversion:** You respond with accurate quote and proposal

**AI Chat Flow:**
```
Visitor types question → /api/chat (POST)
  → Rate limit check (20 req/IP/15min)
  → Message sanitization (role, length, sequence)
  → Claude Haiku API (streaming)
  → Token-by-token response → Visitor's browser
```

---

│  Components, interactivity, state mgmt      │
├─────────────────────────────────────────────┤
│  TAILWIND CSS 4 (The Paint & Finishes)      │
│  Styling, responsive design, dark theme     │
├─────────────────────────────────────────────┤
│  TYPESCRIPT (The Building Code Inspector)    │
│  Catches errors before they reach users     │
└─────────────────────────────────────────────┘

```

### What We Have Today (as of v2.1)

**Why this matters:** Before adding new features, you need to understand what's already built. You wouldn't add a second story to a building without knowing what the first floor looks like.

| Capability | Status | How |
|---|---|---|
| Marketing pages | ✅ | 10 pages (Home, About, Capabilities, Portfolio, Blog, Book, Intake, Contact, Privacy, Security) |
| Portfolio demos | ✅ | 7 live demo sites (law firm, restaurant, contractor, nonprofit, analytics dashboard, international market, portal pro) |
| Contact form | ✅ | Server-validated, rate-limited, honeypot-protected, via Formspree |
| Blog | ✅ | Markdown-driven with categories, comments (Giscus), subscriptions |
| Booking | ✅ | Cal.com embedded scheduling |
| SEO | ✅ | JSON-LD (Organization, WebSite, LocalBusiness), OG images, dynamic sitemap, robots.txt |
| LocalBusiness schema | ✅ | PMB address (210 N Mustang Mall Terrace PMB 29, Mustang OK 73064) for Google Maps/GBP |
| AI Chat Assistant | ✅ | Claude Haiku via /api/chat — streaming, rate-limited (20 req/IP/15min), scoped to Aetheris Vision content |
| Web & Digital Solutions | ✅ | Added as 5th core competency on home + capabilities pages |
| Security | ✅ | CSP nonces, HSTS, rate limiting, input validation, Basic auth |
| Database | ✅ | Neon Postgres — clients, projects, expenses, verification_tokens, documents |
| Authentication | ✅ | Custom magic-link auth (JWT, NextAuth session), admin passphrase + cookie |
| Client Portal | ✅ | Dark-themed dashboard with project timeline, document viewer, sign-doc link |
| Admin Panel | ✅ | Clients, Projects, Documents, Expenses — all dark-themed, auth-gated |
| Document Portal | ✅ | Markdown documents stored in Postgres, rendered per-client in the portal |
| Expense Tracker | ✅ | Full CRUD, category summaries, Excel export (SheetJS) |
| Testing | ✅ | 82 tests (unit, integration, regression, BDD) |
| CI/CD | ✅ | GitHub Actions → Vercel auto-deploy |
| Analytics | ✅ | Vercel Analytics + Google Analytics (via NEXT_PUBLIC_GA_MEASUREMENT_ID) |

### What We Don't Have (Yet — Future Roadmap)

**Why you'd want these:** Right now, the website is a "brochure" — it shows information but doesn't let users log in, pay for things, or see personalized content. The features below would turn it from a brochure into a full **platform** (like a mini Shopify or client dashboard).

| Capability | Needed For |
|---|---|
| Payments | Stripe integration for deposits and invoices |
| Client messaging | In-portal messaging thread per project |
| Payments | Stripe checkout, recurring billing |
| Email system | Transactional emails (receipts, notifications) |
| CRM | Lead tracking, client management |

---

## 2. How Next.js Works (For the Non-Developer)

**What is Next.js?** It's a tool (called a "framework") that makes building websites easier. Instead of starting from scratch, Next.js gives you a structure — like how a house blueprint tells you where the rooms, doors, and windows go. You just fill in the details.

**Why Next.js and not plain HTML?** Plain HTML websites are like writing a letter by hand — fine for one page, but if you have 20 pages that all need the same header and footer, you'd be copying and pasting forever. Next.js lets you define the header once and automatically puts it on every page.

### The Two Types of Pages

**What's the difference?** When someone visits a webpage, the content has to come from somewhere. There are two strategies:

**Server Components** (default) — The page is built on the server before the user sees it. This is like a restaurant that prepares your plate in the kitchen and brings it out ready to eat. It's fast, SEO-friendly (Google can read it), and secure (the user's browser never sees the cooking process).

**Client Components** — The page runs JavaScript in the user's browser. This is like a restaurant that brings you the raw ingredients and a grill at your table — you cook it yourself. Needed for interactivity (forms you can type in, animations, dropdown menus). We mark these with `"use client"` at the top of the file.

**Why does this matter?** Using server components by default makes the website faster and more secure. We only use client components when we absolutely need interactivity (like a form or animated menu).

### The Routing System

**What is routing?** Routing is how the website decides what to show you based on the URL you typed. If you type `/about`, you see the About page. If you type `/blog`, you see the Blog page.

**How does Next.js do it?** Instead of writing complicated rules, Next.js uses the *file system* — meaning the folder structure on your computer IS the URL structure on the website. It's like organizing papers into labeled folders — the folder name becomes the web address.

```

src/app/page.tsx           →  https://aetherisvision.com/
src/app/about/page.tsx     →  https://aetherisvision.com/about
src/app/blog/[slug]/page.tsx → https://aetherisvision.com/blog/any-post-title
src/app/api/contact/route.ts → POST https://aetherisvision.com/api/contact

```

**Want a new page?** Create a new folder with a `page.tsx` file inside it. That's it. No configuration, no settings to change.

### Route Groups — Organizing Without Changing URLs

**What are route groups?** Sometimes you want to organize your code into logical sections (like "public pages" vs. "logged-in pages") without affecting the URL. Folders wrapped in parentheses — like `(portal)` — do exactly this.

**Why would you use them?** Imagine you're adding a client portal. You want the marketing pages (Home, About, Contact) to look different from the portal pages (Dashboard, Billing). Route groups let you give each section its own layout without messing up the URLs.

```

src/app/(public)/page.tsx       →  https://example.com/
src/app/(portal)/dashboard/page.tsx → https://example.com/dashboard

```

This is how you'd separate the marketing site from a logged-in portal — same codebase, different "zones."

### API Routes — The Website's Back Office

**What are API routes?** They're server-side code that runs behind the scenes — like the kitchen in a restaurant. The customer (user) never sees the kitchen, but that's where the food (data) gets prepared.

**Why do we need them?** Some things should never happen in the user's browser — like processing a form submission, charging a credit card, or talking to a database. API routes handle this sensitive work on the server where it's safe.

Files named `route.ts` inside `src/app/api/` become these server-side endpoints:

```

src/app/api/contact/route.ts       → POST /api/contact
src/app/api/webhooks/stripe/route.ts → POST /api/webhooks/stripe

```

### Middleware — The Security Guard at the Front Door

**What is middleware?** Code that runs on EVERY request before the page loads. Think of it like a security guard who checks every person who walks into a building — before they get to see any room.

**Why do we need it?** We use it for:
- **Generating CSP nonces** — creating a unique security code for each page visit to prevent hackers from injecting malicious scripts
- **Basic auth for preview deployments** — requiring a password so only the team can see unfinished versions of the site
- **Could also be used for:** checking if a user is logged in, redirecting certain URLs, blocking traffic from specific countries

---

## 3. Understanding The Codebase

**What is a "codebase"?** It's just all the code files that make up the website, organized in folders. Think of it like a recipe book — each recipe (file) does one thing, and the book (codebase) is organized by category.

We follow specific patterns (consistent ways of doing things) so that anyone reading the code can quickly understand it. Here are the four main patterns:

### The Constants Pattern — One Source of Truth

**What:** All company information (name, email, website URL, tagline) lives in a single file.

**Why:** If you wrote "Aetheris Vision" directly into 30 different files and then the company rebranded, you'd have to hunt through every file to find and change them all. If you miss even one, the website shows the old name somewhere. By putting it in ONE place, every file just points there.

```typescript
// src/lib/constants.ts — the SINGLE SOURCE OF TRUTH
export const SITE = {
  name: "Aetheris Vision",
  legalName: "Aetheris Vision LLC",
  tagline: "Predictive Clarity at the Highest Level",
  url: "https://aetherisvision.com",
  logoUrl: "https://aetherisvision.com/logo/aetheris-logo.png",
  email: "contact@aetherisvision.com",
  description: "Advanced AI/ML weather prediction...",
  ogDescription: "Advanced AI/ML weather prediction...",
} as const;
```

Every page imports `SITE` and uses it:

```typescript
import { SITE } from "@/lib/constants";
// then:
<title>{`About | ${SITE.name}`}</title>
<a href={`mailto:${SITE.email}`}>Email us</a>
```

### The Data Separation Pattern — Keep Data and Display Apart

**What:** Page data (pricing tiers, FAQ questions, feature lists) lives in separate files from the code that displays them.

**Why:** Imagine you're updating the price of a website package. Would you rather open a clean data file that lists all the prices in an easy-to-read table, or dig through hundreds of lines of display code trying to find where the price is buried?

Separating data from display means:

- Business owners can update prices/text without understanding the display code
- Developers can redesign the page without accidentally changing the data
- Tests can verify the data is correct without loading the full page

```typescript
// src/lib/portfolio-data.ts — DATA lives here
export const tiers: Tier[] = [
  { name: "Professional", price: "$2,400", deliverables: [...] },
  { name: "Business", price: "$4,800", deliverables: [...] },
  { name: "Enterprise", price: "$8,500+", deliverables: [...] },
];

// src/app/portfolio/page.tsx — RENDERING lives here
import { tiers } from "@/lib/portfolio-data";
// then map over tiers to render cards
```

### The Component Pattern — Build Once, Use Everywhere

**What:** A "component" is a reusable piece of the website — like a LEGO brick. You build it once, then snap it into any page.

**Why:** Instead of copying and pasting the same navigation bar code into 9 different page files (and then having to update 9 files whenever the menu changes), you build the `Navbar` component once. Every page just says "put the Navbar here" and it appears.

```
Navbar      → Used on every page (imported in each page.tsx)
Footer      → Used on every page
CtaButton   → Used whenever we need a call-to-action button
FadeIn      → Wraps any element to give it an entrance animation
```

### The Testing Pattern — Automated Quality Control

**What:** Automated tests are little programs that check if the website works correctly. They run in seconds and can catch mistakes that would take a human hours to find.

**Why:** Every time you change code, there's a risk that you accidentally broke something that used to work. Tests catch these problems immediately, before real users ever see them.

```
tests/
  unit/          → "Does this function return the right value?"
  integration/   → "Does the API endpoint work end-to-end?"
  regression/    → "Did we accidentally break something that used to work?"
  features/      → "Given X, When Y, Then Z" (BDD — plain English scenarios)
```

---

## 4. Client Portal & Admin System

> **Status: LIVE as of March 2026.** This section describes the implemented system. The recommendations below (Clerk, NextAuth) were superseded by the custom magic-link implementation described in Section 8.

### What is a portal?

A "portal" is a password-protected section of the website where logged-in users see personalized content. Think of it like a bank's website — everyone can see the bank's homepage (marketing site), but only account holders can log in and see their balance (portal).

**Why would you build one?** If you're building websites for clients, a portal lets them:

- See the status of their project ("Your website is 60% complete")
- View and pay their invoices
- Download deliverables (logos, final files)
- Send messages to your team

Without a portal, all of this happens over email — slower, harder to track, and less professional.

### How Authentication Works (What "Logging In" Really Does)

Think of authentication like a nightclub:

1. **Sign Up** — You get your name on the list (create an account)
2. **Log In** — You show your ID at the door (enter credentials)
3. **Session** — You get a wristband (the server issues a "token" or cookie)
4. **Protected Pages** — The bouncer checks your wristband before letting you into VIP (middleware checks the token)

### Recommended: Clerk

**What is Clerk?** [Clerk](https://clerk.com) is a service that handles all the login/signup stuff for you. Instead of building your own login system from scratch (which is really hard to do securely), Clerk gives you pre-built pages and security.

**Why Clerk and not building it ourselves?** Building a secure login system involves password hashing, session management, token rotation, brute-force protection, email verification, and more. Getting any of these wrong can expose user data. Clerk handles all of it, so we can focus on building features.

Key benefits:

- Pre-built sign-in/sign-up pages that look professional
- Works natively with Next.js App Router
- Handles OAuth ("Login with Google"), MFA (two-factor authentication), and session management
- Role-based access control (admin vs. client vs. viewer)
- Free up to 10,000 monthly active users

### Implementation Pattern

```
npm install @clerk/nextjs
```

```typescript
// src/middleware.ts — protect portal routes
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPortalRoute = createRouteMatcher(["/dashboard(.*)", "/billing(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isPortalRoute(req)) {
    auth().protect(); // redirects to sign-in if not logged in
  }
});
```

```typescript
// src/app/(portal)/layout.tsx — portal layout with auth context
import { ClerkProvider } from "@clerk/nextjs";

export default function PortalLayout({ children }) {
  return (
    <ClerkProvider>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </ClerkProvider>
  );
}
```

```typescript
// src/app/(portal)/dashboard/page.tsx — user sees their own data
import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();
  // Query database for this user's projects, invoices, etc.

  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      {/* Render their projects */}
    </div>
  );
}
```

### Alternative: NextAuth.js (Self-Hosted)

**What is NextAuth.js?** If you don't want to depend on a third-party service, [NextAuth.js](https://next-auth.js.org) (now called Auth.js) lets you manage authentication yourself.

**Why would you pick this over Clerk?** More work to set up, but no monthly fee and full control over your data. Good if you're privacy-conscious or building for clients who don't want their user data on someone else's servers.

---

## 5. Adding Payments & Subscriptions

### What this section covers

How to let people pay you through the website — either a one-time payment (like a project deposit) or a recurring subscription (like a monthly maintenance plan).

### How Online Payments Work

Here's the key thing to understand: **you never touch credit card numbers.** That would be a massive security liability. Instead, a payment service (Stripe) handles all the sensitive stuff. Your website just says "charge this person $X for Y" and Stripe does the rest.

Think of it like a cashier at a store. The cashier (your website) tells the credit card machine (Stripe) how much to charge. The cashier never sees the credit card number — the machine handles it securely.

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │────▶│  Your    │────▶│  Stripe  │────▶│  Bank    │
│  Browser  │     │  Server  │     │  API     │     │  Account │
│           │◀────│          │◀────│          │◀────│          │
│  sees     │     │  creates │     │  charges │     │  receives│
│  checkout │     │  session │     │  card    │     │  money   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

**You never touch credit card numbers.** Stripe handles all of that. Your server only tells Stripe "charge this person $X for Y" and Stripe sends back "success" or "failure."

### Recommended: Stripe

**What is Stripe?** [Stripe](https://stripe.com) is the payment processing service used by companies like Amazon, Google, and Shopify. It's the industry standard.

**Why Stripe?** Because handling credit cards yourself would require complex security certifications (called PCI compliance). Stripe handles all of that. You just use their tools, and money shows up in your bank account.

Stripe supports:

- One-time payments (project deposits, consulting fees)
- Recurring subscriptions (monthly retainers, SaaS plans)
- Invoicing (send professional invoices by email)
- Customer portal (clients can manage their own billing, update their card, cancel subscriptions)

### One-Time Payment (Project Deposit)

```typescript
// src/app/api/checkout/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { tier, clientEmail } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: clientEmail,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `${tier} Website Package` },
        unit_amount: tier === "Professional" ? 240000 : tier === "Business" ? 480000 : 850000, // cents
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/portal/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/portfolio`,
  });

  return NextResponse.json({ url: session.url });
}
```

### Recurring Subscription

```typescript
// For a monthly maintenance plan:
const session = await stripe.checkout.sessions.create({
  mode: "subscription",  // ← key difference
  line_items: [{
    price: "price_XXXX",  // Created in Stripe Dashboard
    quantity: 1,
  }],
  // ...
});
```

### Webhooks — How Stripe Talks Back to You

**What is a webhook?** It's a message that one computer sends to another when something happens. Think of it like a text notification — when a customer pays, Stripe "texts" your server to say "Hey, someone just paid $2,400 for the Professional package."

**Why do you need this?** Without webhooks, your server would have no idea that a payment happened. With them, your server can automatically:

- Update the database ("mark this project as paid")
- Send the customer a receipt email
- Give them access to their portal

After a payment happens, Stripe sends a "webhook" (a POST request) to your server to tell you what happened.

```
Client pays → Stripe processes → Stripe POSTs to /api/webhooks/stripe
                                  → Your server updates the database
                                  → Your server sends confirmation email
```

```typescript
// src/app/api/webhooks/stripe/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  // Verify this webhook actually came from Stripe (security!)
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "checkout.session.completed":
      // Payment succeeded — update database, send email
      const session = event.data.object;
      await markProjectAsPaid(session.client_reference_id);
      await sendConfirmationEmail(session.customer_email);
      break;

    case "invoice.payment_failed":
      // Subscription payment failed — notify client
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 6. Database

> **Status: LIVE as of March 2026.** We use **Neon Postgres** (not Supabase). The `@neondatabase/serverless` driver is used directly via a tagged-template `sql` helper in `src/lib/db.ts`. See Section 7 for the schema.

### What is a database?

A database is where your website stores information permanently. — all content is written directly in the code files. Blog posts are in `src/lib/posts.ts`. Contact form submissions go to Formspree's servers.

**Why would you need one?** Think of a database like a filing cabinet that your website can read from and write to automatically. Without it, you can't:

- Remember that a user created an account
- Track which projects belong to which clients
- Store payment history
- Save uploaded files or documents

For a client portal, a database is essential. It's where all the dynamic data lives.

### Recommended: Supabase (Managed PostgreSQL)

**What is Supabase?** [Supabase](https://supabase.com) is a service that gives you a database without having to manage a server yourself. Think of it like renting a storage unit vs. building your own warehouse.

**What is PostgreSQL?** It's a type of database — the most popular and reliable open-source one. It stores data in tables (like spreadsheets), where each row is a record and each column is a field.

**Why Supabase?** It gives you:

- A full PostgreSQL database
- Row-level security (users can only see their own data — like how a bank teller can only pull up YOUR account)
- Real-time subscriptions (live updates without refreshing — like how a chat app shows new messages instantly)
- File storage (for client documents, logos, deliverables)
- Free tier: 500 MB database, 1 GB file storage

### Alternative: PlanetScale (Managed MySQL)

**What is PlanetScale?** [PlanetScale](https://planetscale.com) is another managed database, but it uses MySQL instead of PostgreSQL. It has a unique "branching" feature — like how Git lets you experiment with code on a branch, PlanetScale lets you experiment with database changes on a branch.

**Why would you pick this over Supabase?** It's better for very high-traffic applications. For most client projects, Supabase is easier to start with.

### ORM: How Your Code Talks to the Database

**What is an ORM?** An ORM (Object-Relational Mapper) is a translator between your TypeScript code and the database. Without it, you'd write raw SQL (the language databases speak). With it, you write TypeScript and the ORM translates it to SQL for you.

**Why use one?** Two reasons:

1. **Type safety** — TypeScript can catch mistakes in your database queries before you run them
2. **Readability** — `prisma.project.findMany()` is easier to read than `SELECT * FROM projects WHERE client_id = $1`

**Prisma** (most popular):

```typescript
// prisma/schema.prisma — Define your data model
model Client {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  projects  Project[]
  createdAt DateTime @default(now())
}

model Project {
  id        String   @id @default(cuid())
  title     String
  status    String   @default("pending")
  tier      String
  client    Client   @relation(fields: [clientId], references: [id])
  clientId  String
  paidAt    DateTime?
  amount    Int      // cents
}
```

```typescript
// src/lib/db.ts — Database client (singleton)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

```typescript
// Usage in a page or API route:
import { prisma } from "@/lib/db";

// Get all projects for a client
const projects = await prisma.project.findMany({
  where: { clientId: user.id },
  orderBy: { createdAt: "desc" },
});

// Create a new project after payment
await prisma.project.create({
  data: {
    title: "Restaurant Website",
    tier: "Growth",
    clientId: user.id,
    amount: 480000,
    paidAt: new Date(),
  },
});
```

**Drizzle** (lighter, faster):

```typescript
// src/lib/schema.ts
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").default("pending"),
  tier: text("tier").notNull(),
  clientId: text("client_id").references(() => clients.id),
  amount: integer("amount"),
});
```

### When to Use Which ORM

| Factor         | Prisma                                        | Drizzle                       |
| -------------- | --------------------------------------------- | ----------------------------- |
| Learning curve | Easier — schema file is almost plain English | Steeper — closer to raw SQL  |
| Performance    | Good, but queries are heavier                 | Faster, thinner abstraction   |
| Migrations     | Built-in `prisma migrate`                   | Built-in `drizzle-kit push` |
| Best for       | Rapid prototyping, client projects            | Performance-critical apps     |

---

## 7. Adding a CRM

### What is a CRM?

CRM stands for **Customer Relationship Management**. It's a system that tracks everyone who's ever contacted you, what they said, how far along they are in the sales process, and what happened next.

**Why do you need one?** Without a CRM, leads (potential customers) get lost in your email inbox. Did you follow up with that person who emailed last Tuesday? What was their budget? A CRM keeps all of this organized, like a Rolodex on steroids.

### Option A: HubSpot (For Larger Operations)

**What is HubSpot?** [HubSpot](https://www.hubspot.com) is a full-featured CRM with a free tier. It has dashboards, email tracking, deal pipelines, and more.

**Why HubSpot?** If you're managing many clients and need detailed analytics ("How many leads came from the website this month? What's our close rate?"), HubSpot is the industry standard.

**How does it connect to our website?** You can automatically create a contact in HubSpot every time someone fills out the website's contact form:

```typescript
// src/app/api/contact/route.ts — after Formspree submission
await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
  },
  body: JSON.stringify({
    properties: {
      email: data.email,
      firstname: data.name.split(" ")[0],
      lastname: data.name.split(" ").slice(1).join(" "),
      company: data.organization,
      hs_lead_status: "NEW",
    },
  }),
});
```

### Option B: Build a Lightweight CRM in Your Database

**What:** Instead of using a third-party CRM, you build a simple one into your own website's database.

**Why would you do this?** For smaller operations (fewer than 50 active leads), HubSpot is overkill. A simple database table with a status column ("new → contacted → quoted → won → lost") does the job. Plus, it's free.

**How:** Add a Lead model to your Prisma schema:

```typescript
// Add to your Prisma schema:
model Lead {
  id           String   @id @default(cuid())
  name         String
  email        String
  organization String?
  message      String
  status       String   @default("new") // new → contacted → quoted → won → lost
  source       String   @default("website")
  amount       Int?     // potential deal value in cents
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Then build a simple admin dashboard at `/admin/leads`:

```typescript
// src/app/(admin)/leads/page.tsx
import { prisma } from "@/lib/db";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <table>
      <thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>
        {leads.map(lead => (
          <tr key={lead.id}>
            <td>{lead.name}</td>
            <td>{lead.status}</td>
            <td>{lead.createdAt.toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 8. Adding Email Notifications

### What this section covers

How to send emails automatically from the website — like payment receipts, project updates, or welcome messages.

**Why do you need programmatic email?** Right now, contact form submissions go to Formspree, which emails you. That works for a contact form. But for a real platform that has users, you need to send emails automatically — like when someone pays, or when you update their project status. You can't manually send every receipt.

### Recommended: Resend

**What is Resend?** [Resend](https://resend.com) is an email sending service. You write the email in your code, and Resend delivers it. It's built by the team behind React Email, so it works perfectly with our tech stack.

**Why not just use Gmail to send emails?** Gmail has strict sending limits and isn't designed for automated emails. Resend is built specifically for this — it can send thousands of emails reliably and tracks whether they were delivered and opened.

```bash
npm install resend
```

```typescript
// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: "Aetheris Vision <noreply@aetherisvision.com>",
    to,
    subject,
    html,
  });
}
```

```typescript
// Usage: Send a payment confirmation
await sendEmail({
  to: client.email,
  subject: "Payment Confirmed — Your Project is Underway",
  html: `
    <h1>Thank you, ${client.name}!</h1>
    <p>We've received your payment of $${(amount / 100).toFixed(2)} for the ${tier} package.</p>
    <p>Your project manager will reach out within 1 business day.</p>
  `,
});
```

### Email Types You'd Send

| Email           | Trigger                                       | Template                               |
| --------------- | --------------------------------------------- | -------------------------------------- |
| Welcome         | New account created                           | "Welcome to your client portal"        |
| Payment receipt | Stripe webhook:`checkout.session.completed` | "Payment confirmed — $X for Y"        |
| Project update  | Admin marks project as "in progress"          | "Your project has entered development" |
| Invoice         | Monthly subscription renewal                  | "Your invoice for March 2026"          |
| Password reset  | User clicks "Forgot password"                 | Handled by Clerk/NextAuth              |

---

## 9. Security Considerations

### Why security matters

Every website on the internet is constantly being probed by bots and attackers. If your website handles user data, payments, or login credentials, security isn't optional — it's like locking the doors to your business at night. Here's what we already have and what you'd add for a portal.

### What We Already Have

**These protections are built into the website today.** Each one addresses a specific type of attack:

| Layer         | Protection                                           |
| ------------- | ---------------------------------------------------- |
| Transport     | HTTPS enforced, HSTS preload                         |
| Headers       | CSP (nonce-based), X-Frame-Options, Referrer-Policy  |
| Input         | Server-side validation (name, email, message length) |
| Rate limiting | 5 requests/10 min per IP on contact API              |
| Bot detection | Honeypot field                                       |
| Auth          | Basic auth on preview deployments                    |

### What You'd Add for a Portal

**Why more security?** When users can log in and access personal data, the stakes go up. A brochure website that gets hacked is embarrassing. A portal that gets hacked can leak client data, financial info, and destroy trust.

| Layer                | Protection                           | How                                                     |
| -------------------- | ------------------------------------ | ------------------------------------------------------- |
| Authentication       | User sessions, MFA                   | Clerk or NextAuth                                       |
| Authorization        | Role-based access (admin vs. client) | Middleware checks user role                             |
| Data isolation       | Users only see their own data        | Prisma `where: { clientId: user.id }` or Supabase RLS |
| Payment security     | PCI compliance                       | Stripe handles all card data — you never touch it      |
| Webhook verification | Prevent forged webhooks              | `stripe.webhooks.constructEvent()` signature check    |
| CSRF                 | Prevent cross-site form submission   | Next.js handles this by default for App Router          |
| Environment secrets  | API keys never in client code        | `STRIPE_SECRET_KEY` (no `NEXT_PUBLIC_` prefix)      |

### The Golden Rule of Environment Variables

**This is probably the most important security concept in the entire document.**

**What are environment variables?** They're secret values (like API keys and passwords) stored on the server, NOT in the code. This keeps them private.

**The rule:** Anything with `NEXT_PUBLIC_` in the name is visible to EVERYONE who visits your site. The `NEXT_PUBLIC_` prefix tells Next.js "it's okay to send this to the browser." That's fine for things that are *meant* to be public (like a form endpoint). But it's catastrophic for things that should be secret (like a database password).

```
✅ NEXT_PUBLIC_FORMSPREE_ID    → Safe (just a form endpoint)
✅ NEXT_PUBLIC_STRIPE_PK       → Safe (publishable key, meant to be public)
❌ STRIPE_SECRET_KEY           → NEVER add NEXT_PUBLIC_ prefix
❌ DATABASE_URL                → NEVER add NEXT_PUBLIC_ prefix
❌ RESEND_API_KEY              → NEVER add NEXT_PUBLIC_ prefix
```

---

## 10. Cost Breakdown

### Why understanding costs matters

Before you build a feature, you need to know what it costs to run. Some services are free up to a certain level, then charge money after that. Here's a clear picture of what we spend now and what you'd spend to add portal + payment features.

### Current AV Website Costs

**What we pay today to keep the website running:**

| Service                  | Monthly Cost       |
| ------------------------ | ------------------ |
| Vercel (hosting)         | $0 (Hobby plan)    |
| Cloudflare (DNS/CDN)     | $0 (Free plan)     |
| Google Workspace (email) | $7.20              |
| Cal.com (booking)        | $0 (Free plan)     |
| Formspree (contact form) | $0 (Free plan)     |
| GitHub (code hosting)    | $0                 |
| **Total**          | **$7.20/mo** |

### With Portal + Payments (Per Client Project)

**What it would cost to offer a full client portal with payment processing:**

| Service                       | Monthly Cost                                 | Notes                                    |
| ----------------------------- | -------------------------------------------- | ---------------------------------------- |
| Vercel Pro                    | $20                                          | Needed for team features, more bandwidth |
| Supabase                      | $0–25                                       | Free tier generous; Pro for production   |
| Clerk                         | $0–25 | Free up to 10K MAU; $0.02/MAU after |                                          |
| Stripe                        | 2.9% + $0.30/txn                             | Per transaction, no monthly fee          |
| Resend                        | $0–20                                       | Free for 3K emails/mo                    |
| Domain (client)               | ~$12/yr                                      | Per client domain                        |
| **Base infrastructure** | **$20–90/mo**                         | Before transaction fees                  |

### Pricing Your Services

**Why this table matters:** Knowing your costs lets you price your services profitably. The "Your Cost" column is what you pay for infrastructure. The "What to Charge" column is what you charge the client. The difference is your margin.

| Package      | Your Cost                              | What to Charge              | Your Margin |
| ------------ | -------------------------------------- | --------------------------- | ----------- |
| Professional | ~$20/mo hosting | $2,400 one-time      | High margin after labor     |             |
| Business     | ~$45/mo infra | $4,800 + $149/mo care  | Excellent recurring revenue |             |
| Enterprise   | ~$90/mo infra | $8,500+ + $299/mo care | Premium margin at scale     |             |

---

## 11. Step-by-Step: Building a Client Project with Portal + Payments

**What this section is:** A complete, numbered checklist for building a client website with a login portal, payment processing, and email notifications. Follow these steps in order.

**Why is it a checklist?** Complex projects fail when steps get skipped or done out of order. This list tells you exactly what to do and when, so nothing falls through the cracks.

Here's the exact sequence you'd follow:

### Phase 1: Foundation (What You Already Know)

1. Create a new Next.js project or clone the AV website template
2. Set up `src/lib/constants.ts` with client's brand constants
3. Build the marketing pages (Home, About, Services, Contact)
4. Add the contact form with server-side validation
5. Deploy to Vercel
6. Connect the client's domain via Cloudflare

### Phase 2: Database + Auth

7. Create a Supabase project (or PlanetScale)
8. Install Prisma and define the schema:
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```
9. Define models (Client, Project, Invoice) in `prisma/schema.prisma`
10. Run migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
11. Install Clerk:
    ```bash
    npm install @clerk/nextjs
    ```
12. Add Clerk environment variables to `.env.local`:
    ```
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
    CLERK_SECRET_KEY=sk_...
    ```
13. Update middleware to protect portal routes
14. Create `src/app/(portal)/layout.tsx` with `<ClerkProvider>`

### Phase 3: Portal Pages

15. Create `/dashboard` — overview of client's projects
16. Create `/dashboard/[projectId]` — individual project detail
17. Create `/billing` — payment history and subscription management
18. Create `/documents` — shared files and deliverables

### Phase 4: Payments

19. Create Stripe account, get API keys
20. Install Stripe:
    ```bash
    npm install stripe @stripe/stripe-js
    ```
21. Create products and prices in Stripe Dashboard
22. Build `/api/checkout` route for one-time payments
23. Build `/api/webhooks/stripe` for payment notifications
24. Connect webhook to database updates
25. Set up Stripe CLI for local webhook testing:
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    ```

### Phase 5: Notifications

26. Install Resend:
    ```bash
    npm install resend
    ```
27. Create email templates in `src/lib/email.ts`
28. Wire up emails to webhook events (payment confirmed, project update)

### Phase 6: Testing & Launch

29. Write tests for auth flows, payment processing, email triggers
30. Test with Stripe test mode (use `4242 4242 4242 4242` test card)
31. Run full CI pipeline: `npm run ci`
32. Switch Stripe to live mode
33. Deploy and verify

---

## 12. Glossary

**What is a glossary?** A quick-reference list of technical terms and what they mean in plain English. If you see a term anywhere in this document that confuses you, look it up here.

| Term                           | What It Means                                                                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**                  | Application Programming Interface — a way for two programs to talk to each other. When your website sends form data to Formspree, it's using Formspree's API.         |
| **API Route**            | A server-side endpoint in your Next.js app (files in `src/app/api/`). It's code that runs on the server, not in the browser.                                         |
| **Auth**                 | Short for Authentication — verifying who someone is when they log in.                                                                                                 |
| **CRUD**                 | Create, Read, Update, Delete — the four basic things you can do with data in a database.                                                                              |
| **CSP**                  | Content Security Policy — a security rule that tells the browser which scripts are allowed to run, preventing hackers from injecting malicious code.                  |
| **CRM**                  | Customer Relationship Management — a system for tracking leads and client interactions (like a super-powered contact list).                                           |
| **Endpoint**             | A specific URL that your server listens to (like `POST /api/contact`). Think of it like a mailbox — messages go to a specific address.                              |
| **Environment Variable** | A secret value stored on the server, not in the code (like API keys and passwords). Keeps sensitive info out of the codebase.                                          |
| **Framework**            | A pre-built structure for building software. Next.js is a framework — it gives you routing, server rendering, and tools so you don't start from zero.                 |
| **Middleware**           | Code that runs automatically before every page request — like a security checkpoint.                                                                                  |
| **Nonce**                | A one-time random value used for CSP security. Each page visit gets a fresh nonce so hackers can't predict it.                                                         |
| **ORM**                  | Object-Relational Mapper — a translator between your code and the database. You write TypeScript, and the ORM converts it to SQL (the language databases understand). |
| **OAuth**                | "Login with Google/GitHub" — letting a trusted third party verify a user's identity so you don't have to handle passwords yourself.                                   |
| **PostgreSQL**           | The most popular open-source relational database. Stores data in tables (rows and columns), like a super-powered spreadsheet.                                          |
| **Prisma**               | A TypeScript ORM (see ORM) that makes database queries type-safe and readable.                                                                                         |
| **Rate Limiting**        | Blocking users or bots who send too many requests in a short time — like a bouncer who turns away someone trying to enter 50 times in a minute.                       |
| **Route Group**          | Folders in parentheses (like `(portal)`) in Next.js that organize code without affecting the URL.                                                                    |
| **RLS**                  | Row-Level Security — database rules that restrict which rows a user can see. Each user only sees their own data.                                                      |
| **SSR**                  | Server-Side Rendering — building the page on the server before sending the finished HTML to the browser. Faster and better for SEO.                                   |
| **Stripe**               | The industry-standard payment processing service. Handles credit cards so you don't have to.                                                                           |
| **Supabase**             | A managed PostgreSQL database service with built-in auth, real-time features, and file storage.                                                                        |
| **Token**                | A string of characters that proves you're logged in. Like a digital wristband at an event — you show it to get into the VIP area.                                     |
| **Turbopack**            | Next.js's fast development bundler. When you run `npm run dev`, Turbopack makes code changes appear in your browser almost instantly.                                |
| **TypeScript**           | A stricter version of JavaScript that catches errors while you code, before users ever see them. Like spell-check for programmers.                                     |
| **Webhook**              | A message that one server sends to another when something happens. Stripe sends a webhook to your server when someone pays.                                            |

| **Magic Link** | A one-time login URL emailed to a user. Clicking it proves they own the email address — no password required. Expires in 24 hours. |
| **JWT** | JSON Web Token — a signed, tamper-proof blob of data stored in a cookie that proves a user is logged in. |
| **Docuseal** | A document e-signature platform. We use it to send SOWs for client countersignature. |
| **SheetJS (xlsx)** | A JavaScript library that generates Excel (.xlsx) files in the browser, without any server involvement. |

---

## 13. Implemented Platform — Architecture Reference (v2.1)

> This section describes the **live, deployed** system as of March 16, 2026. All features below are in production on Vercel.

### 13.1 Entity Relationships

```
clients ──┬── projects      (one client → many projects)
          ├── documents      (one client → many documents, CASCADE DELETE)
          └── verification_tokens  (one client email → one active token at a time)

projects ─── (no children; references clients.id)

expenses ─── (standalone; no FK to clients — internal business records)
```

**Cascade rules:**

- Deleting a `client` cascades to their `documents` (ON DELETE CASCADE)
- Deleting a `client` does NOT automatically delete their `projects` — drop projects first via admin, or add a cascade if desired
- `verification_tokens` are keyed on `identifier` (email), deleted on use or expiry

### 13.2 Database Schema (Neon Postgres)

```sql
-- Clients: one row per client company
clients (
  id            SERIAL PRIMARY KEY,
  name          TEXT,           -- business name
  contact_name  TEXT,
  email         TEXT UNIQUE,
  phone         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)

-- Projects: linked to a client, drives the dashboard timeline
projects (
  id                      SERIAL PRIMARY KEY,
  client_id               INTEGER REFERENCES clients(id),
  name                    TEXT,
  status                  TEXT,   -- 'active' | 'signed' | 'pending' | 'closed'
  start_date              TIMESTAMPTZ,
  signed_at               TIMESTAMPTZ,
  docuseal_submission_id  TEXT,
  current_phase           TEXT,   -- 'kickoff' | 'design' | 'development' | 'review' | 'launched'
  phase_kickoff_date      TIMESTAMPTZ,
  phase_design_date       TIMESTAMPTZ,
  phase_development_date  TIMESTAMPTZ,
  phase_review_date       TIMESTAMPTZ,
  phase_launched_date     TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
)

-- Verification tokens: magic-link auth tokens, auto-deleted on use or expiry
verification_tokens (
  identifier  TEXT,           -- the client's email
  token       TEXT,
  expires     TIMESTAMPTZ,
  PRIMARY KEY (identifier, token)
)

-- Documents: markdown content delivered to clients via portal
documents (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
)

-- Expenses: internal business expense tracking
expenses (
  id          SERIAL PRIMARY KEY,
  date        DATE,
  vendor      TEXT,
  description TEXT,
  category    TEXT,
  amount      NUMERIC(10,2),
  tax_year    INTEGER,
  receipt_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

### 13.3 Authentication System

**Client auth (magic link):**

1. Client submits email at `/client/login`
2. `POST /api/auth/send-magic` generates a 32-byte hex token, stores it in `verification_tokens`, and emails a link via Resend to `/client/confirm?token=&email=`
3. Client clicks the link, sees a confirmation page (scanner-safe — no auto-redirect), clicks "Access my portal"
4. Form `POST`s to `/api/auth/magic`, which validates the token, deletes it, then calls NextAuth's `encode()` to mint a JWT session cookie
5. Client is redirected to `/client/dashboard`

**Token encoding:** `encode()` from `next-auth/jwt` with no `salt` parameter — matches NextAuth's internal decode which uses `salt=""`. Secret: `NEXTAUTH_SECRET` env var.

**Admin auth (passphrase):**

- `POST /api/admin/auth` validates `ADMIN_PASSPHRASE` env var, sets `av-admin-session=authenticated` cookie
- Cookie maxAge: 8 hours (default) or 30 days ("Remember me" checkbox)
- `src/proxy.ts` middleware guards all `/admin/*` routes except `/admin/login`

**Admin impersonation:**

- `POST /api/admin/clients/impersonate` mints a 1-hour JWT session as any client
- Opens `/client/dashboard` in a new tab — useful for testing client views

### 13.4 Client Portal

**Route:** `/client/dashboard` (auth-gated via NextAuth session)

**Features:**

- Project cards with status badge (`active / signed / pending / closed`)
- Project timeline: 5-phase vertical stepper (Kickoff → Design → Development → Review → Launched) with progress bar
- "Sign document →" button when a Docuseal submission ID is linked and status ≠ signed
- Documents section: lists all documents for that client; click to expand inline markdown viewer
- Logout button

**Markdown rendering:** `react-markdown` + `remark-gfm` (tables, task lists, code blocks, blockquotes). Styled for dark theme via `.doc-viewer` CSS classes in `globals.css`.

### 13.5 Admin Panel

**Route prefix:** `/admin/*` — all routes auth-gated by `av-admin-session` cookie

| Route                | Purpose                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `/admin/clients`   | Add clients, send magic-link invites, impersonate (view-as-client)  |
| `/admin/projects`  | Set current phase and milestone dates per project                   |
| `/admin/documents` | Create/edit/delete markdown documents per client; edit+preview tabs |
| `/admin/expenses`  | Full expense CRUD, category summary, Excel export                   |

**Design:** Dark theme matching client portal (`#070f1e` bg, `#0d1b2e` surface, `#3b82f6` accent).

### 13.6 Document Portal

Documents are stored as `TEXT` (markdown) in the `documents` table. No file storage service required.

**Admin workflow:** Go to `/admin/documents` → New → select client → write or paste markdown → Save. Edit and Preview tabs available before saving.

**Client view:** Documents appear as a list below the project timeline. Clicking a document expands it inline with full GFM rendering. The × closes it.

**Why this over Google Drive?** Drive requires sharing permissions per file, has no dark theme, and opens in a new tab. The portal viewer is in-context, branded, and access-controlled by client session automatically.

### 13.7 Expense Tracker

**Route:** `/admin/expenses`

- Add expenses via form (date, vendor, description, category, amount, receipt URL)
- Inline row editing: click Edit on any row to edit all fields in place
- Delete per row
- Category summary cards + grand total
- **Excel export:** SheetJS generates `AV-Expenses-{year}.xlsx` client-side with two sheets: line items and summary
- Year selector (current year and 2 prior years)

### 13.8 Email Infrastructure

All transactional email sent via **Resend** (`RESEND_API_KEY` env var):

| From address                    | Purpose                                   |
| ------------------------------- | ----------------------------------------- |
| `noreply@aetherisvision.com`  | Magic link login emails to clients        |
| `system@aetherisvision.com`   | Intake form notifications (internal)      |
| `projects@aetherisvision.com` | Intake confirmation to submitting contact |

### 13.9 Docuseal Integration

`src/lib/docuseal.ts` — three functions:

- `sendForSigning()` — POSTs a base64 PDF to Docuseal, creates a submission with Client (Signer) + Aetheris Vision (Countersigner) roles. Countersigner email: `marston@aetherisvision.com`.
- `getSubmission()` — fetches submission status (called from webhook handler)
- `downloadSignedPdf()` — downloads completed PDF as a Buffer

Env var: `DOCUSEAL_API_KEY`

### 13.10 Environment Variables (Production)

| Variable             | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `NEXTAUTH_SECRET`  | Signs JWT session tokens                  |
| `NEXTAUTH_URL`     | Base URL (`https://aetherisvision.com`) |
| `ADMIN_PASSPHRASE` | Admin login passphrase                    |
| `DATABASE_URL`     | Neon Postgres connection string           |
| `RESEND_API_KEY`   | Transactional email                       |
| `DOCUSEAL_API_KEY` | Document e-signature                      |

---

*This document is a living reference. Update it as the platform evolves.*
