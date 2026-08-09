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

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

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
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8",
          scrolled ? "h-14" : "h-16"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-3 whitespace-nowrap" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Image
            src={BRAND_LOGO.markSvg}
            alt=""
            aria-hidden="true"
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
        <div className="hidden min-w-0 items-center gap-4 text-sm xl:flex 2xl:gap-6">
          <nav aria-label="Primary navigation" className="flex min-w-0 gap-4 2xl:gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={clsx(
                  "flex flex-col items-center whitespace-nowrap transition-colors",
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
            className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-white px-4 text-xs font-medium text-black transition hover:bg-gray-200"
          >
            Consultation
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/5 hover:text-white xl:hidden"
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
        <div id="mobile-navigation" className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-white/5 bg-background/97 backdrop-blur-md xl:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex min-h-11 items-center border-b border-white/5 px-2 py-3 text-sm transition last:border-0",
                  isActive(link.href)
                    ? "text-white font-medium"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/book"
              onClick={() => setMobileOpen(false)}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-200"
            >
              Consultation
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
