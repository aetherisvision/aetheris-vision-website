"use client";

import { useEffect, useState } from "react";

export type SatelliteSource = {
  url: string;
  label: string;
  region: string;
};

const REFRESH_MS = 10 * 60 * 1000;

export default function SatelliteDisplay({ sources }: { sources: SatelliteSource[] }) {
  const [revision, setRevision] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRevision((current) => current + 1);
      setFailed(new Set());
    }, REFRESH_MS);

    return () => window.clearInterval(timer);
  }, []);

  if (!sources.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Current GOES satellite imagery">
      {sources.map((source, index) => (
        <figure key={source.url} className="overflow-hidden border border-white/20 bg-transparent">
          <div className="relative aspect-square overflow-hidden bg-[#071425]">
            {failed.has(index) ? (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm leading-6 text-[#9bb9ca]">
                Current imagery is temporarily unavailable.
              </div>
            ) : (
              // NOAA publishes its latest full-disk image at a stable URL.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${source.url}&revision=${revision}`}
                alt={`Current ${source.label} full-disk satellite view`}
                className="h-full w-full object-contain"
                onError={() => {
                  setFailed((current) => new Set(current).add(index));
                }}
              />
            )}
          </div>
          <figcaption className="flex items-start justify-between gap-4 border-t border-white/15 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#9bc3df]">{source.label}</span>
            <span className="text-right text-xs text-white/45">{source.region}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
