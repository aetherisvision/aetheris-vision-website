"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@heroicons/react/24/outline";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }
      aria-label="Back to top"
      className="fixed right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/80 text-gray-400 shadow-lg backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black hover:text-white motion-reduce:transition-none sm:right-8"
      style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))" }}
    >
      <ArrowUpIcon className="h-4 w-4" />
    </button>
  );
}
