import Link from "next/link";
import { SITE } from "@/lib/constants";
import LocationMap from "@/components/LocationMap";

export const metadata = {
  title: `Veterans Forward Oklahoma — Nonprofit Demo | ${SITE.name} Portfolio`,
};

const programs = [
  {
    title: "Transition Academy",
    desc: "8-week intensive cohort for recently separated veterans. Career skills, resume building, networking, and employer introductions.",
    stat: "340+ graduates",
  },
  {
    title: "Emergency Housing Fund",
    desc: "Rapid financial assistance for veterans facing eviction or homelessness. Application-to-payment in under 72 hours.",
    stat: "$1.2M disbursed",
  },
  {
    title: "Mental Wellness Clinic",
    desc: "Free and reduced-cost counseling from licensed providers who specialize in military trauma, TBI, and PTSD.",
    stat: "2,100 sessions/yr",
  },
  {
    title: "Small Business Launchpad",
    desc: "Mentorship, seed grants, and SBA navigation support for veteran entrepreneurs ready to build their own legacy.",
    stat: "87 businesses launched",
  },
];

const impactStats = [
  { val: "6,400+", label: "Veterans Served" },
  { val: "18 yrs", label: "Serving Oklahoma" },
  { val: "$4.8M", label: "Aid Distributed" },
  { val: "94%", label: "Program Retention" },
];

export default function VeteranNonprofitPage() {
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
          <div className="flex items-center gap-2">
            <span className="inline-block h-7 w-2 rounded-sm bg-red-600" />
            <span className="text-xl font-extrabold text-zinc-900">Veterans Forward</span>
            <span className="hidden text-sm font-medium text-zinc-500 sm:block">Oklahoma</span>
          </div>
          <div className="hidden gap-7 text-sm font-medium text-zinc-600 sm:flex">
            <a href="#programs" className="hover:text-red-700 transition-colors">Programs</a>
            <a href="#impact" className="hover:text-red-700 transition-colors">Impact</a>
            <a href="#get-involved" className="rounded-full bg-red-700 px-5 py-1.5 font-semibold text-white hover:bg-red-800 transition-colors">Donate</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 py-28 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-gray-300">
            Oklahoma 501(c)(3) · EIN 73-XXXXXXX
          </div>
          <h1 className="mb-5 text-5xl font-extrabold leading-tight sm:text-6xl">
            They Served.<br />
            <span className="text-red-400">Now We Serve Them.</span>
          </h1>
          <p className="mb-10 max-w-xl text-lg text-gray-300">
            Veterans Forward Oklahoma delivers direct-impact programs in housing, employment, mental wellness, and entrepreneurship for Oklahoma&apos;s 300,000+ veterans.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#get-involved" className="rounded-full bg-red-600 px-8 py-3 font-bold text-white shadow-lg hover:bg-red-700 transition-colors">Donate Now</a>
            <a href="#programs" className="rounded-full border border-white/30 px-8 py-3 font-semibold hover:bg-white/10 transition-colors">Our Programs</a>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section id="impact" className="border-y border-zinc-100 bg-zinc-50 px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {impactStats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-3xl font-extrabold text-red-700">{s.val}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-red-700">What We Do</p>
          <h2 className="mb-12 text-center text-3xl font-extrabold text-zinc-900">Our Core Programs</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {programs.map((p) => (
              <div key={p.title} className="flex flex-col rounded-2xl border border-zinc-200 p-7 hover:border-red-600 hover:shadow-md transition-all">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-bold text-zinc-900">{p.title}</h3>
                  <span className="ml-4 shrink-0 rounded-full bg-red-50 px-3 py-0.5 text-xs font-bold text-red-700">{p.stat}</span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Location */}
      <section className="bg-gradient-to-b from-gray-50 to-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-extrabold text-zinc-900">Visit Our Office</h2>
          <p className="mb-12 text-center text-zinc-500">Located in central Oklahoma City, serving veterans across the state</p>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Interactive Map */}
            <div>
              <LocationMap
                businessName="Veterans Forward Oklahoma"
                address="514 N Robinson Ave, Oklahoma City, OK 73102"
                phone="(405) 555-0260"
                hours="Mon-Fri: 9AM-5PM | Sat: 10AM-2PM | Emergency: 24/7 Helpline"
                embedUrl="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3245.234!2d-97.5167!3d35.4711!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDI4JzE2LjAiTiA5N8KwMzEnMDAuMSJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                className="h-full"
              />
            </div>
            
            {/* Office Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8">
                <h3 className="mb-4 text-xl font-extrabold text-red-700 flex items-center gap-2">
                  🏢 Office Hours
                </h3>
                {[
                  { day: "Monday – Friday", hours: "9:00 AM – 5:00 PM" },
                  { day: "Saturday", hours: "10:00 AM – 2:00 PM" },
                  { day: "Sunday", hours: "Emergency Line Only" },
                ].map((row) => (
                  <div key={row.day} className="mb-4 flex justify-between items-center border-b border-red-100 pb-3 last:border-b-0 last:pb-0 last:mb-0">
                    <span className="text-zinc-700 font-medium">{row.day}</span>
                    <span className="font-semibold text-red-700">{row.hours}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h3 className="mb-4 text-xl font-extrabold text-zinc-900 flex items-center gap-2">
                  📞 Contact Information
                </h3>
                <div className="space-y-4 text-zinc-700">
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 text-lg">📍</span>
                    <div>
                      <p className="font-semibold">Address</p>
                      <p>514 N Robinson Ave<br />Oklahoma City, OK 73102</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 text-lg">📞</span>
                    <div>
                      <p className="font-semibold">Main Office</p>
                      <a href="tel:4055550260" className="text-red-700 hover:text-red-800 transition-colors">(405) 555-0260</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 text-lg">🆘</span>
                    <div>
                      <p className="font-semibold">24/7 Crisis Line</p>
                      <a href="tel:4055550911" className="text-red-700 hover:text-red-800 transition-colors">(405) 555-0911</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 text-lg">✉️</span>
                    <div>
                      <p className="font-semibold">Email</p>
                      <a href="mailto:info@veteransforwardok.org" className="text-red-700 hover:text-red-800 transition-colors">info@veteransforwardok.org</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Make a Difference */}
      <section className="bg-[#0f172a] px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-3 text-3xl font-extrabold">Make a Difference Today</h2>
          <p className="mb-8 text-gray-400">Every dollar goes directly to veteran services. Volunteer hours build the community backbone that keeps our programs running.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#get-involved" className="rounded-full bg-red-600 px-8 py-3 font-bold text-white hover:bg-red-700 transition-colors">Donate</a>
            <a href="#get-involved" className="rounded-full border border-white/30 px-8 py-3 font-semibold hover:bg-white/10 transition-colors">Volunteer</a>
          </div>
        </div>
      </section>

      {/* Get Involved / Contact */}
      <section id="get-involved" className="px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-12 sm:grid-cols-2">
          {/* Donate */}
          <div>
            <h3 className="mb-4 text-xl font-extrabold text-zinc-900">Donate</h3>
            <div className="mb-4 flex flex-wrap gap-3">
              {["$25", "$50", "$100", "$250", "Other"].map((amt) => (
                <button key={amt} className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold hover:border-red-600 hover:text-red-700 transition-colors">{amt}</button>
              ))}
            </div>
            <div className="mb-3 h-10 rounded border border-zinc-200 bg-zinc-50" />
            <button className="w-full rounded-full bg-red-700 py-3 font-bold text-white hover:bg-red-800 transition-colors">Donate Securely</button>
            <p className="mt-3 text-xs text-zinc-400">Tax-deductible · 501(c)(3) · EIN 73-XXXXXXX</p>
          </div>

          {/* Volunteer */}
          <div>
            <h3 className="mb-4 text-xl font-extrabold text-zinc-900">Volunteer</h3>
            <p className="mb-4 text-sm text-zinc-500">We need mentors, drivers, office volunteers, event staff, and licensed counselors who want to give back.</p>
            {["Name", "Email", "How You'd Like to Help"].map((label) => (
              <div key={label} className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">{label}</label>
                <div className="h-10 rounded border border-zinc-200 bg-zinc-50" />
              </div>
            ))}
            <button className="mt-2 w-full rounded-full border-2 border-red-700 py-3 font-bold text-red-700 hover:bg-red-700 hover:text-white transition-colors">Apply to Volunteer</button>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-900 px-6 py-8 text-center text-sm text-zinc-500">
        <p className="font-bold text-white">Veterans Forward Oklahoma</p>
        <p className="mt-1">Oklahoma City, OK · (405) 555-0260 · info@veteransforwardok.org</p>
        <p className="mt-1 text-xs">501(c)(3) Non-Profit · Donations are tax-deductible</p>
        <p className="mt-4 text-xs text-zinc-600">
          Demo site built by{" "}
          <Link href="/portfolio" className="text-blue-400 hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-zinc-500 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>
    </div>
  );
}
