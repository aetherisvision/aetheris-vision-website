import Link from "next/link";
import { serviceBreadcrumbJsonLd } from "@/lib/jsonld";

export default function ServiceBreadcrumbs({ name, path }: {
  name: string;
  path: `/services/${string}`;
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="mx-auto mb-6 max-w-5xl px-4 text-sm text-gray-400 sm:px-6">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-white focus-visible:outline focus-visible:outline-2">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/services" className="hover:text-white focus-visible:outline focus-visible:outline-2">Services</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-white/80">{name}</li>
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(serviceBreadcrumbJsonLd(name, path)).replace(/</g, "\\u003c"),
      }} />
    </>
  );
}
