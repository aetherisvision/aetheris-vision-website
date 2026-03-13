import Link from "next/link";
import { SITE } from "@/lib/constants";
import { HeroImage, CardImage } from "@/components/PortfolioImage";

const practiceAreas = [
  { title: "Personal Injury", desc: "Accidents, slip & fall, wrongful death" },
  { title: "Family Law", desc: "Divorce, custody, child support" },
  { title: "Business Law", desc: "Contracts, formation, disputes" },
  { title: "Estate Planning", desc: "Wills, trusts, probate" },
  { title: "Criminal Defense", desc: "DUI, misdemeanors, felonies" },
  { title: "Real Estate", desc: "Transactions, disputes, closings" },
];

const attorneys = [
  { name: "James R. Mitchell", title: "Managing Partner", years: "28 years experience", focus: "Business & Civil Litigation" },
  { name: "Sarah L. Torres", title: "Senior Associate", years: "14 years experience", focus: "Family Law & Estate Planning" },
  { name: "David K. Okonkwo", title: "Associate Attorney", years: "7 years experience", focus: "Personal Injury & Criminal Defense" },
];

export const metadata = {
  title: `Mitchell & Associates — Law Firm Demo | ${SITE.name} Portfolio`,
};

export default function LawFirmPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      {/* Demo Banner */}
      <div className="bg-black py-2 text-center text-xs font-semibold text-gray-300">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-blue-400 underline hover:text-blue-300">
          {SITE.name}
        </Link>{" "}
        ·{" "}
        <Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">
          ← Back to Portfolio
        </Link>
      </div>

      {/* Nav */}
      <nav className="border-b border-zinc-200 bg-[#1e3a5f] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <span className="text-xl font-bold tracking-wide text-white">Mitchell <span className="text-yellow-400">&</span> Associates</span>
            <span className="ml-2 text-xs text-zinc-400">ATTORNEYS AT LAW</span>
          </div>
          <div className="hidden gap-8 text-sm font-medium text-zinc-300 sm:flex">
            <a href="#practice" className="hover:text-yellow-400 transition-colors">Practice Areas</a>
            <a href="#attorneys" className="hover:text-yellow-400 transition-colors">Our Attorneys</a>
            <a href="#contact" className="rounded bg-yellow-500 px-4 py-1.5 font-semibold text-black hover:bg-yellow-400 transition-colors">Free Consultation</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-[#1e3a5f] px-6 py-24 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <HeroImage 
            category="law" 
            description="courthouse-premium" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/90 via-[#1e3a5f]/75 to-[#1e3a5f]/90" />
        
        {/* Content */}
        <div className="relative mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-yellow-400">Serving Oklahoma Since 1997</p>
          <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl">
            Experienced Legal Representation<br />
            <span className="text-yellow-400">When It Matters Most</span>
          </h1>
          <p className="mb-10 max-w-xl text-lg text-zinc-300">
            Mitchell & Associates provides aggressive, compassionate legal advocacy across Oklahoma. Our team fights for the results you deserve.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#contact" className="rounded bg-yellow-500 px-7 py-3 font-bold text-black hover:bg-yellow-400 transition-colors shadow-lg">Schedule a Free Consultation</a>
            <a href="#practice" className="rounded border border-zinc-500 px-7 py-3 font-semibold text-white hover:border-yellow-400 hover:text-yellow-400 transition-colors backdrop-blur-sm bg-white/10">Our Practice Areas</a>
          </div>
          <div className="mt-12 flex flex-wrap gap-8 text-sm text-zinc-400">
            <div><span className="block text-2xl font-bold text-white">500+</span>Cases Resolved</div>
            <div><span className="block text-2xl font-bold text-white">28</span>Years in Practice</div>
            <div><span className="block text-2xl font-bold text-white">3</span>Board-Certified Attorneys</div>
            <div><span className="block text-2xl font-bold text-white">$0</span>Fee Until We Win</div>
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section id="practice" className="bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-[#1e3a5f]">Practice Areas</h2>
          <p className="mb-12 text-center text-zinc-500">Comprehensive legal services across multiple disciplines</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {practiceAreas.map((area) => (
              <div key={area.title} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-yellow-400 hover:shadow-md transition-all">
                <div className="mb-3 h-1 w-10 rounded bg-yellow-500" />
                <h3 className="mb-1 text-lg font-bold text-[#1e3a5f]">{area.title}</h3>
                <p className="text-sm text-zinc-500">{area.desc}</p>
              </div>
            ))}
          </div>
          
          {/* Scales of Justice Feature */}
          <div className="mt-16 flex justify-center">
            <div className="relative max-w-md">
              <CardImage 
                category="law" 
                type="card" 
                description="scales-premium"
                className="w-full h-48 rounded-xl shadow-lg object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-xl flex items-end">
                <div className="p-6 text-white">
                  <h3 className="text-lg font-bold mb-1">Justice & Integrity</h3>
                  <p className="text-sm opacity-90">Balanced advocacy for every client</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Firm Philosophy with Visual */}
      <section className="relative bg-gray-50 px-6 py-20 overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Content */}
            <div>
              <h2 className="mb-6 text-3xl font-bold text-[#1e3a5f]">Our Philosophy</h2>
              <p className="mb-6 text-lg text-gray-700 leading-relaxed">
                When facing a legal problem, you need a lawyer who will put your interests above all else and represent you with utmost passion controlled by reason.
              </p>
              <p className="mb-6 text-gray-600 leading-relaxed">
                At Mitchell & Associates, we zealously advocate on your behalf, ensure that your legal interests are paramount, and resolve your legal disputes with experience and care.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We believe that the attorney-client relationship is sacrosanct and must be based on understanding, trust, duty, and confidence. These basic principles are at the foundation of our firm's philosophy.
              </p>
            </div>
            
            {/* Professional Legal Books Image */}
            <div className="relative">
              <CardImage 
                category="law" 
                type="card" 
                description="books-premium"
                className="w-full h-80 rounded-2xl shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a5f]/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Attorneys */}
      <section id="attorneys" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-[#1e3a5f]">Our Attorneys</h2>
          <p className="mb-12 text-center text-zinc-500">Decades of combined legal experience in your corner</p>
          
          {/* Professional Office Interior */}
          <div className="mb-16 relative">
            <CardImage 
              category="law" 
              type="interior" 
              description="office"
              className="w-full h-64 rounded-2xl shadow-xl mx-auto max-w-4xl object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 rounded-2xl max-w-4xl mx-auto" />
          </div>
          
          {/* Attorney Profiles */}
          <div className="grid gap-8 sm:grid-cols-3">
            {attorneys.map((atty) => (
              <div key={atty.name} className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5aa0] text-2xl font-bold text-yellow-400 shadow-lg">
                  {atty.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <h3 className="text-lg font-bold text-[#1e3a5f]">{atty.name}</h3>
                <p className="text-sm font-semibold text-yellow-600 mb-2">{atty.title}</p>
                <p className="mt-1 text-sm text-zinc-600 mb-1">{atty.focus}</p>
                <p className="text-xs text-zinc-500">{atty.years}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-[#1e3a5f] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">Request a Free Consultation</h2>
          <p className="mb-10 text-zinc-300">No fees until we win your case. Contact us today.</p>
          <div className="rounded-2xl bg-white p-8 text-left shadow-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">First Name</label><div className="h-10 rounded border border-zinc-200 bg-zinc-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Last Name</label><div className="h-10 rounded border border-zinc-200 bg-zinc-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Phone</label><div className="h-10 rounded border border-zinc-200 bg-zinc-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Practice Area</label><div className="h-10 rounded border border-zinc-200 bg-zinc-50" /></div>
            </div>
            <div className="mt-4"><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Briefly describe your situation</label><div className="h-24 rounded border border-zinc-200 bg-zinc-50" /></div>
            <button className="mt-6 w-full rounded bg-yellow-500 py-3 font-bold text-black hover:bg-yellow-400 transition-colors">Submit — Free Consultation</button>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-900 px-6 py-8 text-center text-sm text-zinc-500">
        <p className="font-semibold text-white">Mitchell & Associates, Attorneys at Law</p>
        <p className="mt-1">123 N Broadway Ave, Oklahoma City, OK 73102 · (405) 555-0100</p>
        <p className="mt-4 text-xs text-zinc-600">
          Demo site built by{" "}
          <Link href="/portfolio" className="text-blue-400 hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-zinc-500 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>
    </div>
  );
}
