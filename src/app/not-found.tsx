import Link from "next/link";
import { SITE } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: `Page Not Found | ${SITE.name}`,
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
          404
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Page Not Found
        </h1>
        <p className="mt-4 max-w-md text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition"
          >
            Go home
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center rounded-md border border-white/10 px-6 text-sm font-medium text-gray-300 hover:border-white/20 hover:text-white transition"
          >
            Contact us
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
