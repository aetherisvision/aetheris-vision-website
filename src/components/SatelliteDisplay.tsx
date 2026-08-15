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
        <figure key={source.url} className="overflow-hidden border border-[#17252f]/20 bg-white">
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
            <span className="absolute left-3 top-3 inline-flex items-center gap-2 bg-[#f4f1ea]/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#29426c] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2f8291]" />
              Current view
            </span>
          </div>
          <figcaption className="flex items-start justify-between gap-4 border-t border-[#17252f]/15 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#29426c]">{source.label}</span>
            <span className="text-right text-xs text-[#66777d]">{source.region}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
