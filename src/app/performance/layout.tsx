import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Performance Diagnostics | ${SITE.name}`,
  description: "Internal browser performance diagnostics for the Aetheris Vision website.",
  robots: { index: false, follow: false },
};

export default function PerformanceLayout({ children }: { children: ReactNode }) {
  return children;
}
