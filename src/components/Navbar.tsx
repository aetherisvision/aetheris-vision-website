"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { BRAND_LOGO } from "@/lib/brand";
import { CAPABILITY_STATEMENT_REQUEST_HREF } from "@/lib/constants";

const navLinks = [
  { label: "Agentic OG", href: "/agentic-og" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Request Statement", href: CAPABILITY_STATEMENT_REQUEST_HREF },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMobileOpen(false), [pathname]);

  function isActive(href: string) {
    if (href === "/agentic-og") return pathname.startsWith("/agentic-og");
    if (href === "/blog") return pathname.startsWith("/blog");
    if (href === "/about") return pathname === "/about";
    if (href === "/performance") return pathname === "/performance";
    if (href === "/metrics") return pathname === "/metrics";
    if (href === "/portfolio") return pathname.startsWith("/portfolio");
    if (href === "/contact") return pathname === "/contact";
    if (href === "/services") return pathname.startsWith("/services");
    return false;
  }

  return (
    <header
      className={clsx(
        "fixed top-0 w-full z-50 border-b transition-all duration-300",
        scrolled
          ? "border-white/10 bg-background/88 backdrop-blur-md shadow-[0_1px_30px_rgba(0,0,0,0.5)]"
          : "border-white/5 bg-background/50 backdrop-blur-sm"
      )}
    >
      <div
        className={clsx(
          "mx-auto max-w-5xl px-6 flex items-center justify-between transition-all duration-300",
          scrolled ? "h-14" : "h-16"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Image
            src={BRAND_LOGO.markSvg}
            alt="Aetheris Vision Logo"
            width={44}
            height={44}
            className={clsx(
              "transition-all duration-300",
              scrolled ? "h-10 w-10" : "h-11 w-11"
            )}
          />
          <div className="text-xl md:text-2xl font-bold tracking-tight text-white">
            <span className="font-light text-gray-400">Aetheris</span>Vision
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          <nav className="flex gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={clsx(
                  "transition-colors flex flex-col items-center",
                  isActive(link.href)
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="block h-px w-full bg-blue-500 mt-0.5 rounded-full" />
                )}
              </a>
            ))}
          </nav>
          <a
            href="/book"
            className="inline-flex h-8 items-center justify-center rounded-md bg-white px-4 text-xs font-medium text-black hover:bg-gray-200 transition"
          >
            Schedule a Conversation
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden text-gray-400 hover:text-white transition p-2 -mr-2"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-controls="mobile-navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div id="mobile-navigation" className="lg:hidden border-t border-white/5 bg-background/97 backdrop-blur-md">
          <nav className="mx-auto max-w-5xl px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "py-3 px-2 text-sm transition border-b border-white/5 last:border-0",
                  isActive(link.href)
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
