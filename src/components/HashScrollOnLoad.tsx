"use client";

import { useEffect } from "react";
import { scrollToHash } from "@/lib/scroll-to-hash";

/**
 * Handles the "arrived here from another page" case for hash links like
 * /#how-we-work: Next.js only guarantees the destination page scrolls into
 * view on that kind of navigation, not the specific section within it. Mount
 * this once on any page that has in-page anchor targets nav links point at.
 */
export default function HashScrollOnLoad() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) scrollToHash(hash);
  }, []);

  return null;
}
