# Aetheris Vision Website

## What Is This?

This is the **source code** for the Aetheris Vision company website. Think of it like the blueprint for a building — all the instructions that tell the internet what to display when someone visits [aetherisvision.com](https://aetherisvision.com).

**Aetheris Vision LLC** is a Veteran-Owned Small Business (VOSB) that provides AI/ML weather prediction, operational meteorology consulting, and federal contracting services.

**Why does the website exist?** It's the company's public storefront — like a digital business card that also shows off work samples, lets people schedule meetings, and handles contact form submissions.

---

## Tech Stack — What We Use and Why

Every tool we use was chosen for a reason. Here's what's in the toolbox:

| Tool | What It Does | Why We Picked It |
|---|---|---|
| **Next.js 16** | The framework (skeleton) of the website. Handles pages, routing, and server-side logic. | It's the most popular React framework. It makes websites fast because pages are built on the server before the user sees them (better for Google search rankings too). |
| **TypeScript** | A stricter version of JavaScript that catches mistakes while you type. | Without it, bugs hide until a real user finds them. TypeScript is like spell-check for code. |
| **React 19** | A library for building the visual parts of the website (buttons, menus, cards). | It lets you build reusable "components" — build a button once, use it everywhere. |
| **Tailwind CSS 4** | A styling system that lets you design directly in your HTML instead of separate style files. | Much faster than writing traditional CSS. You add classes like `text-blue-500` right on the element. |
| **Framer Motion** | Adds smooth animations (fade-ins, slide-ups). | Makes the site feel polished and professional instead of static. |
| **Heroicons v2** | A set of pre-made icons (checkmarks, arrows, phones, etc.). | Consistent, sharp icons without hiring a designer. |
| **Vercel** | The hosting service that puts our website on the internet. | Built by the same team that makes Next.js, so they work perfectly together. Free for small sites. Deploys automatically when we push code. |
| **Vitest** | Runs automated tests to make sure nothing is broken. | Like a robot that checks every page and feature for you, every time you change something. |
| **ESLint 9** | A linter that checks your code for common mistakes and style issues. | Catches problems before they reach users — like having a proofreader for your code. |
| **GitHub Actions** | Runs our tests and builds automatically when code is pushed. | No human has to remember to run tests. The computer does it for us every time. |
| **GitHub + GitLab** | Where the code is stored (like Google Drive for code). | Two copies in two places — if one goes down, we still have the other. |

---

## Quick Start — How to Run the Website on Your Computer

**What you need first:** A Mac or Linux computer with [fnm](https://github.com/Schniz/fnm) installed (fnm manages Node.js versions for you).

Here's what each command does and why you run it:

```bash
# Step 1: Tell fnm to use the right version of Node.js
# WHY: The project requires Node.js 24.15.0. Using a different version could cause errors.
fnm use

# Step 2: Install all the project's dependencies (libraries it needs)
# WHY: The code uses tools made by other developers (React, Tailwind, etc.).
#       This command downloads them all into a folder called node_modules/.
npm install

# Step 3: Start the development server
# WHY: This runs the website on your own computer at http://localhost:3000
#       so you can see your changes live as you edit code.
npm run dev

# Step 4: Run the test suite (optional, but recommended before deploying)
# WHY: Runs 82 automated checks to make sure nothing is broken.
npm test

# Step 5: Build the production version (optional, for deployment checks)
# WHY: This creates the optimized version of the site that Vercel actually serves.
#       If this fails, the website won't deploy.
npm run build

# Step 6: Run the full CI pipeline (what GitHub Actions runs)
# WHY: Does everything — linting + testing + building — in one command.
#       If this passes, your code is ready to push.
npm run ci
```

---

## Project Structure — How the Code Is Organized

Think of the project like a filing cabinet. Each drawer (folder) has a specific purpose:

```
src/
  app/                         # 📄 PAGES — Each folder here becomes a page on the website
    layout.tsx                 #   The "wrapper" around every page (fonts, metadata, navbar)
    page.tsx                   #   The home page (what you see at aetherisvision.com/)
    error.tsx                  #   What shows when something goes wrong
    not-found.tsx              #   Custom 404 page
    sitemap.ts                 #   Tells Google about all our pages
    robots.ts                  #   Tells search engine crawlers which pages to index
    about/                     #   The About page
    blog/                      #   Blog index + individual post pages
    book/                      #   Cal.com booking page
    capabilities/              #   Government contracting capabilities
    contact/                   #   Contact form page
    portfolio/                 #   Portfolio page + demo websites
    privacy/                   #   Privacy policy

    admin/                     # 🔐 ADMIN PANEL — passphrase-gated, dark-themed
      layout.tsx               #   Sticky nav (Clients / Projects / Documents / Expenses) + logout
      login/page.tsx           #   Admin login (passphrase + "Remember me" checkbox)
      clients/page.tsx         #   Add clients, send invites, impersonate
      projects/page.tsx        #   Set project phase + milestone dates
      documents/page.tsx       #   Create/edit/delete markdown docs per client
      expenses/page.tsx        #   Expense CRUD, category summary, Excel export
      components/DatePicker.tsx#   Flatpickr date picker (dark-themed)

    client/                    # 🧑 CLIENT PORTAL — magic-link auth, dark-themed
      login/page.tsx           #   Email → magic link request form
      confirm/page.tsx         #   Token confirmation (scanner-safe POST form)
      dashboard/page.tsx       #   Project timeline + document viewer

    api/
      auth/
        send-magic/route.ts    #   POST: generates token, sends login email
        magic/route.ts         #   POST: validates token, mints JWT session cookie
      admin/
        auth/route.ts          #   POST: validates passphrase, sets session cookie | DELETE: logout
        clients/route.ts       #   GET/POST clients
        clients/invite/        #   POST: send magic link to a client
        clients/impersonate/   #   POST: mint 1-hr session as a client (admin view-as)
        documents/route.ts     #   GET all docs / POST create
        documents/[id]/route.ts#   GET / PATCH / DELETE a document
        projects/route.ts      #   GET all projects / PATCH update phase+dates
      client/
        projects/route.ts      #   GET projects for authenticated client
        documents/route.ts     #   GET document list for authenticated client
        documents/[id]/route.ts#   GET single document (auth-gated to owner)
      expenses/route.ts        #   GET/POST expenses
      expenses/[id]/route.ts   #   PATCH/DELETE a single expense
      intake/route.ts          #   POST: project intake form → Resend email

  components/                  # 🧩 REUSABLE PARTS
    Navbar.tsx
    Footer.tsx
    ContactForm.tsx
    CalBooking.tsx
    FadeIn.tsx / BackToTop.tsx / CtaButton.tsx
    ArticleRenderer.tsx / BlogClientPage.tsx / BlogComments.tsx / BlogSubscribeCard.tsx

  lib/                         # 📚 SHARED UTILITIES
    constants.ts               #   Company name, email, URLs — single source of truth
    db.ts                      #   Neon Postgres client (sql tagged-template helper)
    auth-adapter.ts            #   Custom NextAuth adapter backed by clients table
    send-magic-link.ts         #   Shared helper: generate token + send login email
    docuseal.ts                #   Docuseal API: sendForSigning, getSubmission, downloadSignedPdf
    jsonld.ts / portfolio-data.ts / posts.ts

  proxy.ts                     # 🛡 MIDDLEWARE — admin auth guard + security headers

tests/                         # ✅ AUTOMATED TESTS
  unit/                        #   Individual functions
  integration/                 #   Feature end-to-end
  regression/                  #   Guards against regressions
  features/                    #   BDD plain-English scenarios
```

---

## Architecture Principles — The Rules We Follow (and Why They Matter)

### DRY — Don't Repeat Yourself

**What it means:** Never write the same information in two places.

**Why it matters:** Imagine you wrote "Aetheris Vision" in 30 different files. If the company rebrands, you'd have to find and update all 30. Miss one? Now the website shows the wrong name somewhere. DRY means you write it *once* and every file points to that one place.

**How we do it:**
- **Brand strings** → All stored in `src/lib/constants.ts` (the `SITE` object). Every page imports `SITE.name` instead of typing "Aetheris Vision" directly.
- **Structured data** → Google needs special metadata about our company. It's defined once in `src/lib/jsonld.ts` and imported wherever needed.
- **Reusable components** → The `Navbar`, `Footer`, `CtaButton`, and `FadeIn` components are built once and shared across all pages.

### SRP — Single Responsibility Principle

**What it means:** Each file should do ONE thing well.

**Why it matters:** If a file does too many things, it becomes hard to read, hard to test, and hard to fix when something breaks. Think of it like a restaurant kitchen — the chef doesn't also wash dishes and greet customers. Each person has one job.

**How we do it:**
- **Data vs. display** → The pricing tiers, FAQ questions, and process steps live in `src/lib/portfolio-data.ts` (data only). The portfolio page (`src/app/portfolio/page.tsx`) just renders that data. If you want to change a price, you edit the data file — you don't have to dig through rendering code.
- **API routes** → Server logic (processing forms, talking to external services) stays in `src/app/api/`. Page components never do server-side work directly.
- **Middleware** → Security headers and auth checks run in `src/middleware.ts`, separate from page logic.

---

## Testing — How We Know the Website Works

**Why do we test?** Because humans make mistakes. Every time you change one thing, you might accidentally break something else. Automated tests catch these mistakes in seconds, before they reach real users.

```bash
npm test              # Run ALL 82 tests at once (the full safety check)
npm run test:unit     # Unit tests only — "Do individual functions work correctly?"
npm run test:integration  # Integration tests — "Do features work end-to-end?"
npm run test:regression   # Regression tests — "Is critical data still intact?"
npm run test:bdd      # BDD tests — "Does the site behave as expected in English scenarios?"
npm run test:watch    # Watch mode — re-runs tests automatically when you save a file
```

**What each test type catches:**
| Type | What It Checks | Example |
|---|---|---|
| **Unit** | Individual functions return correct values | "Does `SITE.name` equal 'Aetheris Vision'?" |
| **Integration** | Features work from start to finish | "Does the contact API reject a message that's too short?" |
| **Regression** | Nothing that used to work got broken | "Does every page still have required SEO metadata?" |
| **BDD** | Behavior described in plain English | "Given a visitor on the portfolio page, When they see pricing, Then all three tiers are shown" |

---

## Security — How We Keep the Website Safe (and Why Each Protection Matters)

| Protection | What It Does | Why It Matters |
|---|---|---|
| **CSP (Content Security Policy)** | Tells the browser which scripts are allowed to run on our pages. Uses a one-time "nonce" (random code) for each request. | Prevents hackers from injecting malicious scripts into our website. |
| **HSTS** | Forces all connections to use HTTPS (the padlock in your browser). | Stops attackers from intercepting data between the user and our server. |
| **X-Content-Type-Options** | Tells browsers not to guess what type of file something is. | Prevents a sneaky attack where a harmful file pretends to be an image. |
| **X-Frame-Options** | Prevents other websites from embedding our site inside a frame. | Stops "clickjacking" — where a malicious site puts ours in an invisible frame to steal clicks. |
| **Rate Limiting** | Blocks anyone who sends more than 5 contact form submissions in 10 minutes. | Stops bots from flooding our inbox with spam. |
| **Honeypot Field** | A hidden field in the contact form that humans can't see but bots fill in. | If the field has a value, we know it's a bot, not a real person. |
| **Input Validation** | Checks that the name, email, and message are the right format and length before processing. | Prevents garbage data and potential injection attacks. |
| **Basic Auth** | Preview deployments (test versions) require a password. | Keeps unfinished work private so only the team can see it. |

---

## Services Setup — How Each Feature Works

### Contact Form (Resend)

**What:** The contact page has a form where visitors can send us a message (their name, email, organization, requirement type, and what they need).

**Why Resend?** The contact form delivers submissions by email through [Resend](https://resend.com) — the same provider already used for magic-link sign-in and invoice delivery. Reusing Resend avoids a separate third-party (Formspree) and its login friction, and sends from our already-verified `aetherisvision.com` domain.

The `POST /api/contact` route emails the submission to `contact@aetherisvision.com` (from `SITE.email`) with `replyTo` set to the submitter, so replies go straight back to them.

1. Get an API key from [resend.com/api-keys](https://resend.com/api-keys).
2. Add it to `.env.local`:

```bash
RESEND_API_KEY="re_..."
```

For Vercel production:

```bash
vercel env add RESEND_API_KEY production
```

If `RESEND_API_KEY` is not set, the route returns 503 and the form shows an "unavailable" notice directing visitors to call/text or book a call.

### Blog Subscription

**What:** A form on the blog page where readers can enter their email to get notified about new posts.

**Why?** If someone likes our content, we want an easy way for them to stay connected. This builds our audience over time.

1. Create `.env.local` from `.env.example`.
2. Add a `NEXT_PUBLIC_BLOG_SUBSCRIBE_URL` value.
3. Set it to your provider endpoint (ConvertKit, Buttondown, Mailchimp form endpoint, etc.).

```bash
cp .env.example .env.local
```

```bash
NEXT_PUBLIC_BLOG_SUBSCRIBE_URL="https://your-provider-endpoint"
```

If this variable is not set, the blog shows a fallback "Subscribe by Email" button that opens your mail client.

### Vercel deployment note (comments)

For production deployments on Vercel, set this variable in your Vercel project environment settings (Production/Preview/Development as needed). `.env.local` only affects local development.

```bash
vercel env add NEXT_PUBLIC_BLOG_SUBSCRIBE_URL production
```

### Blog Comments (Giscus)

**What:** A comment section at the bottom of each blog post where readers can discuss the article.

**Why Giscus?** It uses GitHub Discussions as the comment database, so we don't need to build a comment system or worry about spam databases. It's free and the comments live right alongside our code in GitHub.

1. Enable GitHub Discussions on the repository.
2. Configure Giscus and copy the values below.
3. Add these environment variables to `.env.local` (already included as placeholders in `.env.example`):

```bash
NEXT_PUBLIC_GISCUS_REPO="owner/repo"
NEXT_PUBLIC_GISCUS_REPO_ID="R_kgDO..."
NEXT_PUBLIC_GISCUS_CATEGORY="General"
NEXT_PUBLIC_GISCUS_CATEGORY_ID="DIC_kwDO..."
```

If any required variable is missing, comments are automatically hidden.

### Vercel deployment note

For production deployments on Vercel, add the same `NEXT_PUBLIC_GISCUS_*` variables in your Vercel project environment settings. `.env.local` does not configure hosted deployments.

```bash
vercel env add NEXT_PUBLIC_GISCUS_REPO production
vercel env add NEXT_PUBLIC_GISCUS_REPO_ID production
vercel env add NEXT_PUBLIC_GISCUS_CATEGORY production
vercel env add NEXT_PUBLIC_GISCUS_CATEGORY_ID production
```

### Booking (Cal.com)

**What:** An embedded calendar on the `/book` page where visitors can schedule a 30-minute consultation.

**Why Cal.com?** Instead of going back and forth over email to find a meeting time, Cal.com shows our available slots and the visitor picks one. It automatically handles time zones, sends calendar invites, and avoids double-bookings. The free plan covers everything we need.

- Event URL: `https://cal.com/aetherisvision/30min`
- Component: `src/components/CalBooking.tsx`
- Page: `src/app/book/page.tsx`
- All "Engage Our Services" CTAs site-wide now link to `/book`

No environment variables are required — the Cal.com username and event slug are hardcoded in `CalBooking.tsx`.

### Adding or updating event types

1. Log into [cal.com/aetherisvision](https://app.cal.com) and create or edit an event type.
2. Update the `calLink` prop in `src/components/CalBooking.tsx` if the slug changes.
3. Commit and push; Vercel will redeploy automatically.

### Removing Cal.com branding

Upgrade to the Cal.com **Teams plan** ($12/month) in your Cal.com account settings to remove the "Powered by Cal.com" watermark on the hosted booking page.

---

## Deployment — How the Website Goes Live

### Vercel CLI Setup

**What:** The Vercel CLI is a command-line tool that lets you manage your website deployment from the Terminal.

**Why?** So you can check if the site is up, pause it, or resume it without logging into a website dashboard.

```bash
vercel login          # authenticate (opens browser)
vercel link --project aetheris-vision-website  # link this directory to the correct project
```

The `.vercel/` directory is gitignored. Re-run `vercel link` on any new machine or after deleting `.vercel/`.

### Vercel Management

**What:** A Python script (`scripts/vercel.py`) that lets you pause or resume the live website with one command.

**Why?** If the company registration is pending, or you need to take the site offline temporarily, this makes it instant.

```bash
# Check whether the site is live or paused
python3 scripts/vercel.py status

# Take the site offline (e.g. while company registration is pending)
python3 scripts/vercel.py pause

# Bring the site back online
python3 scripts/vercel.py resume
```

### How Deployment Works

**What:** Every time we push code to the `main` branch on GitHub, Vercel automatically builds and publishes the new version of the website.

**Why automatic deployment?** No human has to remember to "upload the website." Push your code, and within a couple of minutes, the live site is updated. If the build fails (tests don't pass, code has errors), the old version stays live — nothing breaks.

Node.js is pinned to `24.15.0` for local development and CI, with the supported Node 24 line enforced in `package.json`.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Deployment Checklist

**Why a checklist?** Environment variables (secret values stored on Vercel) must be set for certain features to work. If you forget to set one, that feature silently won't appear — no error, it just vanishes. This checklist prevents that.

Before pushing changes that affect blog subscription, comments, or booking:

1. Confirm Vercel environment variables are set (if using blog features):
   - `NEXT_PUBLIC_BLOG_SUBSCRIBE_URL`
   - `NEXT_PUBLIC_GISCUS_REPO`
   - `NEXT_PUBLIC_GISCUS_REPO_ID`
   - `NEXT_PUBLIC_GISCUS_CATEGORY`
   - `NEXT_PUBLIC_GISCUS_CATEGORY_ID`
2. Ensure the variables are added to the correct Vercel environments (`Production`, `Preview`, and/or `Development`).
3. Deploy to Vercel and verify:
   - The subscription block appears on `/blog` and submits to the expected endpoint.
   - The comments section loads on blog post pages.
   - The `/book` page loads and displays the Cal.com calendar embed.
4. If values were changed in Vercel, trigger a redeploy so static pages pick up updated `NEXT_PUBLIC_*` values.

## Environment Health Check

Run this anytime to verify blog subscription/comments environment variables:

```bash
npm run check:env
```

`npm run build` now runs this check automatically and prints warnings if optional blog variables are missing.
