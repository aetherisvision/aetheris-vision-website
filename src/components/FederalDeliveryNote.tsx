import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

/** One-line federal delivery pointer shared by the focused service pages. */
export default function FederalDeliveryNote({ topic }: { topic: string }) {
  return (
    <p className="mt-10 max-w-3xl text-sm font-light leading-6 text-gray-400">
      For federal and defense programs, {topic} work is available as a prime or subcontract award
      through an SBA-certified SDVOSB, VOSB, and HUBZone small business.{" "}
      <Link
        href="/services/federal-weather"
        className="inline-flex items-center gap-1 font-medium text-blue-400 transition hover:text-blue-300"
      >
        Federal and defense delivery <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </p>
  );
}
