import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { ShieldCheckIcon, LockClosedIcon, ChatBubbleLeftRightIcon, ServerIcon } from "@heroicons/react/24/outline";

const footerLinks = [
  { label: "Expertise", href: "/#expertise" },
  { label: "About", href: "/about" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Book a Call", href: "/book" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0d0c0f]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Top row: logo + nav */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo/aetheris-logo.svg"
              alt={`${SITE.name} Logo`}
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div className="text-lg font-bold tracking-tight text-white">
              <span className="font-light text-gray-500">Aetheris</span>Vision
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-300 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Security & Compliance Bar */}
        <div className="mb-8">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-white">Security & Compliance</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-semibold">SOC 2</span>
                  <span>Type II Compliant</span>
                </div>
                <span className="text-white/20">·</span>
                <div className="flex items-center gap-2">
                  <LockClosedIcon className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 font-semibold">SSL/TLS</span>
                  <span>256-bit Encryption</span>
                </div>
                <span className="text-white/20">·</span>
                <div className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">E2E</span>
                  <span>Encrypted Communications</span>
                </div>
                <span className="text-white/20">·</span>
                <div className="flex items-center gap-2">
                  <ServerIcon className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-400 font-semibold">GDPR</span>
                  <span>Privacy Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/5 mb-8" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Veteran-Owned Small Business (VOSB)</span>
            <span className="text-white/10">·</span>
            <a
              href={`mailto:${SITE.email}`}
              className="hover:text-gray-400 transition"
            >
              {SITE.email}
            </a>
            <span className="text-white/10">·</span>
            <a href="/privacy" className="hover:text-gray-400 transition">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
