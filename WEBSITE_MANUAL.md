# Aetheris Vision Website — Complete Build Manual

**Written for:** Anyone who needs to maintain, rebuild, or hand off this website.  
**Reading level:** No coding experience required. Technical terms are explained the first time they appear.  
**Last updated:** March 19, 2026

---

## Table of Contents

1. [What This Website Is](#1-what-this-website-is)
2. [The Big Picture — How Everything Connects](#2-the-big-picture--how-everything-connects)
3. [All the Accounts You Need](#3-all-the-accounts-you-need)
4. [The Folder and File Structure Explained](#4-the-folder-and-file-structure-explained)
5. [Setting Up From Scratch](#5-setting-up-from-scratch)
6. [How to Make Changes to the Website](#6-how-to-make-changes-to-the-website)
7. [How to Write and Publish a Blog Post](#7-how-to-write-and-publish-a-blog-post)
8. [All Environment Variables — What They Are and Where to Get Them](#8-all-environment-variables--what-they-are-and-where-to-get-them)
9. [Every Service Used — What It Does and Why](#9-every-service-used--what-it-does-and-why)
10. [DNS and Domain — How the Website Gets Its Address](#10-dns-and-domain--how-the-website-gets-its-address)
11. [Email Setup — How contact@aetherisvision.com Works](#11-email-setup--how-contactaetherisvisioncom-works)
12. [Security — What's Protected and How](#12-security--whats-protected-and-how)
13. [Common Problems and How to Fix Them](#13-common-problems-and-how-to-fix-them)
14. [Go-Live Checklist](#14-go-live-checklist)
15. [Maintenance — Keeping It Running](#15-maintenance--keeping-it-running)

---

## 1. What This Website Is

This is the official website for **Aetheris Vision LLC**, a veteran-owned small business providing operational meteorology, AI/ML integration, web & digital solutions, and state and federal contracting services.

**What the website does:**
- Describes the company and all services it offers
- Shows credentials (VOSB, clearance, NAICS codes) for state and federal procurement
- Markets web development services with pricing, demos, and a project intake form
- Hosts a blog with technical articles
- Lets visitors book a 30-minute call
- Lets visitors send a contact message or submit a project intake form
- Provides an AI chat assistant (powered by Claude) to answer visitor questions 24/7
- Admin portal for managing clients, projects, expenses, and documents
- Client portal for client-facing project updates

**URL:** https://aetherisvision.com

**Public Pages:**
- `/` — Home page
- `/about` — Founder bio and credentials
- `/capabilities` — Government-facing capabilities statement with NAICS/PSC codes
- `/portfolio` — Web development packages, pricing, demos, and intake
- `/portfolio/[demo]` — Individual demo sites (law-firm, restaurant, trades-contractor, etc.)
- `/blog` — List of all blog posts
- `/blog/[post-name]` — Individual blog post
- `/book` — Cal.com booking calendar
- `/intake` — Project intake form for web development prospects
- `/contact` — Contact form
- `/privacy` — Privacy policy
- `/security` — Security policy

**Internal Pages (password-protected):**
- `/admin` — Admin dashboard (clients, projects, expenses, documents)
- `/client` — Client dashboard

---

## 2. The Big Picture — How Everything Connects

Think of the website like a car. Here are the parts:

```
YOU (write code on your Mac)
    ↓  push changes
GITHUB (stores all the code in the cloud)
    ↓  automatically triggers
VERCEL (builds and hosts the website)
    ↓  serves pages to visitors at
aetherisvision.com (the domain, DNS managed by Cloudflare)
```

**When a visitor fills out the contact form:**
```
Visitor's browser → aetherisvision.com/api/contact (Vercel server)
                       → Formspree (email delivery service)
                           → contact@aetherisvision.com (your Gmail)
```

**When a visitor books a call:**
```
Visitor's browser → /book page → Cal.com calendar embed → booking confirmation
```

**When a visitor comments on a blog post:**
```
Visitor's browser → Giscus widget → GitHub Discussions
                                       → you see it on GitHub
```

---

## 3. All the Accounts You Need

You need accounts on all of these services. All are free or already paid for.

| Service | URL | What it's for | Login |
|---|---|---|---|
| GitHub | github.com | Stores all the code | marstonsward |
| Vercel | vercel.com | Hosts the website | GitHub login |
| Cloudflare | cloudflare.com | Manages the domain's DNS | your email |
| Google Workspace | admin.google.com | Business email | your email |
| Formspree | formspree.io | Sends contact form emails | your email |
| Cal.com | cal.com | Booking calendar | your email |
| Giscus setup | giscus.app | Configures blog comments | GitHub login |

---

## 4. The Folder and File Structure Explained

The code lives at:  
`/Users/marston.ward/Documents/GitHub/website/`

Here is every important file and what it does, explained simply:

### Root level files

```
next.config.ts          — Settings for Next.js (the framework that runs the site).
                          Currently sets HTTP security headers.

package.json            — The list of software packages (tools) the site depends on.
                          Like a shopping list. When you run "npm install", it reads
                          this file and downloads everything the site needs.

tsconfig.json           — Settings for TypeScript (the programming language used).
                          You will never need to edit this.

postcss.config.mjs      — Settings for Tailwind CSS (the styling tool). Never edit.

eslint.config.mjs       — Settings for the code linter (a tool that checks for mistakes).
                          Never edit.

next-env.d.ts           — Auto-generated by Next.js. Never edit.
```

### `public/` folder

```
public/logo/            — Store image files here (logos, icons, etc.)
                          Files here are accessible at aetherisvision.com/logo/filename
```

### `scripts/` folder

```
scripts/check-env.js    — Runs before every build. Checks that all required
                          environment variables are set. If any are missing, the
                          build stops and tells you what's missing.

scripts/vercel.py       — A helper script to check deployment status from the terminal.
                          Run it with: python3 scripts/vercel.py status
```

### `src/` folder — This is where all the real code lives

```
src/middleware.ts       — Runs on every web request BEFORE the page loads.
                          Currently does two things:
                          1. Password-protects the site during preview
                          2. Sets Content Security Policy (security headers)
```

### `src/app/` folder — The pages of the website

```
src/app/globals.css     — Global CSS styles that apply to the whole site.
                          The dark background color and base fonts are set here.

src/app/layout.tsx      — The "frame" that wraps every page. The Navbar and Footer
                          live inside this file conceptually. The <html> and <body>
                          tags are here.

src/app/page.tsx        — The home page (aetherisvision.com/)

src/app/about/
  page.tsx              — The /about page. Founder bio + credentials.

src/app/capabilities/
  page.tsx              — The /capabilities page. NAICS/PSC codes, competencies.
                          Six core competencies (3×2 grid):
                          1. Operational Meteorology
                          2. AI/ML Integration
                          3. Technical Advisory
                          4. Federal Contracting
                          5. Technical Leadership (IPT direction, emerging tech, workforce development)
                          6. Web & Digital Solutions

src/app/contact/
  page.tsx              — The /contact page layout. Uses the ContactForm component.

src/app/book/
  page.tsx              — The /book page. Uses the CalBooking component.

src/app/blog/
  page.tsx              — The /blog listing page. Shows all posts.
  [slug]/
    page.tsx            — The individual blog post page. [slug] is a placeholder —
                          Next.js fills it in from the URL. For example,
                          /blog/ai-in-operational-meteorology uses the slug
                          "ai-in-operational-meteorology".

src/app/sitemap.ts      — Auto-generates the sitemap.xml file at
                          aetherisvision.com/sitemap.xml. Google uses this
                          to find and index all your pages.

src/app/robots.ts       — Auto-generates robots.txt at aetherisvision.com/robots.txt.
                          Tells search engine crawlers what they are allowed to visit.

src/app/api/
  contact/
    route.ts            — The server-side contact form handler. When someone submits
                          the contact form, this code runs on Vercel's servers and
                          forwards the message to Formspree. Visitors never see this
                          file — it runs invisibly in the background.
  chat/
    route.ts            — The server-side AI chat handler. Receives visitor messages,
                          enforces rate limiting (20 requests per IP per 15 minutes),
                          and streams responses from the Claude API (Haiku model).
                          Requires ANTHROPIC_API_KEY environment variable.
```

### `src/components/` folder — Reusable building blocks

```
ArticleRenderer.tsx     — Converts blog post text (with ## headings, **bold**, etc.)
                          into formatted HTML. Used inside each blog post page.

BackToTop.tsx           — The "Back to top" button that appears when you scroll down.

BlogClientPage.tsx      — The interactive part of the /blog listing page.
                          (The parts that react to clicks need to be "client" code.)

BlogComments.tsx        — The Giscus comments section at the bottom of each blog post.
                          Renders as an empty section if the 4 GISCUS env vars are
                          not set in Vercel.

BlogSubscribeCard.tsx   — The email subscription card shown on the blog page.

CalBooking.tsx          — The Cal.com calendar embed component used on the /book page.

ContactForm.tsx         — The contact form. Handles submission, loading state, and
                          success/error messages. Posts to /api/contact.

FadeIn.tsx              — A simple animation wrapper. Anything wrapped in <FadeIn>
                          fades in when it scrolls into view.

Footer.tsx              — The footer at the bottom of every page. Contains nav links.

Navbar.tsx              — The navigation bar at the top of every page. Contains
                          links: Expertise, About, Capabilities, Blog, Contact,
                          and the "Book a Call" button.

ChatWidget.tsx          — The floating AI chat assistant button (bottom-right corner
                          of every page). Opens a chat panel where visitors can ask
                          questions about services, pricing, and contracting. Powered
                          by the Claude API via /api/chat. Requires ANTHROPIC_API_KEY.
```

### `src/lib/` folder — Data and utility functions

```
src/lib/posts.ts        — THIS IS WHERE ALL BLOG POSTS LIVE. To add a new blog post,
                          you add an entry to the `posts` array in this file.
                          See Section 7 for exact instructions.

src/lib/portfolio-data.ts — All web development pricing data. Edit this file to update
                            tier names, prices, deliverables, maintenance plans, FAQs,
                            and demo site listings. Changes here update /portfolio
                            automatically.

src/lib/chat-context.ts — The system prompt for the AI chat assistant. Contains all
                          company information the chatbot is allowed to reference:
                          services, pricing, credentials, contact info, and behavioral
                          rules. Update this file whenever services or prices change.

src/lib/constants.ts    — Core site-wide constants: company name, URL, email, tagline,
                          and description. Changes here propagate across metadata,
                          JSON-LD schema, and contact links site-wide.

src/lib/jsonld.ts       — JSON-LD structured data for Google (Organization, WebSite,
                          LocalBusiness schemas). Address: 210 N Mustang Mall Terrace
                          PMB 29, Mustang, OK 73064. Update if address changes.
```

---

## 5. Setting Up From Scratch

Follow these steps in order if you are setting up the project on a new computer.

### Step 1 — Install required software

Open the Terminal app on your Mac. Run these commands one at a time:

**Install Homebrew** (a package manager — makes installing other tools easier):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Install Node.js version 20** (the JavaScript runtime — required to run the site):
```bash
brew install node@20
```

**Install Git** (version control — tracks all changes to your code):
```bash
brew install git
```

**Install the Vercel CLI** (command-line tool for deploying):
```bash
npm install -g vercel
```

### Step 2 — Get the code from GitHub

```bash
cd ~/Documents/GitHub
git clone https://github.com/marstonsward/aetheris-vision-website.git website
cd website
```

This downloads all the code to your computer into a folder called `website`.

### Step 3 — Install the project's dependencies

```bash
npm install
```

This reads `package.json` and downloads all the software packages the site needs. It creates a `node_modules/` folder (do not touch this folder — it is auto-generated).

### Step 4 — Create your local environment file

```bash
cp .env.example .env.local
```

Then open `.env.local` in a text editor and fill in the real values. See Section 8 for what each value is and where to get it.

### Step 5 — Run the site locally (for testing)

```bash
npm run dev
```

Open your browser and go to `http://localhost:3000`. You should see the website.

Press `Ctrl+C` in the terminal to stop it.

### Step 6 — Link to Vercel

```bash
vercel login
vercel link --project aetheris-vision-website
```

Follow the prompts. This connects your local code to the Vercel project.

---

## 6. How to Make Changes to the Website

**The golden rule:** Every change follows this exact pattern:

```
1. Edit a file on your Mac
2. Test it locally (npm run dev)
3. Save it to GitHub (git add + git commit + git push)
4. Vercel automatically deploys it within 1-2 minutes
```

### Step-by-step example — changing text on the About page

1. Open VS Code (or any text editor)
2. Open the file: `src/app/about/page.tsx`
3. Find the text you want to change and edit it
4. Save the file (`Cmd+S`)
5. Check it looks right at `http://localhost:3000/about`
6. In the terminal, run:

```bash
git add src/app/about/page.tsx
git commit -m "Update founder bio text"
git push origin main
```

That's it. Vercel will pick up the change automatically and redeploy.

### What do those git commands mean?

- `git add [filename]` — "I want to include this file in my next save"
- `git commit -m "message"` — "Save a snapshot of these changes with this description"
- `git push origin main` — "Upload my saved snapshot to GitHub"

To add ALL changed files at once (use carefully):
```bash
git add .
git commit -m "Your description here"
git push origin main
```

---

## 7. How to Write and Publish a Blog Post

All blog posts live in one file: `src/lib/posts.ts`

### Step 1 — Open the file

Open `src/lib/posts.ts` in your text editor.

You will see an array (a list) called `posts`. Each blog post is one entry in that list, surrounded by `{` and `}`.

### Step 2 — Add a new post

Copy this template and paste it BEFORE the closing `];` at the end of the array. Make sure there is a comma after the previous post's closing `}`:

```typescript
{
  id: 4,                                    // Next number in sequence
  slug: "your-post-url-slug",              // URL-friendly title (no spaces, use hyphens)
  title: "Your Full Post Title Here",
  date: "Mar 15, 2026",                    // Publication date
  category: "Operational Meteorology",     // Pick one category
  author: {
    name: "Marston Ward",
    title: "Founder & Chief Meteorologist, Aetheris Vision",
    initials: "MW",
  },
  summary: "One sentence that describes what this post is about.",
  readTime: "5 min read",
  content: `
Your post content goes here.

## Section Heading

Use ## for section headings.

Use **bold** for important terms.

Use *italics* for emphasis.

Regular paragraphs are just plain text with a blank line between them.
  `.trim(),
},
```

### Formatting rules for content

| What you type | What it looks like |
|---|---|
| `## Heading` | Large section heading |
| `### Subheading` | Smaller subheading |
| `**bold text**` | **bold text** |
| `*italic text*` | *italic text* |
| `` `code` `` | `code` |
| blank line between paragraphs | new paragraph |
| `> quoted text` | blockquote |

### Available categories

- `"AI / ML Integration"`
- `"Operational Meteorology"`
- `"Contracting"`
- `"Defense Systems"`

### Step 3 — Publish it

```bash
git add src/lib/posts.ts
git commit -m "Add [post title] blog post"
git push origin main
```

The post will appear live at `aetherisvision.com/blog/your-post-url-slug` within 2 minutes.

---

## 8. All Environment Variables — What They Are and Where to Get Them

An **environment variable** is a secret value that your code needs to work, but that should NOT be stored in the code itself (because the code is public on GitHub). Think of it like a password that lives separately from the code.

They live in two places:
- **Locally:** in a file called `.env.local` (on your Mac, never uploaded to GitHub)
- **In production:** in Vercel's dashboard under Settings → Environment Variables

### Complete list

#### ANTHROPIC_API_KEY
- **What it does:** Authenticates requests to the Claude API that powers the AI chat assistant.
- **How to get it:** Log into console.anthropic.com → API Keys → Create new key
- **Format:** Starts with `sk-ant-...`
- **Where to put it:** Vercel → Settings → Environment Variables → `ANTHROPIC_API_KEY`
- **Security:** This is a secret key — never put it in code or commit it to GitHub. Server-side only (no `NEXT_PUBLIC_` prefix).
- **Future:** Move to the Aetheris Vision business Anthropic account when created.

#### PREVIEW_PASSWORD
- **What it does:** Password-protects the site before it goes public. Anyone trying to visit aetherisvision.com must enter this password.
- **Default value:** `marston-av` (built into the code — no env var needed unless you want to change it)
- **How to change it:** Add `PREVIEW_PASSWORD=your-new-password` to Vercel env vars
- **At go-live:** Remove this env var entirely AND remove the auth check from `src/middleware.ts`

#### NEXT_PUBLIC_FORMSPREE_ID
- **What it does:** The ID of your Formspree form. The contact form uses this to know where to send submissions.
- **How to get it:**
  1. Log into formspree.io
  2. Click your form ("Aetheris Vision Contact")
  3. Look at the URL or the endpoint — it will say `https://formspree.io/f/xpwzabcd`
  4. The ID is the last part: `xpwzabcd`
- **Format:** 8-character alphanumeric string, e.g. `xpwzabcd`
- **Where to put it:** Vercel → Settings → Environment Variables → `NEXT_PUBLIC_FORMSPREE_ID`

#### NEXT_PUBLIC_GISCUS_REPO
- **What it does:** The GitHub repository where blog comments are stored.
- **Value:** `marstonsward/aetheris-vision-website`
- **Where to get it:** It's just your GitHub username + repo name.

#### NEXT_PUBLIC_GISCUS_REPO_ID
- **What it does:** GitHub's internal numeric ID for your repo (needed by Giscus API).
- **Value:** `R_kgDORa6Fzg`
- **Where to get it:** Generated at giscus.app when you configure it.

#### NEXT_PUBLIC_GISCUS_CATEGORY
- **What it does:** The GitHub Discussions category where comments are filed.
- **Value:** `Announcements`
- **Where to get it:** You chose this at giscus.app. Must match an actual category in your repo's Discussions.

#### NEXT_PUBLIC_GISCUS_CATEGORY_ID
- **What it does:** GitHub's internal ID for the Announcements category.
- **Value:** `DIC_kwDORa6Fzs4C3gQg`
- **Where to get it:** Generated at giscus.app when you configure it.

### What "NEXT_PUBLIC_" means

Any variable starting with `NEXT_PUBLIC_` is visible in the browser to anyone who looks at the page source. This is fine for Giscus and Formspree IDs — they are not secret. Variables WITHOUT that prefix (like `PREVIEW_PASSWORD`) only exist on the server and are never visible to visitors.

### How to add an environment variable to Vercel

1. Go to vercel.com → your project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Enter the name (e.g. `NEXT_PUBLIC_FORMSPREE_ID`) and value
4. Select **Production** (and optionally Preview and Development)
5. Click **Save**
6. **Important:** You must redeploy for the new variable to take effect. Go to the **Deployments** tab → click the three dots on the latest deployment → **Redeploy**

---

## 9. Every Service Used — What It Does and Why

### Next.js (the framework)
- **What it is:** The software framework that the website is built on. Think of it as the engine.
- **Why it was chosen:** It handles routing (different pages for different URLs), server-side code (like the contact form API), and automatic performance optimization.
- **Version:** 16.1.6
- **You don't interact with this directly.** It runs when you run `npm run dev` or when Vercel builds.

### React (the UI library)
- **What it is:** The tool used to build the visual components (Navbar, Footer, buttons, etc.).
- **Why:** Standard in the industry. Components can be reused across pages.
- **Version:** 19

### TypeScript (the language)
- **What it is:** The programming language everything is written in. It's JavaScript with type checking — it catches mistakes before they become bugs.
- **Why:** Catches errors at write time rather than when users hit them.

### Tailwind CSS (styling)
- **What it is:** A CSS framework that lets you style things using short class names in the HTML rather than writing separate CSS files.
- **Example:** `className="text-white bg-black p-4"` means white text, black background, padding of 4 units.
- **Version:** 4

### GitHub (code storage)
- **What it is:** A website that stores your code in "repositories" (folders) in the cloud.
- **Why:** Free, industry standard, required by Vercel for auto-deploy. Also stores blog comments via Discussions.
- **Your repo:** github.com/marstonsward/aetheris-vision-website
- **Branch:** `main` (the live branch — pushes here trigger deploys)

### Vercel (hosting)
- **What it is:** The service that takes your code from GitHub, builds it, and serves it to visitors worldwide.
- **Why:** Free tier for small sites, automatic HTTPS, automatic deploys on push, built-in CDN (fast loading globally), supports Next.js natively.
- **Project name:** `aetheris-vision-website`
- **Dashboard:** vercel.com → log in via GitHub
- **How it works:** Every time you push to the `main` branch on GitHub, Vercel automatically builds and deploys within 1-2 minutes.

### Cloudflare (DNS)
- **What it is:** Manages the "phone book" that points `aetherisvision.com` to Vercel's servers.
- **Why:** Fast, free DNS. Also provides DDoS protection.
- **What you manage here:** DNS records (the A record and CNAME that point the domain to Vercel).
- **You rarely need to go here** unless changing where the domain points.

### Formspree (contact form email delivery)
- **What it is:** A service that receives contact form submissions and emails them to you.
- **Why:** Sending email directly from code requires a complex email server setup. Formspree handles all of that.
- **How it works:** Your contact form sends data to Formspree's servers → Formspree emails it to `contact@aetherisvision.com`
- **Free tier:** 50 submissions/month. Upgrade if you need more.
- **Dashboard:** formspree.io
- **Important:** The form submission is proxied through your own server (`/api/contact`) so ad-blockers cannot block it.

### Cal.com (booking)
- **What it is:** An open-source calendar and booking service.
- **Why:** Free, privacy-friendly alternative to Calendly. Embeds directly in your page.
- **Setup:** Username is `aetherisvision`, event slug is `30min`
- **Dashboard:** app.cal.com
- **Where configured in code:** `src/components/CalBooking.tsx`

### Giscus (blog comments)
- **What it is:** A comments system that uses GitHub Discussions as its database.
- **Why:** Free, no spam bots (requires GitHub login), no separate database, you own all the data.
- **How it works:** Each blog post URL maps to a GitHub Discussion thread. Comments appear on both your site and in GitHub.
- **Setup requires:**
  1. The repo must be public on GitHub
  2. GitHub Discussions must be enabled on the repo
  3. The Giscus GitHub App must be installed on the repo
  4. 4 environment variables set in Vercel (see Section 8)
- **Moderation:** Log into GitHub → your repo → Discussions tab → you can delete or hide comments there

### Google Workspace (email)
- **What it is:** Google's business email service.
- **Your account:** One paid seat (marston's personal account)
- **Aliases set up:** `contact@aetherisvision.com` and `info@aetherisvision.com` — these are free aliases that forward to the main account. You don't pay extra for aliases.
- **DNS:** MX records in Cloudflare point `aetherisvision.com` email to Google's servers.

---

## 10. DNS and Domain — How the Website Gets Its Address

**DNS** (Domain Name System) is the internet's phone book. When someone types `aetherisvision.com`, DNS tells their browser which server to connect to.

### Your DNS is managed by Cloudflare

The nameservers for `aetherisvision.com` are:
- `zara.ns.cloudflare.com`
- `razvan.ns.cloudflare.com`

This means Cloudflare controls all DNS records for the domain.

### Key DNS records

| Record type | Name | Points to | Purpose |
|---|---|---|---|
| A or CNAME | `@` | Vercel's IP | Website |
| CNAME | `www` | Vercel | www redirect |
| MX | `@` | Google mail servers | Email |
| TXT | `@` | Google verification string | Proves email ownership |

### To check DNS is working

In your terminal:
```bash
dig aetherisvision.com +short          # Should show Vercel's IP
dig MX aetherisvision.com +short       # Should show Google mail servers
dig NS aetherisvision.com +short       # Should show Cloudflare nameservers
```

### How the domain is connected to Vercel

1. In Vercel dashboard → your project → **Settings** → **Domains**
2. `aetherisvision.com` is listed there
3. Vercel gives you a DNS record to set in Cloudflare
4. Once set, visitors who type `aetherisvision.com` are routed to Vercel's servers

---

## 11. Email Setup — How contact@aetherisvision.com Works

### How email works at Aetheris Vision

- **Main account:** Marston's Google Workspace account (one paid seat)
- **Aliases:** `contact@aetherisvision.com` and `info@aetherisvision.com` are free aliases — emails sent to them arrive in the main inbox
- **Sending as contact@:** In Gmail settings, you can reply FROM `contact@aetherisvision.com` even though you're logged into your main account. This is called "Send mail as."

### To set up "Send mail as" in Gmail

1. Open Gmail → click the gear icon → **See all settings**
2. Go to the **Accounts and Import** tab
3. Under "Send mail as" → click **Add another email address**
4. Enter: Name = `Aetheris Vision`, Email = `contact@aetherisvision.com`
5. Check "Treat as alias"
6. Click **Next Step** → **Send Verification**
7. Check your inbox for the verification email → click the link
8. Now when composing email, you can select which address to send from

### How the contact form emails work

1. Visitor fills out the form at `/contact`
2. Browser sends data to `aetherisvision.com/api/contact` (your Vercel server)
3. Vercel server forwards it to `formspree.io/f/[YOUR_FORM_ID]`
4. Formspree emails the submission to `contact@aetherisvision.com`
5. You receive it in Gmail

The form is routed through your own server (not directly to Formspree from the visitor's browser) so that ad-blockers cannot intercept or block it.

---

## 12. Security — What's Protected and How

### Preview password protection

**File:** `src/middleware.ts`

Before the site goes live, every page is password protected. When a visitor goes to any page, the server checks for a password before showing anything. The default password is `marston-av`.

**How to enter it:** When the browser shows a login popup, leave the username blank and type the password.

**At go-live:** Remove the auth check from `src/middleware.ts` and remove the `PREVIEW_PASSWORD` env var from Vercel.

### HTTP Security Headers

These are instructions sent with every page that tell the visitor's browser how to behave securely.

| Header | Plain English meaning |
|---|---|
| `Strict-Transport-Security` | "Always use HTTPS, never HTTP, for 2 years" |
| `X-Content-Type-Options` | "Don't try to guess what type a file is — trust what I say it is" |
| `X-Frame-Options` | "Don't let other websites embed this site in a frame (prevents clickjacking)" |
| `Referrer-Policy` | "When leaving this site, don't tell the next site where the visitor came from" |
| `Permissions-Policy` | "This site does not use the camera, microphone, or location" |
| `Content-Security-Policy` | "Only load scripts and resources from these specific trusted sources" |

**Where set:** Static headers in `next.config.ts`. The Content Security Policy (CSP) is set dynamically in `src/middleware.ts`.

### Content Security Policy (CSP) — nonce system

The CSP is the most complex security feature. Here's how it works:

- Every time a page loads, the server generates a **nonce** — a random one-time code, like `aB3xK9`
- The CSP says "only execute scripts that have this nonce"
- All legitimate scripts have the nonce. Injected malicious scripts don't know the nonce and cannot run.
- The nonce is different on every page load, so it cannot be predicted or reused.

**Trusted script sources:** your own domain, Giscus, Cal.com.

---

## 13. Common Problems and How to Fix Them

### "My changes aren't showing up on the live site"

1. Make sure you pushed to GitHub: `git push origin main`
2. Check Vercel is building: go to vercel.com → your project → **Deployments** tab
3. If the deployment shows red (failed), click it to see the error log
4. If it's green but changes aren't visible, hard refresh your browser: `Cmd+Shift+R`

### "The contact form shows an error"

1. Check that `NEXT_PUBLIC_FORMSPREE_ID` is set in Vercel (Settings → Environment Variables)
2. Make sure the value is ONLY the short ID (like `xpwzabcd`) — not the full URL
3. Check formspree.io that your form is Active (not "awaiting confirmation")
4. After changing env vars, you must redeploy: Vercel → Deployments → Redeploy

### "The blog comments section is not showing"

1. All 4 GISCUS env vars must be set in Vercel
2. The GitHub repo must be public (github.com → Settings → scroll to Danger Zone)
3. GitHub Discussions must be enabled (repo → Settings → Features → Discussions)
4. The Giscus GitHub App must be installed: github.com/apps/giscus
5. After setting env vars, redeploy

### "The booking calendar is not loading"

1. Check that the Cal.com account `aetherisvision` is active at app.cal.com
2. Make sure the event slug `30min` exists on that account
3. If Cal.com is down, the page shows a fallback email link

### "npm run dev gives an error"

1. Make sure you have Node.js 20: `node --version` (should show v20.x.x)
2. Make sure you ran `npm install` after cloning
3. Make sure `.env.local` exists (copy from `.env.example`)
4. If you see "missing env variable" errors, check Section 8

### "git push says permission denied"

1. You need to be authenticated with GitHub
2. Run: `gh auth login` (if GitHub CLI is installed)
3. Or set up SSH keys: follow github.com/settings/keys

### "Vercel build failed"

1. Go to Vercel → your project → Deployments → click the failed deployment → read the log
2. Most common cause: a missing environment variable. Check Section 8.
3. Another common cause: a TypeScript error. The error log will show the file and line number.

### "The site shows a password prompt I can't get past"

The password is `marston-av`. Enter it in the password field (leave username blank). If you've changed `PREVIEW_PASSWORD` in Vercel, use that new value instead.

### "I accidentally deleted a file"

Git keeps a full history. To recover a deleted file:
```bash
git log --diff-filter=D --summary   # Find which commit deleted it
git checkout [commit-hash]^ -- path/to/file   # Restore it
```

---

## 14. Go-Live Checklist

When you're ready to make the site publicly accessible, do these things in order:

### Before removing password protection

- [ ] Test every page manually: `/`, `/about`, `/capabilities`, `/blog`, `/blog/[each-post]`, `/book`, `/contact`
- [ ] Submit the contact form and confirm you receive the email
- [ ] Book a test appointment on `/book` and confirm it appears in Cal.com
- [ ] Verify Giscus comments show on a blog post
- [ ] Check the site on mobile (resize browser or use Chrome DevTools)
- [ ] Run `npm audit` in the terminal to check for security issues in dependencies

### Remove preview password

1. Open `src/middleware.ts`
2. Delete the entire auth check section (lines that check for `authorization` header and return 401)
3. Keep the nonce/CSP generation code
4. Remove `PREVIEW_PASSWORD` from Vercel environment variables
5. Deploy

### After going live

- [ ] Visit `aetherisvision.com` without any password prompt
- [ ] Submit the sitemap to Google Search Console: search.google.com/search-console
  - Add property → enter `aetherisvision.com` → verify ownership
  - Sitemaps section → enter `sitemap.xml` → Submit
- [ ] Check security headers at securityheaders.com — should score A or A+
- [ ] Submit for HSTS preload at hstspreload.org (optional but recommended)

### SEO metadata (deferred — do when live)

Each page can have custom title, description, and Open Graph (social share) metadata. Currently only the default metadata in `src/app/layout.tsx` is set.

To add metadata to a specific page, add this to the top of the page file:
```typescript
export const metadata = {
  title: "About Aetheris Vision | Marston Ward",
  description: "35 years of operational meteorology...",
  openGraph: {
    title: "About Aetheris Vision",
    description: "...",
    url: "https://aetherisvision.com/about",
  },
};
```

---

## 15. Maintenance — Keeping It Running

### Routine tasks

**Monthly:**
- Check formspree.io submission count (free tier: 50/month). Upgrade if needed.
- Review any GitHub Discussions (blog comments) that need moderation.
- Check Vercel dashboard for any deployment errors.

**When adding a blog post:**
- Follow Section 7. That's all you need.

**When updating dependencies (software packages):**
```bash
npm audit                    # Check for security issues
npm update                   # Update packages within safe version ranges
npm audit fix                # Auto-fix low-risk vulnerabilities
git add package*.json
git commit -m "Update dependencies"
git push origin main
```

**Quarterly:**
- Test contact form end-to-end
- Test Cal.com booking
- Verify the site still scores A on securityheaders.com

### What NOT to do

- **Never edit files in `node_modules/`** — this folder is auto-generated and not saved in Git
- **Never put real passwords or API keys in code files** — use environment variables
- **Never force-push to main** (`git push --force`) — this rewrites history and can break things
- **Never delete `.gitignore`** — this file prevents secrets from being uploaded to GitHub

### Backup strategy

Your entire codebase is backed up on GitHub. Every commit is a restore point. If something breaks:

```bash
git log --oneline               # See all past commits
git revert [commit-hash]        # Undo a specific commit safely
```

Or go to github.com → your repo → **Commits** → browse history visually.

---

*End of manual. Last commit at time of writing: `3dc5980`. Repository: github.com/marstonsward/aetheris-vision-website*
