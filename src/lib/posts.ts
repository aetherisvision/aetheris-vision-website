export type Author = {
  name: string;
  title: string;
  initials: string;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  readTime: string;
  content: string;
  featured?: boolean;
  author: Author;
};

export const posts: Post[] = [
  {
    id: 1,
    slug: "ai-in-operational-meteorology",
    title: "The Future of AI in Operational Meteorology",
    date: "Feb 28, 2026",
    category: "AI / ML Integration",
    featured: true,
    author: {
      name: "Marston Ward",
      title: "Founder & Chief Meteorologist, Aetheris Vision",
      initials: "MW",
    },
    summary:
      "How deep-learning models are transforming raw satellite data into actionable mission-critical insights faster than traditional numerical weather prediction (NWP) models.",
    readTime: "5 min read",
    content: `
For decades, Numerical Weather Prediction (NWP) has been the gold standard in operational meteorology. Atmospheric models like the GFS, ECMWF, and NAM have served forecasters well — but they carry a fundamental constraint: they are governed by equations of physics that require enormous computational resources and significant lead time to run.

Enter deep learning.

## The Shift to Data-Driven Forecasting

Models like Google DeepMind's GraphCast and Huawei's Pangu-Weather have demonstrated that transformer-based neural networks can produce skillful global forecasts at 0.25° resolution in under a minute — compared to hours for traditional NWP. This isn't a marginal improvement. It's a paradigm shift.

For defense and government applications, the implications are profound. Tactical field commanders don't have hours to wait for a model update. A rapid ingestion pipeline that takes raw satellite imagery and radar composites and outputs a 24-hour high-resolution probability forecast can change the calculus on mission timing, route planning, and hazard avoidance.

## Operational Constraints in High-Consequence Environments

Traditional NWP performs reasonably well under standard atmospheric conditions. It struggles in edge cases: rapid cyclogenesis, mesoscale convective organization, Arctic boundary layer inversions, and complex terrain interactions. These are precisely the environments where military and government operations frequently occur.

AI/ML models, trained on decades of global reanalysis data (ERA5, MERRA-2), learn statistical patterns that physics-based models miss. Ensemble approaches — running hundreds of perturbed initial conditions through a lightweight neural network — can quantify uncertainty in minutes rather than hours.

## Integration with Existing Infrastructure

At Aetheris Vision, we focus on where AI augments rather than replaces the operational forecaster. A human meteorologist with 35 years of experience reading synoptic patterns brings irreplaceable judgment. What we provide is a system that surfaces the 5% of cases where the models diverge most significantly — the high-uncertainty, high-consequence moments where that judgment matters most.

Integration pipelines built on Python, PyTorch, and cloud-native infrastructure (AWS GovCloud, Azure Government) allow agencies to ingest AI-derived products alongside traditional NWP guidance with minimal operational disruption.

## The Path Forward

The next 5 years will see AI-native weather prediction become the baseline expectation for high-tempo operations. Agencies that invest in the data pipelines, workforce training, and model validation frameworks now will have a decisive advantage. Those that wait will be adopting technology under pressure rather than on their terms.

Aetheris Vision is positioned to help government and defense clients navigate that transition — from architecture assessment through operational deployment.
    `.trim(),
  },
  {
    id: 2,
    slug: "8a-vosb-defense-contracts",
    title: "Navigating 8(a) and VOSB Pathways for Defense Contracts",
    date: "Jan 15, 2026",
    category: "Contracting",
    author: {
      name: "Marston Ward",
      title: "Founder & Chief Meteorologist, Aetheris Vision",
      initials: "MW",
    },
    summary:
      "A strategic overview of how state and federal agencies can leverage Veteran-Owned Small Business (VOSB) statuses to streamline tech procurement and architecture advisement.",
    readTime: "4 min read",
    content: `
The federal procurement landscape is vast, and for agencies seeking specialized technical consulting — particularly in niche domains like atmospheric modeling, AI integration, and defense systems — knowing how to structure an acquisition is as important as knowing what to acquire.

## Understanding VOSB and 8(a) Mechanisms

**Veteran-Owned Small Business (VOSB)** status provides set-aside and sole-source contracting authority under the Veterans First Contracting Program (38 U.S.C. § 8127). For acquisitions below the simplified acquisition threshold, a contracting officer can award directly to a VOSB without competition. Above that threshold, set-aside competitions among VOSBs allow agencies to meet both mission needs and socioeconomic contracting goals simultaneously.

**8(a) Business Development Program** eligibility — administered by the SBA — opens a separate channel entirely. Sole-source awards up to $4.5M (services) are available without competitive requirements. For agencies with urgent technical needs or specialized requirements that the open market cannot easily address, this is a powerful tool.

## Where Technical Consulting Fits

Many program offices default to large integrators for technical consulting because they're already on existing contract vehicles. This often results in overpaying for generalist support when what the mission requires is deep domain expertise. A small business with a narrow, credentialed specialization — 35 years of operational meteorology, prior DoD Secret clearance, demonstrated AI/ML capability — can deliver superior outcomes at a fraction of the cost through the right contracting mechanism.

## Practical Pathways for Contracting Officers

1. **Market research first**: Identify existing contract vehicles (GSA MAS, SEWP, SeaPort-NxG) where your target small business is registered.
2. **Validate socioeconomic status**: Confirm VOSB/SDVOSB certifications in SAM.gov and the SBA's VetCert database.
3. **Scope for set-aside**: If requirements can be scoped to a defined Statement of Work rather than an IDIQ, a simplified acquisition set-aside is faster and carries less administrative overhead.
4. **Document the justification**: For sole-source awards, the J&A (Justification and Approval) should reference unique technical qualifications and the urgency or specialized nature of the requirement.

## Aetheris Vision's Contracting Profile

We maintain active SAM.gov registration, VOSB certification, and are actively pursuing 8(a) pathway readiness. Our capabilities statement is available on request. For state agencies operating under state procurement code equivalents, we can work through cooperative purchasing vehicles or direct procurement depending on dollar threshold.

The goal is to remove friction from access to specialized expertise. The contracting mechanism should serve the mission — not the other way around.
    `.trim(),
  },
  {
    id: 3,
    slug: "richardson-turbulence-atmospheric-prediction",
    title: "Big Whorls Have Little Whorls: Turbulence and the Limits of Prediction",
    date: "Mar 1, 2026",
    category: "Operational Meteorology",
    author: {
      name: "Marston Ward",
      title: "Founder & Chief Meteorologist, Aetheris Vision",
      initials: "MW",
    },
    summary:
      "Lewis Fry Richardson's 1922 rhyme on energy cascades is still the most honest summary of atmospheric turbulence — and a reminder of why predicting it remains one of the hardest problems in applied meteorology.",
    readTime: "5 min read",
    content: `
> *Big whorls have little whorls*
> *That feed on their velocity,*
> *And little whorls have lesser whorls,*
> *And so on to viscosity.*
>
> — Lewis Fry Richardson, 1922

Richardson wrote that verse as a wry gloss on the Kolmogorov energy cascade — the process by which kinetic energy moves from large-scale atmospheric eddies down to molecular scales where it dissipates as heat. Over a century later, it remains the most accurate one-paragraph description of why turbulence is genuinely hard.

## Richardson's Forecast Factory

Richardson didn't just write poetry about the atmosphere. In 1922, he published *Weather Prediction by Numerical Process* — the first attempt to solve the equations of atmospheric motion by hand. His method was correct. His forecast was wrong by a factor of 200 in surface pressure tendency, mostly because he used unbalanced initial data.

He imagined a future "forecast factory": a spherical hall filled with 64,000 human computers, each solving a small section of the atmosphere in parallel, coordinated by a conductor at the center. The vision was absurd in 1922 and operational by 1955 when the first real NWP run executed on ENIAC. The forecast factory became a metaphor for numerical weather prediction itself.

What Richardson couldn't solve — and what remains unsolved in a strict sense — is turbulence.

## Why Turbulence Resists Prediction

Turbulence is not random. It is deterministic chaos: governed by the Navier-Stokes equations, sensitive to initial conditions, and computationally intractable at operationally relevant scales. The energy cascade Richardson described means that resolving turbulence accurately requires modeling structures orders of magnitude smaller than the grid cells of any practical forecast model.

The Richardson number (Ri) — also his contribution — quantifies the ratio of buoyant suppression to wind shear in a stratified fluid:

Ri = (g/θ)(∂θ/∂z) / (∂u/∂z)²

When Ri drops below 0.25, shear-driven turbulence becomes possible. This single dimensionless number underpins every aircraft turbulence forecast, every boundary layer parameterization, and every assessment of low-level wind shear for launch operations. It is elegant and it is limited — because it captures the onset condition, not the intensity, duration, or spatial structure of the turbulence that follows.

## The Operational Consequence

For defense aviation, clear-air turbulence (CAT) is a persistent threat at cruise altitudes where there are no visual cues and no radar return. CAT forms at jet stream boundaries, near mountain wave breaking, and in regions of strong upper-level divergence — often with minimal warning time.

Current operational tools — GTG (Graphical Turbulence Guidance), PIREP-based nowcasts, and ensemble spread diagnostics — do a reasonable job of identifying broad hazard regions but struggle with the fine-scale intensity structure that determines whether an encounter is uncomfortable or structurally significant. The verification statistics are honest about this. Probability of detection for moderate-or-greater turbulence hovers around 60–70% depending on altitude band and season.

For low-altitude rotary-wing operations — the regime most relevant to special operations and maritime support missions — boundary layer turbulence over complex terrain is even less well-predicted. Valley drainage flows, thermally-driven slope winds, and rotor zones behind ridgelines create hazard environments that no current operational model resolves adequately.

## Where AI Adds Skill — and Where It Doesn't

Machine learning approaches to turbulence prediction have shown genuine skill improvements over diagnostic algorithms in post-analysis settings. Neural networks trained on aircraft in-situ data (IAGOS, ACARS) and matched to model fields can learn composite signatures that precede CAT encounters with higher sensitivity than single-index diagnostics.

The limitation is interpretability. When a model flags a turbulence region, an operational forecaster needs to understand why — to assess whether the diagnosis is physically plausible or a spurious pattern match. Black-box predictions in high-consequence environments require a human meteorologist in the loop who understands the underlying dynamics.

This is not an argument against AI. It is an argument for augmentation: ML-derived turbulence probability fields displayed alongside traditional model diagnostics, with the forecaster providing the judgment layer that no training set fully captures.

## Richardson's Unfinished Problem

Richardson's forecast factory eventually became ECMWF, GFS, and the global NWP enterprise. His turbulence rhyme became the Kolmogorov -5/3 power law, LES parameterization schemes, and a century of turbulence research that has taken the problem from intractable to merely very hard.

The practical limit is not computational power — it is the irreducible sensitivity of chaotic systems to initial conditions at scales we cannot observe. At some forecast horizon, for some atmospheric feature, prediction becomes climatology. Knowing where that boundary is, and communicating it honestly to mission planners, is the core professional obligation of an operational meteorologist.

Richardson understood this. His forecast factory was not a claim of perfect prediction. It was a framework for doing the best possible with the information available — systematically, reproducibly, and with explicit uncertainty.

That remains the standard.
    `.trim(),
  },
  {
    id: 4,
    slug: "why-businesses-need-custom-websites",
    title: "Why Small Businesses Need Custom Websites — Not Templates",
    date: "Mar 23, 2026",
    category: "Web Development",
    featured: false,
    author: {
      name: "Marston Ward",
      title: "Founder, Aetheris Vision LLC",
      initials: "MW",
    },
    summary:
      "A template gets you online. A custom site gets you business. Here's the practical difference — and why it matters more than most small business owners realize.",
    readTime: "4 min read",
    content: `
I spent 35 years building systems where failure was not an option. Weather forecasting for combat operations, atmospheric modeling for federal research missions, software pipelines for NASA satellite data. Every system had to work — not most of the time, not under ideal conditions, but reliably, every time.

When I started Aetheris Vision and began working with small businesses on their websites, I expected web projects to be simpler than what I'd built before. In some ways they are. In one critical way, they're not: most small business owners have no idea whether their website is actually working.

## The Template Problem

Website builders like Wix, Squarespace, and WordPress with premium themes made it easy to launch a site. That's genuinely valuable — the barrier to getting online dropped to zero. But "online" and "effective" are not the same thing.

Here's what typically happens with a template site:

**Performance.** Template platforms load dozens of plugins, scripts, and stylesheets that slow page load times. Google's Core Web Vitals data is unambiguous: every additional second of load time reduces conversions. A site built on modern infrastructure (Next.js, Vercel's edge network) loads in under a second. A bloated WordPress site routinely takes 4–6 seconds — on a good day.

**Mobile.** Over 60% of web traffic in 2026 is mobile. Template sites claim to be "mobile responsive," and technically they are. But there's a difference between a site that doesn't break on mobile and a site that's designed from the start for the way people actually use their phones. The difference shows up in whether someone calls you or bounces.

**Ownership.** When you build on a hosted platform, you don't own your site. You're renting space on their infrastructure, subject to their pricing changes, their feature decisions, and their company's future. A custom-built site can be exported, migrated, and handed off. You own the code.

**Fit.** A restaurant has different needs than a law firm, which has different needs than a trades contractor. Templates are built to be general enough for everyone — which means they're optimized for no one. A custom build starts with your customers, your conversion path, and your specific workflow.

## What "Custom" Actually Means

Custom doesn't mean more expensive for its own sake. It means the site is built around what your business actually needs instead of what a template happens to offer.

For a service business, that might mean:
- A booking flow that connects to your actual calendar
- A contact form that routes inquiries to the right person automatically
- A client-facing area where customers can view proposals or sign documents
- A site architecture built around how your customers actually find and evaluate you

None of those require a massive build. They require a developer who listens first and codes second.

## The Real Cost of "Free"

The real cost of a template site isn't the monthly fee. It's the leads you don't get because the site is slow, the customers you lose because the mobile experience is frustrating, and the time you spend fighting a platform that wasn't built for your specific situation.

A well-built custom site typically pays for itself within the first year through improved conversion and reduced maintenance overhead. That's not a sales pitch — it's math.

## What We Build at Aetheris Vision

We build custom websites and web applications for small businesses — Next.js, React, TypeScript, and WordPress, depending on what the project calls for. Every project is scoped, priced, and delivered with a fixed contract. No hourly surprises, no disappearing after launch.

If you're not sure whether your website is actually working for you, that's worth a conversation.

[Start a project →](/intake)
    `.trim(),
  },
  {
    id: 5,
    slug: "nextjs-react-vs-wordpress",
    title: "Next.js vs WordPress: An Honest Comparison for Small Business Owners",
    date: "Mar 23, 2026",
    category: "Web Development",
    featured: false,
    author: {
      name: "Marston Ward",
      title: "Founder, Aetheris Vision LLC",
      initials: "MW",
    },
    summary:
      "WordPress powers 43% of the web. Next.js powers some of the fastest sites on it. Here's what actually matters when choosing between them for your business.",
    readTime: "5 min read",
    content: `
WordPress powers 43% of the web. That's a remarkable number, and it's not an accident — WordPress democratized publishing and made it possible for anyone to get online without writing a line of code. That's a genuine achievement worth respecting.

But "powers 43% of the web" and "is the right choice for your business" are different claims. Here's what actually matters when you're making this decision.

## What WordPress Is Good At

WordPress is a content management system (CMS) at its core. It was built to publish articles. That origin shapes everything about it — the admin interface, the plugin ecosystem, the theming system, all of it is organized around creating and managing written content.

If you're running a blog, a news site, or a content-heavy publication, WordPress is a reasonable choice. The editor is approachable, the hosting is widely available, and there's a massive ecosystem of themes and plugins for common use cases.

## Where WordPress Shows Its Limits

The problems emerge when you push WordPress beyond its origin as a publishing platform.

**Performance.** A default WordPress installation is not fast. Every page request typically triggers a PHP process that queries a MySQL database, assembles HTML, and sends it to the browser — often with dozens of plugin hooks running along the way. Caching plugins mitigate this, but they're working against the architecture, not with it.

Next.js applications, by contrast, generate static HTML at build time for pages that don't need real-time data. A request for a static page is served from a CDN edge node in milliseconds — no database query, no PHP execution, no caching layer needed.

For any business where customers arrive on mobile — which is now the majority of web traffic globally — this difference is measurable and it directly affects whether people stay on your site.

**Security.** WordPress is the most-targeted CMS on the web, by a wide margin. Its popularity is the reason. Automated bots constantly scan for known plugin vulnerabilities, outdated core versions, and weak credentials. Most small business WordPress sites are not maintained with the rigor that security requires — updates get skipped, plugins go unmaintained, and eventually something breaks or gets compromised.

A Next.js application deployed on Vercel has a fundamentally smaller attack surface. There's no database directly exposed to the web, no plugin ecosystem with thousands of third-party code paths, no PHP interpreter to exploit.

**Customization ceiling.** WordPress themes and page builders like Elementor or Divi let you customize a lot — until you need something they don't support. Then you're either finding a plugin (adding complexity and potential security exposure) or hiring a PHP developer to extend core functionality in ways that may break on the next update.

With Next.js and React, the customization ceiling is essentially the web platform itself. If it's possible in a browser, it's buildable. Client portals, real-time data displays, custom booking flows, role-based access, API integrations — these are first-class patterns, not workarounds.

**Ownership and portability.** A WordPress site is meaningfully portable — the files and database can be moved between hosts. But in practice, migration is complex and disruptive, which is why many businesses stay locked into hosting providers they've outgrown.

A Next.js project is a standard Node.js application that runs anywhere Node runs. The code is yours. The deployment is a git push. Switching hosts is a configuration change.

## The Honest Trade-off

WordPress has a lower barrier to entry. If you need a simple informational site quickly and you want to manage the content yourself without touching code, WordPress is a legitimate option — provided you stay on top of updates and security.

Next.js requires a developer. You can't self-serve a Next.js site without technical knowledge. That's a real cost, and it's appropriate to acknowledge it.

What you get in exchange: a faster, more secure, more maintainable application that's built around your specific business needs rather than adapted from a general-purpose CMS. For businesses that treat their website as a sales and operations tool rather than a brochure, that trade-off typically favors custom development.

## What We Build and Why

At Aetheris Vision, we build both. Custom Next.js applications when the project calls for performance, complex integrations, or a client portal. WordPress when a client needs editorial control, a familiar admin interface, or a content-heavy site on a straightforward budget. The right tool depends on what you're building and how you'll use it.

What we don't do is default to one or the other without understanding the requirement first. That conversation starts with your goals — not our preferences.

If you're trying to decide which path is right for your organization, [we're happy to talk it through](/intake). No obligation — just a straight answer.
    `.trim(),
  },
  {
    id: 6,
    slug: "every-organization-needs-a-great-website",
    title: "Every Organization Needs a Great Website. Most Don't Have One.",
    date: "Mar 23, 2026",
    category: "Web Development",
    featured: false,
    author: {
      name: "Marston Ward",
      title: "Founder, Aetheris Vision LLC",
      initials: "MW",
    },
    summary:
      "It doesn't matter whether you run a restaurant, a law firm, a nonprofit, a government agency, or a solo consulting practice. Your website is doing a job whether you manage it or not.",
    readTime: "4 min read",
    content: `
Your website is working right now. The question is whether it's working *for* you or *against* you.

Every time someone hears your name — from a referral, a business card, a social post, a search result — the first thing they do is look you up. What they find in those first few seconds determines whether they contact you, hire you, donate to you, or move on. That's true for every type of organization, in every industry, in every country.

## The Organizations That Get This Wrong

It's not just small businesses that neglect their websites. The pattern is consistent across every sector:

**Restaurants** with menus that haven't been updated in two years. Phone numbers that go to voicemail. No online reservation system, even though every competitor has one. The food is excellent — the first impression isn't.

**Law firms and professional services** with sites that look like they were built in 2009. Dense walls of text, no clear call to action, no indication of what it actually feels like to work with them. They win clients despite their website, not because of it.

**Nonprofits** whose donation experience is so confusing that willing donors abandon it. Impact stories buried five clicks deep. A volunteer sign-up form that breaks on mobile.

**Trades and contractors** who rely entirely on word of mouth but have no way to capture the people who were referred to them and then searched their name — and found nothing worth trusting.

**Government agencies and public institutions** with accessibility failures, outdated information, and navigation that no one tested with a real user. The people who depend on these services most are often the ones least able to work around a broken web experience.

**Startups and early-stage companies** who launch with a placeholder site and then never update it because shipping the product feels more urgent — until they need to raise money or hire and the site undercuts everything else they've built.

The specifics differ. The problem is the same: the website exists, but it isn't doing any work.

## What a Great Website Actually Does

A great website isn't defined by how it looks, though that matters. It's defined by what it accomplishes.

**It builds trust before the first conversation.** People decide whether to trust you in seconds. The quality of your site signals the quality of your work. A well-crafted site tells a visitor: this organization is serious, organized, and worth my time. A broken, outdated, or generic site tells them the opposite.

**It answers the right questions at the right time.** What do you do? Who is it for? Why should I trust you? What do I do next? A great website answers these questions clearly and in the right order. Most sites either bury the answers or never provide them at all.

**It removes friction from the path to action.** Whatever you want people to do — call you, book an appointment, donate, apply, purchase — a great website makes that path obvious and easy. Every unnecessary click, every form that's too long, every page that loads too slowly is a door closing in someone's face.

**It works everywhere, for everyone.** Mobile devices account for the majority of web traffic worldwide. Accessibility isn't optional — it's a legal requirement in many jurisdictions and a basic obligation to the people you serve. A site that only works well on a desktop for a sighted user with a fast connection is failing most of its visitors.

**It earns its place in search results.** People are searching for what you offer right now. Whether they find you depends on how your site is built, how fast it loads, and whether the content clearly communicates what you do. Technical SEO is not a marketing gimmick — it's how you get discovered by people who already want what you have.

## The Cost of Not Investing

The organizations that treat their website as a sunk cost — something to build once and leave — pay for that choice continuously. In lost inquiries that went to a competitor. In donor skepticism that killed a campaign before it started. In qualified candidates who looked at the careers page and passed. In constituents who couldn't find the form they needed and gave up.

These costs are invisible, which is why they're so easy to ignore. No one sends you an email saying "I was going to hire you but your website convinced me not to." They just don't call.

## What to Do About It

The starting point is an honest audit. Look at your site the way a stranger would. Load it on your phone. Try to complete the most important action a visitor would take. Ask someone who has never seen your organization to tell you what you do based only on the homepage.

What you find will tell you where to start.

If you want a second opinion from someone who builds these systems professionally, [we're happy to take a look](/intake). No obligation — just an honest assessment.
    `.trim(),
  },
];

// ── Draft posts (not yet published) ──────────────────────────────────────────
// (none — all posts are live)

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPrevNextPosts(slug: string): { prev: Post | null; next: Post | null } {
  const idx = posts.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? posts[idx - 1] : null,
    next: idx < posts.length - 1 ? posts[idx + 1] : null,
  };
}

export function getCategories(): string[] {
  return Array.from(new Set(posts.map((p) => p.category)));
}
