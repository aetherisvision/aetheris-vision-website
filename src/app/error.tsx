"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-red-400">
        Error
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Something Went Wrong
      </h1>
      <p className="mt-4 max-w-md text-gray-400">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex h-10 items-center rounded-md bg-white px-6 text-sm font-medium text-black hover:bg-gray-200 transition"
      >
        Try again
      </button>
    </main>
  );
}
