"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { BRAND_LOGO } from "@/lib/brand";
import { scrollToHash } from "@/lib/scroll-to-hash";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Expertise", href: "/services" },
  { label: "How We Work", href: "/#how-we-work" },
  { label: "Selected Work", href: "/#selected-work" },
  { label: "Principal", href: "/about" },
  { label: "Federal", href: "/capabilities" },
  { label: "Insights", href: "/blog" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const consultationHref = "/book";

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    // Covers page load and browser back/forward — both change the hash
    // without a click this component sees. Ordinary nav clicks update
    // currentHash directly in handleNavLinkClick instead of waiting on this,
    // because a same-path hash change (e.g. "/#how-we-work" -> "/") fires
    // neither a pathname change nor a "hashchange"/"popstate" event, so this
    // listener alone would leave a stale section highlighted after such a
    // click.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentHash(window.location.hash.slice(1));
    const onPopState = () => setCurrentHash(window.location.hash.slice(1));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        mobileTriggerRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 1280) setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [mobileOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/blog") return pathname.startsWith("/blog");
    if (href === "/about") return pathname === "/about";
    if (href === "/capabilities") return pathname === "/capabilities";
    if (href === "/contact") return pathname === "/contact";
    if (href === "/services") return pathname.startsWith("/services");
    if (href.startsWith("/#")) return pathname === "/" && currentHash === href.slice(2);
    return false;
  }

  // Next.js only promises to scroll the destination *page* into view on a
  // cross-route Link navigation, not a specific in-page id, and does nothing
  // at all when the target hash is on the page you're already viewing. When
  // we're already on "/", handle the scroll ourselves instead of relying on
  // the router; a genuine route change still lands normally and is picked up
  // by HashScrollOnLoad once the homepage mounts.
  //
  // Every link click also sets currentHash directly from the href being
  // clicked, rather than waiting on a pathname or hash-change event: dropping
  // a hash while staying on "/" (e.g. clicking "Home" from "/#how-we-work")
  // changes neither, so an event-only approach leaves the wrong nav item
  // highlighted until the next real navigation.
  const handleNavLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      const hashIndex = href.indexOf("#");
      const targetHash = hashIndex === -1 ? "" : href.slice(hashIndex + 1);
      const targetPath = hashIndex === -1 ? href : href.slice(0, hashIndex);

      if (targetHash && targetPath === "/" && pathname === "/") {
        event.preventDefault();
        window.history.pushState(null, "", href);
        scrollToHash(targetHash);
      }

      setCurrentHash(targetHash);
    },
    [pathname],
  );

  return (
    <header
      className="fixed top-0 z-50 w-full border-b border-white/15 bg-[#0a1628]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 whitespace-nowrap"
          onClick={(event) => {
            handleNavLinkClick(event, "/");
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
            });
          }}
        >
          <Image
            src={BRAND_LOGO.markSvg}
            alt=""
            aria-hidden="true"
            width={44}
            height={44}
            className="h-10 w-10"
          />
          <div>
            <div className="text-xl font-bold tracking-tight text-white md:text-2xl">
              <span className="font-light text-white/65">Aetheris</span>Vision
            </div>
            <p className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7eabca] sm:block">
              Scientific &amp; Technical Consulting
            </p>
          </div>
        </Link>

        {/* Desktop Nav — seven labels plus the CTA need ~1,190px beside the
            logo, so the full row only appears from xl (1280px); the hamburger
            covers 1024–1279px, where the last links would slide under the CTA. */}
        <div className="hidden min-w-0 items-center gap-7 text-sm xl:flex">
          <nav aria-label="Primary navigation" className="flex min-w-0 gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                onClick={(event) => handleNavLinkClick(event, link.href)}
                className={clsx(
                  "inline-flex h-11 items-center whitespace-nowrap border-b text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200",
                  isActive(link.href)
                    ? "border-[#7eabca] text-white"
                    : "border-transparent text-white/60 hover:border-white/30 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={consultationHref}
            className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap border border-white/40 px-4 text-xs font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white hover:text-[#0a1628]"
          >
            Get in touch
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          ref={mobileTriggerRef}
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-white/70 transition hover:bg-white/5 hover:text-white xl:hidden"
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
        <div
          id="mobile-navigation"
          className="overflow-y-auto overscroll-contain border-t border-white/15 bg-[#0a1628] xl:hidden"
          style={{ maxHeight: "calc(100dvh - 5rem - env(safe-area-inset-top, 0px))" }}
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-7xl flex-col px-5 pt-5 sm:px-8"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                onClick={(event) => {
                  handleNavLinkClick(event, link.href);
                  setMobileOpen(false);
                }}
                className={clsx(
                  "flex min-h-12 items-center border-b border-white/10 py-3 text-sm font-semibold transition last:border-0",
                  isActive(link.href)
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={consultationHref}
              onClick={() => setMobileOpen(false)}
              className="mt-6 inline-flex min-h-12 items-center justify-center border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0a1628]"
            >
              Get in touch
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
