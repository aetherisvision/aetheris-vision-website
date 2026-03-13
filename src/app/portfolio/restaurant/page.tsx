import Link from "next/link";
import { SITE } from "@/lib/constants";
import LocationMap from "@/components/LocationMap";

export const metadata = {
  title: `Casa Verde Kitchen — Restaurant Demo | ${SITE.name} Portfolio`,
};

const menuSections = [
  {
    title: "Starters",
    items: [
      { name: "Street Corn Dip", desc: "Roasted corn, cotija, lime crema, tortilla chips", price: "$9" },
      { name: "Empanadas (4)", desc: "Picadillo filling, house salsa verde", price: "$11" },
      { name: "Tortilla Soup", desc: "Slow-simmered chicken broth, avocado, crispy strips", price: "$8" },
    ],
  },
  {
    title: "Mains",
    items: [
      { name: "Carne Asada Plate", desc: "Grilled skirt steak, rice, black beans, handmade tortillas", price: "$22" },
      { name: "Chile Relleno", desc: "Roasted poblano, queso fresco, ranchero sauce", price: "$18" },
      { name: "Carnitas Tacos (3)", desc: "Slow-braised pork, pickled onion, cilantro, salsa roja", price: "$16" },
    ],
  },
  {
    title: "Desserts",
    items: [
      { name: "Tres Leches Cake", desc: "House-made, whipped cream, cinnamon", price: "$7" },
      { name: "Churro Bites", desc: "Cinnamon sugar, chocolate dipping sauce", price: "$6" },
    ],
  },
];

export default function RestaurantPage() {
  return (
    <div className="min-h-screen bg-[#fdf6ee] font-sans text-zinc-800">
      {/* Demo Banner */}
      <div className="bg-black py-2 text-center text-xs font-semibold text-gray-300">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-blue-400 underline hover:text-blue-300">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-amber-200 bg-[#fdf6ee]/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-[#92400e]">Casa Verde</span>
            <span className="ml-1 text-sm text-amber-700">Kitchen</span>
          </div>
          <div className="hidden gap-8 text-sm font-medium text-zinc-600 sm:flex">
            <a href="#menu" className="hover:text-[#92400e] transition-colors">Menu</a>
            <a href="#hours" className="hover:text-[#92400e] transition-colors">Hours</a>
            <a href="#reserve" className="rounded-full bg-[#92400e] px-5 py-1.5 font-semibold text-white hover:bg-[#7c3410] transition-colors">Reserve a Table</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#92400e] px-6 py-28 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#fbbf24,transparent_60%),radial-gradient(circle_at_70%_50%,#ea580c,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-300">Fresh · Authentic · Handmade</p>
          <h1 className="mb-5 text-5xl font-bold leading-tight sm:text-6xl">
            Food Made With<br /><span className="text-amber-400">Heart & Tradition</span>
          </h1>
          <p className="mb-10 text-lg text-amber-100">Family recipes, locally sourced ingredients, and the flavors of Mexico — in the heart of Oklahoma City.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#reserve" className="rounded-full bg-amber-400 px-8 py-3 font-bold text-zinc-900 hover:bg-amber-300 transition-colors">Reserve a Table</a>
            <a href="#menu" className="rounded-full border border-amber-400/50 px-8 py-3 font-semibold text-white hover:border-amber-300 hover:text-amber-300 transition-colors">View Menu</a>
          </div>
        </div>
      </section>

      {/* Highlights bar */}
      <section className="border-b border-amber-100 px-6 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            { label: "Family Recipes", sub: "4 generations deep" },
            { label: "Local Ingredients", sub: "Oklahoma farms" },
            { label: "Happy Hour", sub: "Mon–Fri 3–6 PM" },
            { label: "Private Events", sub: "Up to 60 guests" },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-bold text-[#92400e]">{item.label}</p>
              <p className="text-sm text-zinc-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-[#92400e]">Our Menu</h2>
          <p className="mb-12 text-center text-zinc-500">Handmade daily · Changes seasonally</p>
          {menuSections.map((section) => (
            <div key={section.title} className="mb-12">
              <h3 className="mb-5 border-b border-amber-200 pb-2 text-xl font-bold text-zinc-700">{section.title}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {section.items.map((item) => (
                  <div key={item.name} className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-zinc-800">{item.name}</h4>
                      <span className="shrink-0 font-semibold text-[#92400e]">{item.price}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hours & Location with Interactive Map */}
      <section id="hours" className="bg-gradient-to-b from-amber-50 to-orange-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-[#92400e]">Visit Us</h2>
          <p className="mb-12 text-center text-zinc-500">Find us in the heart of Oklahoma City</p>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Interactive Map */}
            <div className="lg:order-2">
              <LocationMap
                businessName="Casa Verde Kitchen"
                address="4512 N Western Ave, Oklahoma City, OK 73118"
                phone="(405) 555-0188"
                hours="Mon-Thu: 11AM-9PM | Fri-Sat: 11AM-10:30PM | Sun: 12PM-8PM"
                embedUrl="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3245.123456789!2d-97.5164!3d35.4676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDI4JzAzLjQiTiA5N8KwMzAnNTkuMCJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                className="h-full"
              />
            </div>
            
            {/* Hours & Contact Info */}
            <div className="lg:order-1 space-y-8">
              <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8">
                <h3 className="mb-6 text-xl font-bold text-[#92400e] flex items-center gap-2">
                  🕒 Hours
                </h3>
                {[
                  { day: "Monday – Thursday", hours: "11:00 AM – 9:00 PM" },
                  { day: "Friday – Saturday", hours: "11:00 AM – 10:30 PM" },
                  { day: "Sunday", hours: "12:00 PM – 8:00 PM" },
                ].map((row) => (
                  <div key={row.day} className="mb-4 flex justify-between items-center border-b border-amber-100 pb-3 last:border-b-0 last:pb-0 last:mb-0">
                    <span className="text-zinc-700 font-medium">{row.day}</span>
                    <span className="font-semibold text-[#92400e]">{row.hours}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8">
                <h3 className="mb-6 text-xl font-bold text-[#92400e] flex items-center gap-2">
                  📍 Contact & Location
                </h3>
                <div className="space-y-4 text-zinc-700">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-600 text-lg">📍</span>
                    <div>
                      <p className="font-semibold">Address</p>
                      <p>4512 N Western Ave<br />Oklahoma City, OK 73118</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-amber-600 text-lg">📞</span>
                    <div>
                      <p className="font-semibold">Phone</p>
                      <a href="tel:4055550188" className="text-[#92400e] hover:text-amber-700 transition-colors">(405) 555-0188</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-amber-600 text-lg">✉️</span>
                    <div>
                      <p className="font-semibold">Email</p>
                      <a href="mailto:hello@casaverdekitchen.com" className="text-[#92400e] hover:text-amber-700 transition-colors">hello@casaverdekitchen.com</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation */}
      <section id="reserve" className="px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-3 text-3xl font-bold text-[#92400e]">Make a Reservation</h2>
          <p className="mb-8 text-zinc-500">Walk-ins welcome. Reserve ahead for groups of 6+.</p>
          <div className="rounded-2xl border border-amber-200 bg-white p-8 text-left shadow">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Name</label><div className="h-10 rounded border border-zinc-200 bg-zinc-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Phone</label><div className="h-10 rounded border border-zinc-200 bg-zinc-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Date</label><div className="h-10 rounded border border-zinc-200 bg-zinc-50" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Party Size</label><div className="h-10 rounded border border-zinc-200 bg-zinc-50" /></div>
            </div>
            <button className="mt-6 w-full rounded-full bg-[#92400e] py-3 font-bold text-white hover:bg-[#7c3410] transition-colors">Request Reservation</button>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-900 px-6 py-8 text-center text-sm text-zinc-500">
        <p className="font-semibold text-white">Casa Verde Kitchen</p>
        <p className="mt-1">4512 N Western Ave · Oklahoma City, OK 73118 · (405) 555-0188</p>
        <p className="mt-4 text-xs text-zinc-600">
          Demo site built by{" "}
          <Link href="/portfolio" className="text-blue-400 hover:underline">{SITE.legalName}</Link>
          {" "}· <Link href="/portfolio" className="text-zinc-500 hover:text-white transition-colors">See all demos →</Link>
        </p>
      </footer>
    </div>
  );
}
