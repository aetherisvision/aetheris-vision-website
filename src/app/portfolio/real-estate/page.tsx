import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Pinnacle Realty Group — Real Estate Demo | ${SITE.name} Portfolio`,
};

const listings = [
  {
    address: "4821 Classen Blvd",
    city: "Oklahoma City, OK 73118",
    price: "$485,000",
    beds: 4,
    baths: 3,
    sqft: "2,840",
    status: "For Sale",
    tag: "New Listing",
    gradient: "from-stone-200 to-stone-300",
  },
  {
    address: "1103 NW 52nd St",
    city: "Oklahoma City, OK 73118",
    price: "$329,000",
    beds: 3,
    baths: 2,
    sqft: "1,920",
    status: "For Sale",
    tag: "Open House",
    gradient: "from-amber-100 to-amber-200",
  },
  {
    address: "7240 Nichols Road",
    city: "Nichols Hills, OK 73116",
    price: "$1,150,000",
    beds: 5,
    baths: 4,
    sqft: "4,600",
    status: "For Sale",
    tag: "Luxury",
    gradient: "from-stone-300 to-stone-400",
  },
  {
    address: "2214 Linwood Blvd",
    city: "Edmond, OK 73003",
    price: "$272,500",
    beds: 3,
    baths: 2,
    sqft: "1,680",
    status: "Under Contract",
    tag: "Under Contract",
    gradient: "from-slate-200 to-slate-300",
  },
];

const agents = [
  { name: "Rebecca Thorn", title: "Principal Broker", sales: "142 homes sold", initials: "RT" },
  { name: "Marcus Ellington", title: "Senior Agent — Luxury", sales: "89 homes sold", initials: "ME" },
  { name: "Dana Kurosawa", title: "Buyer's Specialist", sales: "74 homes sold", initials: "DK" },
];

export default function RealEstatePage() {
  return (
    <div className="min-h-screen bg-[#faf9f7] text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Demo Banner */}
      <div className="bg-[#1c1917] py-2 text-center text-xs font-semibold text-stone-400">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-white underline hover:text-stone-200">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-stone-500 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#92400e]">
              <span className="text-xs font-bold text-white">PRG</span>
            </div>
            <span className="text-lg font-bold text-[#1c1917] tracking-tight">Pinnacle Realty Group</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-stone-600 sm:flex">
            <a href="#listings" className="hover:text-[#92400e] transition-colors">Listings</a>
            <a href="#agents" className="hover:text-[#92400e] transition-colors">Our Agents</a>
            <a href="#valuation" className="hover:text-[#92400e] transition-colors">Home Value</a>
            <a href="#contact" className="rounded-md bg-[#92400e] px-5 py-2 font-semibold text-white hover:bg-[#78350f] transition-colors">Contact Us</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-28" style={{ background: "linear-gradient(135deg, #faf9f7 0%, #f5f0e8 100%)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#92400e]">Oklahoma City Metro</p>
            <h1 className="mb-5 text-5xl font-bold leading-tight text-[#1c1917] sm:text-6xl" style={{ letterSpacing: "-0.02em" }}>
              Find Your Place<br />
              <span className="text-[#92400e]">to Call Home.</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-stone-500">
              Pinnacle Realty Group has helped families and investors navigate the OKC metro real estate market for over 20 years. Trusted, local, results-driven.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#listings" className="rounded-md bg-[#1c1917] px-8 py-3 font-semibold text-white hover:bg-stone-800 transition-colors">Browse Listings</a>
              <a href="#valuation" className="rounded-md border border-stone-300 px-8 py-3 font-semibold text-stone-700 hover:bg-stone-100 transition-colors">Free Home Valuation</a>
            </div>
          </div>
        </div>

        {/* Decorative */}
        <div className="absolute right-0 top-0 h-full w-2/5 opacity-10 pointer-events-none">
          <div className="h-full w-full" style={{ background: "radial-gradient(ellipse at 80% 50%, #92400e, transparent 60%)" }} />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-stone-200 bg-white px-6 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            { stat: "1,200+", label: "Homes Sold" },
            { stat: "20 yrs", label: "In Business" },
            { stat: "$485M", label: "In Transactions" },
            { stat: "4.9 ★", label: "Client Rating" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-bold text-[#92400e]">{item.stat}</p>
              <p className="text-sm text-stone-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <section id="listings" className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-wrap gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-400">Location</label>
              <div className="h-9 rounded border border-stone-200 bg-stone-50" />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-400">Price Range</label>
              <div className="h-9 rounded border border-stone-200 bg-stone-50" />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-400">Bedrooms</label>
              <div className="h-9 rounded border border-stone-200 bg-stone-50" />
            </div>
            <div className="flex items-end">
              <button className="h-9 rounded-md bg-[#92400e] px-6 text-sm font-semibold text-white hover:bg-[#78350f] transition-colors">Search</button>
            </div>
          </div>

          {/* Listing Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {listings.map((l) => (
              <div key={l.address} className="group cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                {/* Image placeholder */}
                <div className={`relative h-48 bg-gradient-to-br ${l.gradient} flex items-center justify-center`}>
                  <span className="text-4xl opacity-30">🏡</span>
                  <div className="absolute top-3 left-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${l.tag === "Under Contract" ? "bg-stone-700 text-white" : l.tag === "Luxury" ? "bg-[#92400e] text-white" : "bg-white text-stone-800"}`}>
                      {l.tag}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{l.status}</span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xl font-bold text-[#1c1917]">{l.price}</p>
                  <p className="mt-1 font-medium text-stone-700">{l.address}</p>
                  <p className="text-sm text-stone-400">{l.city}</p>
                  <div className="mt-3 flex gap-4 text-sm text-stone-500">
                    <span><strong className="text-stone-800">{l.beds}</strong> bd</span>
                    <span><strong className="text-stone-800">{l.baths}</strong> ba</span>
                    <span><strong className="text-stone-800">{l.sqft}</strong> sqft</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="px-6 py-20" style={{ background: "linear-gradient(135deg, #f5f0e8 0%, #faf9f7 100%)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#92400e]">Our Team</p>
            <h2 className="text-3xl font-bold text-[#1c1917] sm:text-4xl">Agents Who Know This Market</h2>
            <p className="mt-3 text-stone-500">Local expertise. Personal service. Results you can count on.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {agents.map((a) => (
              <div key={a.name} className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#92400e] text-xl font-bold text-white">
                  {a.initials}
                </div>
                <h3 className="font-bold text-[#1c1917]">{a.name}</h3>
                <p className="text-sm font-medium text-[#92400e]">{a.title}</p>
                <p className="mt-2 text-sm text-stone-400">{a.sales}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Home Valuation CTA */}
      <section id="valuation" className="px-6 py-20" style={{ background: "#1c1917" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">What&apos;s Your Home Worth?</h2>
          <p className="mb-10 text-stone-400">Get a free, no-obligation comparative market analysis from one of our agents — usually delivered within 24 hours.</p>
          <div className="rounded-2xl bg-[#faf9f7] p-8 text-left">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold uppercase text-stone-500">Street Address</label><div className="h-10 rounded border border-stone-200 bg-stone-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-stone-500">City / Zip</label><div className="h-10 rounded border border-stone-200 bg-stone-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-stone-500">Your Name</label><div className="h-10 rounded border border-stone-200 bg-stone-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-stone-500">Phone or Email</label><div className="h-10 rounded border border-stone-200 bg-stone-50" /></div>
            </div>
            <button className="mt-6 w-full rounded-md bg-[#92400e] py-3 font-bold text-white hover:bg-[#78350f] transition-colors">Request Free Valuation</button>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#1c1917] border-t border-stone-800 px-6 py-8 text-center text-sm text-stone-500">
        <p className="font-semibold text-white">Pinnacle Realty Group</p>
        <p className="mt-1">Oklahoma City Metro · (405) 555-0180 · hello@pinnaclerealty.demo</p>
        <p className="mt-4 text-xs text-stone-600">
          Demo site built by{" "}
          <Link href="/portfolio" className="text-stone-400 hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-stone-500 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>
    </div>
  );
}
