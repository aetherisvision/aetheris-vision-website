import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Prairie Standard — WordPress Headless Demo | ${SITE.name} Portfolio`,
};

const featured = {
  category: "Agriculture",
  title: "Oklahoma's Wheat Farmers Are Betting on AI-Powered Forecasting",
  excerpt: "A new generation of precision agriculture tools is helping producers across the panhandle make better planting and harvest decisions — and it starts with better weather data.",
  author: "M. Hendricks",
  date: "March 18, 2026",
  readTime: "8 min read",
};

const articles = [
  {
    category: "Energy",
    title: "Wind Power Now Supplies 40% of Oklahoma's Electricity Grid",
    excerpt: "The state's wind corridor continues to expand, with three new utility-scale projects coming online in Q1.",
    author: "T. Ruiz",
    date: "March 17, 2026",
    readTime: "5 min",
  },
  {
    category: "Policy",
    title: "State Legislature Takes Up Water Rights Reform Ahead of Dry Season",
    excerpt: "Competing proposals in the Capitol reflect growing tension between agricultural users and municipal water districts.",
    author: "C. Blackwood",
    date: "March 16, 2026",
    readTime: "6 min",
  },
  {
    category: "Business",
    title: "Downtown Tulsa Office Vacancy Hits 10-Year Low as Tech Firms Relocate",
    excerpt: "A wave of technology companies citing lower costs and central time zone access is reshaping the commercial real estate market.",
    author: "L. Okafor",
    date: "March 15, 2026",
    readTime: "4 min",
  },
  {
    category: "Culture",
    title: "Route 66 Preservation Groups Win Federal Landmark Status for Three Sites",
    excerpt: "The designations bring renewed tourism attention and infrastructure funding to communities along the historic highway.",
    author: "D. Starling",
    date: "March 14, 2026",
    readTime: "4 min",
  },
];

const categories = ["Agriculture", "Energy", "Policy", "Business", "Culture", "Weather", "Sports"];

export default function WpEditorialPage() {
  return (
    <div className="min-h-screen font-serif text-gray-900" style={{ backgroundColor: "#fafaf8", fontFamily: "'Georgia', 'Cambria', serif" }}>

      {/* Demo Banner */}
      <div className="bg-gray-900 py-2 text-center text-xs font-sans font-semibold text-gray-400" style={{ fontFamily: "system-ui, sans-serif" }}>
        ✦ DEMO SITE (Headless WordPress) — built by{" "}
        <Link href="/portfolio" className="text-blue-400 underline hover:text-blue-300">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-gray-500 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      {/* WP Badge */}
      <div className="border-b border-gray-200 bg-white px-6 py-2 text-center text-xs font-sans text-gray-400" style={{ fontFamily: "system-ui, sans-serif" }}>
        Content managed via <span className="font-semibold text-[#21759b]">WordPress CMS</span> · Delivered by Next.js · Powered by WPGraphQL
      </div>

      {/* Masthead */}
      <header className="border-b border-gray-900 bg-white px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between text-xs font-sans text-gray-400" style={{ fontFamily: "system-ui, sans-serif" }}>
            <span>Friday, March 20, 2026</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-700 transition-colors">Subscribe</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Sign In</a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-tight text-gray-900 sm:text-6xl" style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>
              The Prairie Standard
            </h1>
            <p className="mt-1 text-sm font-sans font-medium uppercase tracking-widest text-gray-500" style={{ fontFamily: "system-ui, sans-serif" }}>
              Oklahoma · Independent · Since 2004
            </p>
          </div>
        </div>
      </header>

      {/* Category Nav */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3 font-sans shadow-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto">
          {categories.map((cat) => (
            <a key={cat} href="#" className="shrink-0 rounded px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              {cat}
            </a>
          ))}
          <div className="ml-auto shrink-0">
            <div className="flex h-8 w-32 items-center rounded border border-gray-200 bg-gray-50 px-3">
              <span className="text-xs text-gray-400">Search...</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Featured Story */}
        <section className="mb-12 border-b border-gray-200 pb-12">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Text */}
            <div className="lg:col-span-3">
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#b45309]" style={{ fontFamily: "system-ui, sans-serif" }}>
                {featured.category}
              </span>
              <h2 className="mt-2 text-4xl font-black leading-tight text-gray-900 sm:text-5xl" style={{ letterSpacing: "-0.02em" }}>
                {featured.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">{featured.excerpt}</p>
              <div className="mt-5 flex items-center gap-3 font-sans text-sm text-gray-400" style={{ fontFamily: "system-ui, sans-serif" }}>
                <span className="font-medium text-gray-700">{featured.author}</span>
                <span>·</span>
                <span>{featured.date}</span>
                <span>·</span>
                <span>{featured.readTime}</span>
              </div>
              <a href="#" className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-[#b45309] transition-colors" style={{ fontFamily: "system-ui, sans-serif" }}>
                Read full story →
              </a>
            </div>
            {/* Image placeholder */}
            <div className="lg:col-span-2">
              <div className="aspect-[4/3] w-full rounded bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <div className="text-center text-amber-600">
                  <div className="text-4xl mb-2">🌾</div>
                  <p className="text-xs font-sans" style={{ fontFamily: "system-ui, sans-serif" }}>Featured Image</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article Grid */}
        <div className="grid gap-10 sm:grid-cols-2">
          {articles.map((article) => (
            <article key={article.title} className="border-b border-gray-100 pb-10 sm:border-b-0 sm:pb-0">
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#b45309]" style={{ fontFamily: "system-ui, sans-serif" }}>
                {article.category}
              </span>
              <h3 className="mt-2 text-xl font-bold leading-snug text-gray-900 hover:text-[#b45309] transition-colors cursor-pointer" style={{ letterSpacing: "-0.01em" }}>
                {article.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{article.excerpt}</p>
              <div className="mt-3 flex items-center gap-2 font-sans text-xs text-gray-400" style={{ fontFamily: "system-ui, sans-serif" }}>
                <span className="font-medium text-gray-600">{article.author}</span>
                <span>·</span>
                <span>{article.date}</span>
                <span>·</span>
                <span>{article.readTime}</span>
              </div>
            </article>
          ))}
        </div>

        {/* WP CMS Callout */}
        <aside className="mt-12 rounded-xl border border-[#21759b]/20 bg-[#21759b]/5 p-6 font-sans" style={{ fontFamily: "system-ui, sans-serif" }}>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#21759b] text-white font-bold text-sm">WP</div>
            <div>
              <p className="font-semibold text-gray-900">Powered by Headless WordPress</p>
              <p className="mt-1 text-sm text-gray-600">
                This publication&apos;s editors manage all content — articles, authors, categories, and media — inside a familiar WordPress dashboard.
                The frontend is built in Next.js and fetches content via WPGraphQL, delivering fast load times with full editorial control.
                No developer needed for day-to-day publishing.
              </p>
            </div>
          </div>
        </aside>

      </main>

      {/* Newsletter */}
      <section className="border-t border-gray-900 bg-gray-900 px-6 py-16 text-center font-sans" style={{ fontFamily: "system-ui, sans-serif" }}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Stay Informed</p>
        <h2 className="mb-3 text-2xl font-bold text-white">The Prairie Standard Daily</h2>
        <p className="mb-8 text-sm text-gray-400">Oklahoma news, delivered to your inbox every morning. No spam.</p>
        <div className="mx-auto flex max-w-md gap-3">
          <div className="h-11 flex-1 rounded border border-gray-700 bg-gray-800" />
          <button className="rounded bg-[#b45309] px-6 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">Subscribe</button>
        </div>
      </section>

      <footer className="border-t border-gray-800 bg-gray-900 px-6 py-8 text-center text-sm font-sans text-gray-500" style={{ fontFamily: "system-ui, sans-serif" }}>
        <p className="font-semibold text-white">The Prairie Standard</p>
        <p className="mt-1">Independent Oklahoma Journalism · Est. 2004</p>
        <p className="mt-4 text-xs text-gray-600">
          Demo site (Headless WordPress) built by{" "}
          <Link href="/portfolio" className="text-blue-400 hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-gray-500 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>
    </div>
  );
}
