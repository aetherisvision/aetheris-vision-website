import Link from "next/link";
import { SITE } from "@/lib/constants";
import LocationMap from "@/components/LocationMap";

export const metadata = {
  title: `Summit Home Services — Contractor Demo | ${SITE.name} Portfolio`,
};

const services = [
  { name: "HVAC", icon: "❄️", desc: "Installation, repair, and seasonal maintenance for all major brands." },
  { name: "Plumbing", icon: "🔧", desc: "Leak repair, water heater install, pipe replacement, drain clearing." },
  { name: "Electrical", icon: "⚡", desc: "Panel upgrades, outlet installs, ceiling fans, code compliance." },
  { name: "Roofing", icon: "🏠", desc: "Shingle replacement, storm damage repair, gutter installation." },
  { name: "Remodeling", icon: "🪚", desc: "Kitchens, bathrooms, and basements — full design-to-finish builds." },
  { name: "Landscaping", icon: "🌿", desc: "Lawn care, irrigation design, seasonal cleanup, tree trimming." },
];

const reviews = [
  { name: "Janet R.", text: "Summit replaced our entire HVAC system in one day. Professional crew, no mess left behind, and the price beat every other quote we got.", stars: 5 },
  { name: "Mike T.", text: "Called for a plumbing emergency on a Saturday morning. Tech was here within 2 hours. Fixed the issue fast. Highly recommend.", stars: 5 },
  { name: "Carla K.", text: "Full kitchen remodel in 3 weeks, on budget. They communicated every step of the way. We love the result.", stars: 5 },
];

export default function TradesContractorPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-800">
      {/* Demo Banner */}
      <div className="bg-black py-2 text-center text-xs font-semibold text-gray-300">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-blue-400 underline hover:text-blue-300">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <span className="text-xl font-extrabold text-[#1d4ed8]">SUMMIT</span>
            <span className="ml-1 text-sm font-medium text-zinc-600">Home Services</span>
          </div>
          <div className="hidden gap-8 text-sm font-medium text-zinc-600 sm:flex">
            <a href="#services" className="hover:text-[#1d4ed8] transition-colors">Services</a>
            <a href="#reviews" className="hover:text-[#1d4ed8] transition-colors">Reviews</a>
            <a href="#quote" className="rounded-full bg-orange-500 px-5 py-1.5 font-semibold text-white hover:bg-orange-600 transition-colors">Free Quote</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#1d4ed8] px-6 py-28 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-600/30 px-4 py-1.5 text-sm font-semibold text-blue-200">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            Serving OKC Metro · Licensed & Insured
          </div>
          <h1 className="mb-5 text-5xl font-extrabold leading-tight sm:text-6xl">
            Your Home, <br /><span className="text-orange-400">Done Right.</span>
          </h1>
          <p className="mb-10 max-w-xl text-lg text-blue-100">
            Summit Home Services handles everything from emergency repairs to full remodels. One call, one crew, zero stress.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#quote" className="rounded-full bg-orange-500 px-8 py-3 font-bold text-white shadow-lg hover:bg-orange-600 transition-colors">Get a Free Quote</a>
            <a href="tel:4055550142" className="rounded-full border border-white/30 px-8 py-3 font-semibold hover:bg-white/10 transition-colors">(405) 555-0142</a>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-zinc-100 bg-zinc-50 px-6 py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 text-center sm:grid-cols-4">
          {[
            { val: "15+ yrs", label: "In Business" },
            { val: "4,800+", label: "Jobs Completed" },
            { val: "4.9 ★", label: "Google Rating" },
            { val: "2-hr", label: "Emergency Response" },
          ].map((b) => (
            <div key={b.label} className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-2xl font-extrabold text-[#1d4ed8]">{b.val}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{b.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-orange-500">What We Do</p>
          <h2 className="mb-12 text-center text-3xl font-extrabold text-zinc-900">Full-Service Home Trades</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {services.map((s) => (
              <div key={s.name} className="rounded-2xl border border-zinc-200 p-6 hover:border-[#1d4ed8] hover:shadow-md transition-all">
                <div className="mb-3 text-3xl">{s.icon}</div>
                <h3 className="mb-2 font-bold text-zinc-900">{s.name}</h3>
                <p className="text-sm text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-extrabold text-zinc-900">What Customers Say</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.name} className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="mb-3 text-xl text-orange-500">{"★".repeat(r.stars)}</p>
                <p className="text-sm leading-relaxed text-zinc-600">&quot;{r.text}&quot;</p>
                <p className="mt-4 text-xs font-bold text-zinc-800">— {r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area & Location */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-extrabold text-[#1d4ed8]">Our Service Area</h2>
          <p className="mb-12 text-center text-zinc-500">Proudly serving the Greater Oklahoma City Metro Area with 15+ years of experience</p>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Service Area Map */}
            <div>
              <LocationMap
                businessName="Summit Home Services"
                address="2847 NW 58th St, Oklahoma City, OK 73112"
                phone="(405) 555-0142"
                hours="Mon-Fri: 7AM-7PM | Sat: 8AM-5PM | 24/7 Emergency"
                embedUrl="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d207057.93674745468!2d-97.64305598654094!3d35.48212313751476!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87b217c327502b5d%3A0x61f4b693b1ed739!2sOklahoma%20City%2C%20OK!5e0!3m2!1sen!2sus!4v1647365890123!5m2!1sen!2sus"
                className="h-full"
              />
            </div>
            
            {/* Service Areas & Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-8">
                <h3 className="mb-4 text-xl font-bold text-[#1d4ed8] flex items-center gap-2">
                  🏘️ Service Areas
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    "Oklahoma City", "Edmond", "Yukon", "Mustang",
                    "Moore", "Norman", "Bethany", "Warr Acres",
                    "The Village", "Nichols Hills", "Del City", "Midwest City"
                  ].map((city) => (
                    <div key={city} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-zinc-700">{city}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  📍 <strong>Service Radius:</strong> Up to 30 miles from OKC Metro
                </p>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-8">
                <h3 className="mb-4 text-xl font-bold text-[#1d4ed8] flex items-center gap-2">
                  🚚 Response Times
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-700">Emergency Service</span>
                    <span className="font-bold text-orange-500">Within 2 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-700">Standard Service</span>
                    <span className="font-bold text-[#1d4ed8]">Same/Next day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-700">Project Estimates</span>
                    <span className="font-bold text-gray-600">Usually same day</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  ⏰ <strong>Emergency Line:</strong> Available 24/7 for urgent repairs
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote form */}
      <section id="quote" className="px-6 py-20">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-2 text-center text-3xl font-extrabold text-zinc-900">Get a Free Quote</h2>
          <p className="mb-8 text-center text-zinc-500">No pressure. We&apos;ll visit, assess, and give you a firm price — usually same day.</p>
          <div className="rounded-2xl border border-zinc-200 p-8 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              {["Name", "Phone", "Email", "Service Needed"].map((label) => (
                <div key={label} className={label === "Service Needed" ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">{label}</label>
                  <div className="h-10 rounded border border-zinc-200 bg-zinc-50" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Brief Description</label>
                <div className="h-20 rounded border border-zinc-200 bg-zinc-50" />
              </div>
            </div>
            <button className="mt-6 w-full rounded-full bg-orange-500 py-3 font-bold text-white hover:bg-orange-600 transition-colors">Request Free Quote</button>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-900 px-6 py-8 text-center text-sm text-zinc-500">
        <p className="font-bold text-white">Summit Home Services</p>
        <p className="mt-1">Licensed · Bonded · Insured · OKC Metro</p>
        <p className="mt-1">(405) 555-0142 · info@summithomeservices.com</p>
        <p className="mt-4 text-xs text-zinc-600">
          Demo site built by{" "}
          <Link href="/portfolio" className="text-blue-400 hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-zinc-500 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>
    </div>
  );
}
