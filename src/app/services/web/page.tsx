import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { clientWork } from "@/lib/client-work";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `Web & Application Development | ${SITE.name}`,
  description:
    "Aetheris Vision builds custom websites and web applications alongside its scientific consulting work. Next.js, TypeScript, and modern cloud infrastructure. Veteran-owned, Mustang OK.",
  path: "/services/web",
});

const capabilities = [
  {
    title: "Custom sites and applications",
    body: "Designed and coded for the business, not assembled from a template. Next.js and TypeScript on a global edge network. The client owns the code.",
  },
  {
    title: "Content the owner controls",
    body: "A content studio the client actually uses, so pages, hours, and specials change without calling a developer.",
  },
  {
    title: "Data and workflow behind the page",
    body: "Dashboards, portals, scheduling, payments, and document workflows when a static site is not enough.",
  },
  {
    title: "Built to stay secure",
    body: "Authentication, session handling, security headers, and a content security policy designed in from the start rather than added by plugin.",
  },
];

const stack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "Postgres", "Vercel"];

export default function WebServicesPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505]">
      <Navbar />

      <main id="main" className="flex-1 pb-20 pt-24 sm:pt-28">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <FadeIn>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-500">
              Web &amp; Application Development
            </p>
            <h1 className="mb-6 text-4xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl">
              We build websites and web applications.
            </h1>
            <p className="max-w-2xl text-lg font-light leading-relaxed text-gray-400">
              Alongside our scientific and geospatial consulting, Aetheris Vision develops
              production websites and business applications. It is the same engineering
              discipline applied to a smaller problem — this site and our client work are
              built the same way. Scope and price are agreed in writing before work begins.
            </p>
          </FadeIn>
        </section>

        {/* Capabilities */}
        <section className="border-t border-white/5 bg-background py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <FadeIn>
              <h2 className="mb-10 text-2xl font-semibold text-white md:text-3xl">What we build</h2>
            </FadeIn>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {capabilities.map((c, i) => (
                <FadeIn key={c.title} delay={i * 0.05} direction="up">
                  <div className="h-full rounded-xl border border-white/5 bg-white/[0.02] p-6">
                    <h3 className="mb-2 font-medium text-white">{c.title}</h3>
                    <p className="text-sm font-light leading-relaxed text-gray-400">{c.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
            <FadeIn>
              <div className="mt-10 flex flex-wrap gap-2">
                {stack.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Delivered work */}
        <section className="border-t border-white/5 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <FadeIn>
              <h2 className="mb-3 text-2xl font-semibold text-white md:text-3xl">Delivered work</h2>
              <p className="mb-10 max-w-2xl font-light text-gray-400">
                Live sites we built and continue to support.
              </p>
            </FadeIn>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {clientWork.map((project, i) => (
                <FadeIn key={project.title} delay={i * 0.05} direction="up">
                  <article className="h-full overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="relative aspect-[16/10] border-b border-white/5 bg-black">
                      <Image
                        src={project.image}
                        alt={`${project.title} — home page`}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="p-6">
                      <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">
                        {project.industry}
                      </p>
                      <h3 className="mb-2 text-lg font-medium text-white">{project.title}</h3>
                      <p className="mb-4 text-sm font-light leading-relaxed text-gray-400">
                        {project.desc}
                      </p>
                      <p className="mb-4 text-xs text-gray-500">{project.stack}</p>
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-400 transition hover:text-blue-300"
                      >
                        Visit the live site
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </article>
                </FadeIn>
              ))}

              {/* This site itself — the clearest example, since the visitor is already on it. */}
              <FadeIn delay={clientWork.length * 0.05} direction="up">
                <article className="flex h-full flex-col justify-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-6">
                  <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">
                    Scientific &amp; Technical Consulting
                  </p>
                  <h3 className="mb-2 text-lg font-medium text-white">This site</h3>
                  <p className="mb-4 text-sm font-light leading-relaxed text-gray-400">
                    aetherisvision.com is one of our own: the same stack, the same security
                    posture, and the same care we bring to client work, running in production
                    right now — you&apos;re looking at it.
                  </p>
                  <p className="mb-4 text-xs text-gray-500">
                    Next.js 16 · TypeScript · Postgres · Vercel
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-400 transition hover:text-blue-300"
                  >
                    Back to the homepage
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </article>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 bg-background py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <FadeIn>
              <h2 className="mb-4 text-2xl font-semibold text-white md:text-3xl">
                Have a project in mind?
              </h2>
              <p className="mx-auto mb-8 max-w-xl font-light text-gray-400">
                Tell us what you need. We reply within one business day.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact?requirement=Web%20%26%20Digital%20Systems#contact-form"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 text-sm font-medium text-black transition hover:bg-gray-200"
                >
                  Start the conversation <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/intake"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 px-8 text-sm font-medium text-white transition hover:bg-white/5"
                >
                  Project intake form
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
