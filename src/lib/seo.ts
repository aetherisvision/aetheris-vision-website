import type { Metadata } from "next";
import { SITE } from "./constants";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: `/${string}` | "/";
  keywords?: Metadata["keywords"];
  noIndex?: boolean;
  socialTitle?: string;
  socialDescription?: string;
}

/** Keep canonical, Open Graph, and social metadata consistent on public pages. */
export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  socialTitle = title,
  socialDescription = description,
}: PageMetadataOptions): Metadata {
  const url = new URL(path, SITE.url).toString();

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: url,
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url,
      siteName: SITE.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
    },
  };
}
