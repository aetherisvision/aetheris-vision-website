import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: `Clarity Health Group — Healthcare Demo | ${SITE.name} Portfolio`,
};

const services = [
  { title: "Primary Care", desc: "Annual physicals, preventive care, chronic disease management, and same-day sick visits for the whole family.", icon: "🩺" },
  { title: "Urgent Care", desc: "Walk-in care for non-emergency illness and injury. Open 7 days, no appointment needed. Shorter waits than the ER.", icon: "⚡" },
  { title: "Women's Health", desc: "Annual exams, prenatal care, family planning, and preventive screenings with board-certified OB/GYN specialists.", icon: "💙" },
  { title: "Pediatrics", desc: "Well-child visits, immunizations, developmental screenings, and sick care for infants through adolescents.", icon: "🌱" },
  { title: "Behavioral Health", desc: "Integrated mental health services including therapy, psychiatry, and medication management — all under one roof.", icon: "🧠" },
  { title: "Lab & Imaging", desc: "On-site laboratory, digital X-ray, and ultrasound with same-day results for most tests.", icon: "🔬" },
];

const physicians = [
  { name: "Dr. Sarah Okonkwo, MD", title: "Chief Medical Officer", specialty: "Internal Medicine & Primary Care", years: 18, initials: "SO" },
  { name: "Dr. James Whitfield, DO", title: "Medical Director — Urgent Care", specialty: "Emergency Medicine", years: 14, initials: "JW" },
  { name: "Dr. Priya Nair, MD", title: "OB/GYN Specialist", specialty: "Women's Health & Obstetrics", years: 11, initials: "PN" },
];

const insurances = [
  "BlueCross BlueShield", "Aetna", "UnitedHealthcare", "Cigna", "Humana",
  "Medicare", "Medicaid / SoonerCare", "Tricare", "Ambetter", "CommunityCare",
];

export default function HealthcarePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Demo Banner */}
      <div className="bg-[#0c4a6e] py-2 text-center text-xs font-semibold text-sky-200">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-white underline hover:text-sky-100">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-sky-300 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0369a1]">
              <span className="text-xs font-bold text-white">CHG</span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#0c4a6e]">Clarity Health Group</span>
            </div>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 sm:flex">
            <a href="#services" className="hover:text-[#0369a1] transition-colors">Services</a>
            <a href="#physicians" className="hover:text-[#0369a1] transition-colors">Our Team</a>
            <a href="#insurance" className="hover:text-[#0369a1] transition-colors">Insurance</a>
            <a href="#appointment" className="rounded-md bg-[#0369a1] px-5 py-2 font-semibold text-white hover:bg-[#075985] transition-colors">Book Appointment</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f0f9ff] via-white to-[#e0f2fe] px-6 py-24">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-5">
          <div className="h-full w-full bg-[radial-gradient(circle_at_80%_20%,#0369a1,transparent_60%)]" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-[#0369a1]">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Now Accepting New Patients
            </div>
            <h1 className="mb-5 text-5xl font-bold leading-tight text-[#0c4a6e] sm:text-6xl">
              Compassionate Care,<br />
              <span className="text-[#0369a1]">Close to Home.</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-gray-600">
              Board-certified physicians and specialists providing comprehensive primary, urgent, and specialty care for patients of all ages across the Oklahoma City metro.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#appointment" className="rounded-md bg-[#0369a1] px-8 py-3 font-semibold text-white shadow hover:bg-[#075985] transition-colors">Book an Appointment</a>
              <a href="#services" className="rounded-md border border-[#0369a1] px-8 py-3 font-semibold text-[#0369a1] hover:bg-sky-50 transition-colors">View Services</a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            { stat: "24,000+", label: "Patients Served" },
            { stat: "18 yrs", label: "In Practice" },
            { stat: "4.9 ★", label: "Average Rating" },
            { stat: "3 Locations", label: "OKC Metro" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-bold text-[#0369a1]">{item.stat}</p>
              <p className="text-sm text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#0369a1]">What We Offer</p>
            <h2 className="text-3xl font-bold text-[#0c4a6e] sm:text-4xl">Comprehensive Care Under One Roof</h2>
            <p className="mt-3 text-gray-500">Coordinated services designed to keep your whole family healthy — without the runaround.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-sky-200 hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-2xl group-hover:bg-sky-100 transition">
                  {s.icon}
                </div>
                <h3 className="mb-2 font-bold text-[#0c4a6e]">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Physicians */}
      <section id="physicians" className="bg-[#f0f9ff] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#0369a1]">Our Physicians</p>
            <h2 className="text-3xl font-bold text-[#0c4a6e] sm:text-4xl">Meet the Team</h2>
            <p className="mt-3 text-gray-500">Board-certified, experienced, and committed to your long-term health.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {physicians.map((p) => (
              <div key={p.name} className="rounded-xl border border-sky-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#0369a1] text-2xl font-bold text-white">
                  {p.initials}
                </div>
                <h3 className="font-bold text-[#0c4a6e]">{p.name}</h3>
                <p className="text-sm font-medium text-[#0369a1]">{p.title}</p>
                <p className="mt-1 text-sm text-gray-500">{p.specialty}</p>
                <p className="mt-3 text-xs text-gray-400">{p.years} years experience</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section id="insurance" className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#0369a1]">Coverage</p>
          <h2 className="mb-3 text-3xl font-bold text-[#0c4a6e]">Insurance We Accept</h2>
          <p className="mb-10 text-gray-500">We work with most major insurance providers. Self-pay and sliding-scale options available. Call to verify your coverage before your visit.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {insurances.map((ins) => (
              <span key={ins} className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">{ins}</span>
            ))}
          </div>
          <p className="mt-8 text-sm text-gray-400">Don&apos;t see your plan? Call us — we may still be in-network.</p>
        </div>
      </section>

      {/* Appointment */}
      <section id="appointment" className="bg-gradient-to-br from-[#0c4a6e] to-[#0369a1] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mb-10 text-sky-200">Book your appointment online or call us at <strong className="text-white">(405) 555-0240</strong>. Same-day appointments often available.</p>
          <div className="rounded-2xl bg-white p-8 text-left shadow-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold uppercase text-gray-500">First Name</label><div className="h-10 rounded border border-gray-200 bg-gray-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Last Name</label><div className="h-10 rounded border border-gray-200 bg-gray-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Date of Birth</label><div className="h-10 rounded border border-gray-200 bg-gray-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Phone</label><div className="h-10 rounded border border-gray-200 bg-gray-50" /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Reason for Visit</label><div className="h-10 rounded border border-gray-200 bg-gray-50" /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Insurance Provider</label><div className="h-10 rounded border border-gray-200 bg-gray-50" /></div>
            </div>
            <button className="mt-6 w-full rounded-md bg-[#0369a1] py-3 font-bold text-white hover:bg-[#075985] transition-colors">Request Appointment</button>
            <p className="mt-3 text-center text-xs text-gray-400">Our team will confirm within 2 business hours.</p>
          </div>
        </div>
      </section>

      <footer className="bg-[#0c4a6e] px-6 py-8 text-center text-sm text-sky-300">
        <p className="font-semibold text-white">Clarity Health Group</p>
        <p className="mt-1">3 Locations across the OKC Metro · (405) 555-0240</p>
        <p className="mt-4 text-xs text-sky-400">
          Demo site built by{" "}
          <Link href="/portfolio" className="text-white hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-sky-400 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>
    </div>
  );
}
