# How to Build the Website, Email, and Domain Setup from Scratch

**Imagine this document as your map.** If you ever need to set up the Aetheris Vision website, domain, and email system again — from zero — this guide will walk you through exactly what to do. You do not need to be a computer expert to follow this.

**What does this guide cover?** Everything from buying a domain name to getting your website live on the internet with a working email system. It's divided into steps, and each step explains **what** you're doing, **why** you're doing it, and **how** to do it.

---

## 1. Buying the Domain Name

**What is a domain name?** It's the address people type into their browser to find your website — like `aetherisvision.com`. Think of it like a street address for a building. Without one, no one can find you.

**Why do you buy it from a registrar?** Domain names are controlled by a global system. "Registrars" like Namecheap and GoDaddy are licensed sellers — like a real estate agent for web addresses.

The first step is actually owning the name `aetherisvision.com`.

1. Go to a domain registrar like **Namecheap** or **GoDaddy**.
2. Search for `aetherisvision.com` and buy it.
3. Don't worry about setting up special hosting or email with them; you just need to own the name.

## 2. Connecting the Domain to Cloudflare (The Traffic Cop)

**What is Cloudflare?** A service that sits between your website and the internet. Every visitor goes through Cloudflare first.

**Why do we use it?** Three reasons:
1. **Speed** — Cloudflare caches (saves copies of) your website in data centers around the world, so visitors load it from the nearest location instead of one far-away server.
2. **Security** — It blocks hackers, bots, and DDoS attacks (when someone tries to overwhelm your website with fake traffic).
3. **DNS management** — DNS (Domain Name System) is the phone book of the internet. It translates `aetherisvision.com` into the actual computer address where the website lives. Cloudflare makes managing these records easy.

**How to set it up:**

1. Go to **Cloudflare.com** and create a free account.
2. Click "Add a Site" and type in `aetherisvision.com`.
3. Select the "Free Plan" at the bottom.
4. Cloudflare will give you two "Nameservers" (they look like `josh.ns.cloudflare.com`).
5. Go back to where you bought your domain (Namecheap/GoDaddy). Find the "DNS Settings" or "Nameservers" section, and paste the two Cloudflare nameservers there.
6. Now Cloudflare is officially in charge of your domain!

## 3. Setting Up Google Workspace Emails (contact@aetherisvision.com)

**What is Google Workspace?** It's Google's business email service. Instead of using a free `@gmail.com` address, you get a professional email like `contact@aetherisvision.com` — but it works just like Gmail (same inbox, same app, same calendar).

**Why do you need a professional email?** Would you trust a company that emails you from `aetherisvision_joe@gmail.com`? A custom domain email (`contact@aetherisvision.com`) looks legitimate and builds trust with potential clients.

To get a professional email address, you use Google Workspace. 

1. Go to **workspace.google.com** and sign up.
2. Tell them you own `aetherisvision.com`.
3. Set your primary email (like `mward@...` or `contact@...`).
4. Google will ask you to prove you own the domain by giving you a "TXT Record."
5. Log into **Cloudflare**, go to "DNS", and add that TXT Record. 
6. Google will verify it.

### Getting Emails to Actually Deliver (MX Records)

**What are MX records?** MX stands for "Mail Exchange." These are DNS records that tell the internet "when someone sends an email to @aetherisvision.com, deliver it to Google's mail servers." Without them, emails sent to you would have nowhere to go.

**How to set them up:**
1. In Cloudflare, go to DNS -> Add Record.
2. Choose the type **MX**.
3. Google requires you to add 5 of these MX records (like `aspmx.l.google.com`). They will provide you the exact list. Add all 5 to Cloudflare. Now your inbox can receive mail!

### Making Sure Your Emails Don't Go to Spam

**Why do you need to worry about spam?** When you send email from a custom domain (not @gmail.com), other email servers (Yahoo, Microsoft, etc.) are suspicious. They think: "I've never heard of this domain — is it a spammer?" You have to prove you're legitimate by adding three special DNS records. Think of them as letters of recommendation.

Because you are sending from a custom domain, you have to prove to other email servers (like Yahoo or Microsoft) that you aren't a spammer. You do this with three records:

**A. SPF Record (The Bouncer)**
1. In Cloudflare DNS, add a **TXT Record**.
2. Name: `@`
3. Content: `v=spf1 include:_spf.google.com ~all`
*(This tells the world: "Only Google is allowed to send emails on my behalf.")*

**B. DKIM Record (The Wax Seal)**
1. Log into your Google Admin Console.
2. Search for "DKIM" and click **Authenticate Email**.
3. Generate a new key. It will be a massive block of random text.
4. In Cloudflare DNS, add a **TXT Record**.
5. Name: `google._domainkey`
6. Paste that massive text block exactly as it is (make sure you keep the spaces!).
7. Go back to Google Admin and click "Start Authentication."

**C. DMARC Record (The Rulebook)**
1. In Cloudflare DNS, add a **TXT Record**.
2. Name: `_dmarc`
3. Content: `v=DMARC1; p=none; rua=mailto:your_email@aetherisvision.com`

---

## 4. Deploying the Website

The website code lives in a folder called `website` on your computer. We use **Vercel** to put it on the internet for free.

1. Make sure you have the website code on your computer (cloned from GitHub — see Section 7 below).
2. Install **fnm** (Fast Node Manager) — this ensures you always use the correct version of Node.js:
   ```bash
   curl -fsSL https://fnm.vercel.app/install | bash
   ```
3. Open your computer's Terminal (the black typing box).
4. Navigate into the website folder:
   ```bash
   cd path/to/website
   ```
5. Activate the correct Node.js version (the project has a `.node-version` file that tells fnm which version to use):
   ```bash
   fnm use
   ```
6. Create your environment file. Copy the example and fill in your values:
   ```bash
   cp .env.example .env.local
   ```
   You need two values:
   - `RESEND_API_KEY` — your Resend API key (powers the contact form and transactional email)
   - `PREVIEW_PASSWORD` — a password for Vercel preview deployments
7. Install the required tools:
   ```bash
   npm install
   ```
8. Install the Vercel tool:
   ```bash
   npm install -g vercel
   ```
9. Tell Vercel to put it online!
   ```bash
   vercel
   ```
10. Follow the prompts. It will give you a temporary link (like `aetheris-vision.vercel.app`).

---

## 5. Connecting the Website to Your Domain

**What this step does:** Right now, your website lives at a Vercel address (like `aetheris-vision.vercel.app`). This step tells Cloudflare "when someone types `aetherisvision.com`, send them to the Vercel server." It's like putting a sign on the highway that points to your building.

Now we need the traffic cop (Cloudflare) to point people to your Vercel website.

1. Log into your **Vercel** dashboard.
2. Go to your project settings -> Domains.
3. Type in `aetherisvision.com`.
4. Vercel will say "Add this A Record to your DNS." It will give you an IP address (like `76.76.21.21`).
5. Go to **Cloudflare** -> DNS.
6. Add an **A Record**.
   * Name: `@`
   * Target: The IP address Vercel gave you.
   * Turn the orange cloud on.

**Congratulations!** 
If you type `aetherisvision.com` into your browser, it will now load your website securely, and your custom Google Workspace emails will work without going to the spam folder.

---

## 6. How to Test that Everything Works

**Why test?** Because things can break silently. An email might go to spam, a DNS record might be wrong, or a deployment might have failed. This diagnostic script checks everything automatically so you don't have to manually verify each piece.

If you ever think something is broken, we wrote a script that checks everything automatically!

1. Open your Terminal.
2. Navigate to your website folder.
3. Run the diagnostic tool:
   ```bash
   ./scripts/diagnostics.sh
   ```
4. It will print out a list with green checkmarks (✅) if things are happy, or warning signs (⚠️) if something is missing.

---

## 7. Source Code & Backups (GitHub + GitLab)

**What is source code?** The actual text files that make up your website — the TypeScript, CSS, configuration files. It's the "recipe" that the computer follows to build the site.

**What are GitHub and GitLab?** They're online services that store your code and track every change ever made (like Google Docs version history, but for code).

**Why two copies?** The same reason you keep an extra set of keys — if one service goes down, you still have your code. GitHub is our primary copy; GitLab is our backup.

The website code is stored in **two** places for safety:

- **GitHub** (primary): `github.com/marstonsward/aetheris-vision-website`
- **GitLab** (backup): `gitlab.com/aetheris-vision-group/aetheris-vision-project`

### Cloning the Code for the First Time
```bash
git clone git@github.com:marstonsward/aetheris-vision-website.git website
cd website
```

### Adding the GitLab Backup Remote
```bash
git remote add backup git@gitlab.com:aetheris-vision-group/aetheris-vision-project.git
```

### Pushing Changes to Both
After you make changes and commit them:
```bash
git push origin main      # Push to GitHub
git push backup main      # Push to GitLab backup
```

There is also a backup script at `scripts/backup.sh` you can run to automate this.

---

## 8. Running the Full Test Suite

**What is a test suite?** A collection of automated checks that verify the website works correctly. Think of it like a car inspection — before you drive (deploy), you check the brakes, lights, and engine.

**Why run tests before deploying?** Because a bug on a live website is visible to everyone. Running tests catches mistakes before they reach real users.

Before deploying changes, verify everything works:

```bash
npm test          # Run all 82+ tests
npm run ci        # Full CI check: lint + test + build
```

If you see all green, your changes are safe to push.

---

## 9. What's Next? (Extending the Platform)

If you want to add features like client portals, payment processing, subscriptions, or CRM integrations, read the **ATBD.md** file in the root of this project. It walks through every step with code examples and cost breakdowns. 
