import Image from "next/image";
import Link from "next/link";
import {
  BRAND_POSITIONING,
  CAPABILITY_STATEMENT_REQUEST_HREF,
  SITE,
  SAM,
} from "@/lib/constants";
import { BRAND_LOGO } from "@/lib/brand";
import { INSIGHTS_PUBLIC } from "@/lib/features";

const footerLinks = [
  { label: "Expertise", href: "/services" },
  { label: "How We Work", href: "/#how-we-work" },
  { label: "Selected Work", href: "/#selected-work" },
  { label: "Principal", href: "/about" },
  { label: "Federal Contracting", href: "/capabilities" },
  ...(INSIGHTS_PUBLIC ? [{ label: "Insights", href: "/blog" }] : []),
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/15 bg-[#07111f]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <div className="max-w-md">
            <Link href="/" className="inline-flex min-h-11 shrink-0 items-center">
              <Image
                src={BRAND_LOGO.family3OnDarkSvg}
                alt="Aetheris Vision"
                width={1184}
                height={188}
                className="h-auto w-[280px] max-w-full"
              />
            </Link>
            <p className="mt-5 text-sm leading-6 text-white/70">
              {BRAND_POSITIONING.text} for complex, mission-driven work—from atmospheric intelligence to production-ready software.
            </p>
            {/* Business address for local SEO / Google Business Profile.
                Deliberately no email or phone — contact routes through the
                verified inquiry form or Cal.com booking; the anti-scraping
                policy (tests/features/steps/email-security.steps.test.tsx)
                bans plaintext addresses and mailto: links. */}
            <address className="mt-5 text-sm not-italic leading-6 text-white/55">
              {SITE.address.street}
              <br />
              {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
            </address>
          </div>

          <div className="md:text-right">
            <nav aria-label="Footer navigation" className="flex max-w-xl flex-wrap gap-x-6 gap-y-3 md:ml-auto md:justify-end">
              {footerLinks.map((link) => (
                <Link key={link.label} href={link.href} className="inline-flex min-h-11 items-center text-sm text-white/70 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
              <Link href="/capabilities#contracting-codes" className="inline-flex min-h-11 items-center text-xs text-white/65 transition hover:text-white">
                NAICS &amp; PSC Codes
              </Link>
              <Link href={CAPABILITY_STATEMENT_REQUEST_HREF} className="inline-flex min-h-11 items-center text-xs text-white/65 transition hover:text-white">
                Capability Statement
              </Link>
              <Link href="/client/login" className="inline-flex min-h-11 items-center text-xs text-white/65 transition hover:text-white">
                Client Portal
              </Link>
              <Link href="/privacy" className="inline-flex min-h-11 items-center text-xs text-white/65 transition hover:text-white">
                Privacy
              </Link>
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
