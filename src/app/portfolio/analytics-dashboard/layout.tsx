import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Analytics Dashboard Demo | ${SITE.name} Portfolio`,
  description: "A fictional analytics dashboard included as an Aetheris Vision web-design demonstration.",
  robots: { index: false, follow: true },
};

export default function AnalyticsDashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
