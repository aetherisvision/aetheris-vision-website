"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SatelliteSource = {
  url: string;
  label: string;
  region: string;
};

const CYCLE_MS = 12_000;

export default function SatelliteDisplay({ sources }: { sources: SatelliteSource[] }) {
  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [allFailed, setAllFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failedRef = useRef<Set<number>>(new Set());

  const go = useCallback((next: number) => {
    setOpacity(0);
    setTimeout(() => {
      setIndex(next);
      setOpacity(1);
    }, 600);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sources.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => { go((i + 1) % sources.length); return i; });
    }, CYCLE_MS);
  }, [sources.length, go]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const navigate = (next: number) => { go(next); resetTimer(); };
  const prev = () => navigate((index - 1 + sources.length) % sources.length);
  const next = () => navigate((index + 1) % sources.length);

  const handleError = useCallback(() => {
    failedRef.current.add(index);
    // Stop if everything has failed
    if (failedRef.current.size >= sources.length) {
      setAllFailed(true);
      return;
    }
    // Skip to the next source that hasn't failed yet
    let candidate = (index + 1) % sources.length;
    while (failedRef.current.has(candidate) && candidate !== index) {
      candidate = (candidate + 1) % sources.length;
    }
    go(candidate);
  }, [go, index, sources.length]);

  const handleLoad = useCallback(() => {
    failedRef.current.delete(index);
  }, [index]);

  if (!sources.length) return null;

  const current = sources[index];

  return (
    <div className="absolute inset-y-0 right-8 z-0 hidden w-[48vw] max-w-[640px] items-center justify-center md:flex">
      <div className="relative h-[420px] w-[420px] lg:h-[500px] lg:w-[500px]">
        <div
          className="relative h-full w-full"
          style={{
            opacity: allFailed ? 0.2 : opacity,
            transition: "opacity 0.6s ease-in-out",
            maskImage: "radial-gradient(circle at center, black 52%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle at center, black 52%, transparent 72%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.url}
            src={current.url}
            alt={current.label}
            className="absolute inset-0 h-full w-full object-contain"
            onError={handleError}
            onLoad={handleLoad}
          />
        </div>

        {!allFailed && (
          <>
            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
              style={{ opacity, transition: "opacity 0.6s ease-in-out" }}
            >
              <button onClick={prev} aria-label="Previous source" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-black/60 text-gray-400 backdrop-blur-sm hover:text-white transition-colors">‹</button>
              <span className="whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-wider text-gray-400 backdrop-blur-sm">
                Live · {current.label} · {current.region}
              </span>
              <button onClick={next} aria-label="Next source" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-black/60 text-gray-400 backdrop-blur-sm hover:text-white transition-colors">›</button>
            </div>

            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
              {sources.map((_, i) => (
                <button
                  key={i}
                  onClick={() => navigate(i)}
                  aria-label={`View source ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === index ? "w-4 bg-white/60" : "w-1 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
