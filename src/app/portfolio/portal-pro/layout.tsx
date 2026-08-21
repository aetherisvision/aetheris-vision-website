import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Portal Pro Demo | ${SITE.name} Portfolio`,
  description: "A fictional client portal included as an Aetheris Vision web-application demonstration.",
  robots: { index: false, follow: true },
};

export default function PortalProLayout({ children }: { children: ReactNode }) {
  return children;
}
