"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

const navLinks = [
  { label: "Services", href: "/services/web" },
  { label: "About", href: "/about" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function handleExpertiseClick(e: React.MouseEvent) {
    e.preventDefault();
    if (pathname === "/") {
      document.getElementById("expertise")?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#expertise");
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMobileOpen(false), [pathname]);

  function isActive(href: string) {
    if (href === "/blog") return pathname.startsWith("/blog");
    if (href === "/about") return pathname === "/about";
    if (href === "/capabilities") return pathname === "/capabilities";
    if (href === "/performance") return pathname === "/performance";
    if (href === "/api-docs") return pathname === "/api-docs";
    if (href === "/metrics") return pathname === "/metrics";
    if (href === "/portfolio") return pathname.startsWith("/portfolio");
    if (href === "/contact") return pathname === "/contact";
    if (href === "/services/web") return pathname.startsWith("/services");
    return false;
  }

  return (
    <header
      className={clsx(
        "fixed top-0 w-full z-50 border-b transition-all duration-300",
        scrolled
          ? "border-white/10 bg-[#0d0c0f]/88 backdrop-blur-md shadow-[0_1px_30px_rgba(0,0,0,0.5)]"
          : "border-white/5 bg-[#0d0c0f]/50 backdrop-blur-sm"
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
            src="/logo/aetheris-logo.svg"
            alt="Aetheris Vision Logo"
            width={48}
            height={48}
            className={clsx(
              "transition-all duration-300",
              scrolled ? "h-8 w-8 md:h-9 md:w-9" : "h-10 w-10 md:h-12 md:w-12"
            )}
          />
          <div className="text-xl md:text-2xl font-bold tracking-tight text-white">
            <span className="font-light text-gray-400">Aetheris</span>Vision
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <nav className="flex gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={link.label === "Expertise" ? handleExpertiseClick : undefined}
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
            Book a Call
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-400 hover:text-white transition p-2 -mr-2"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation"
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
        <div className="md:hidden border-t border-white/5 bg-[#0d0c0f]/97 backdrop-blur-md">
          <nav className="mx-auto max-w-5xl px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  setMobileOpen(false);
                  if (link.label === "Expertise") handleExpertiseClick(e);
                }}
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
