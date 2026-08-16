import Image from "next/image";
import Link from "next/link";
import { CAPABILITY_STATEMENT_REQUEST_HREF, SITE, SAM } from "@/lib/constants";
import { BRAND_LOGO } from "@/lib/brand";

const footerLinks = [
  { label: "Expertise", href: "/services" },
  { label: "How We Work", href: "/#how-we-work" },
  { label: "Selected Work", href: "/#selected-work" },
  { label: "Principal", href: "/about" },
  { label: "Federal Contracting", href: "/capabilities" },
  { label: "Insights", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/15 bg-[#07111f]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <div className="max-w-md">
            <Link href="/" className="flex min-h-11 shrink-0 items-center gap-3">
              <Image
                src={BRAND_LOGO.markSvg}
                alt=""
                aria-hidden="true"
                width={36}
                height={36}
                className="h-9 w-9"
              />
              <div className="text-lg font-bold tracking-tight text-white">
                <span className="font-light text-white/55">Aetheris</span>Vision
              </div>
            </Link>
            <p className="mt-5 text-sm leading-6 text-white/70">
              Scientific and technical consulting that helps complex projects move forward efficiently and stay on schedule.
            </p>
          </div>

          <div className="md:text-right">
            <nav aria-label="Footer navigation" className="flex max-w-xl flex-wrap gap-x-6 gap-y-3 md:ml-auto md:justify-end">
              {footerLinks.map((link) => (
                <a key={link.label} href={link.href} className="inline-flex min-h-11 items-center text-sm text-white/70 transition hover:text-white">
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
              <a href="/capabilities#contracting-codes" className="inline-flex min-h-11 items-center text-xs text-white/65 transition hover:text-white">
                NAICS &amp; PSC Codes
              </a>
              <a href={CAPABILITY_STATEMENT_REQUEST_HREF} className="inline-flex min-h-11 items-center text-xs text-white/65 transition hover:text-white">
                Capability Statement
              </a>
              <a href="/client/login" className="inline-flex min-h-11 items-center text-xs text-white/65 transition hover:text-white">
                Client Portal
              </a>
              <a href="/privacy" className="inline-flex min-h-11 items-center text-xs text-white/65 transition hover:text-white">
                Privacy
              </a>
            </div>
          </div>
        </div>

        <div className="my-10 h-px w-full bg-white/10" />

        <div className="flex flex-col items-start justify-between gap-4 text-xs text-white/60 sm:flex-row sm:items-center">
          <span>&copy; {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</span>
          <span>
            SAM.gov Active&nbsp;&nbsp;•&nbsp;&nbsp;UEI {SAM.uei}&nbsp;&nbsp;•&nbsp;&nbsp;CAGE {SAM.cage}
          </span>
        </div>
      </div>
    </footer>
  );
}
