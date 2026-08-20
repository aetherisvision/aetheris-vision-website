"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// hero-1: Earth from orbit with active cloud cover — the weather view.
// hero-2 (abstract data waves) is intentionally out of rotation; it reads
// generic-tech rather than meteorology.
const VIDEOS = ["/hero-1.mp4"];

export default function HeroVideo() {
  // Keep the first render deterministic so the server and client hydrate with
  // the same source. Subsequent clips still rotate when playback completes.
  const [index, setIndex] = useState(0);
  const [canPlay, setCanPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }).connection;

    const syncPlayback = () => {
      // Avoid downloading 19 MB of decorative video on compact, reduced-motion,
      // or data-saver clients. The static hero image remains visible underneath.
      const next = desktop.matches && !reducedMotion.matches && !connection?.saveData;
      setCanPlay(next);
      if (!next) setPlaying(false);
    };

    syncPlayback();
    const addMediaListener = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", syncPlayback);
      } else {
        query.addListener(syncPlayback);
      }
    };
    const removeMediaListener = (query: MediaQueryList) => {
      if (typeof query.removeEventListener === "function") {
        query.removeEventListener("change", syncPlayback);
      } else {
        query.removeListener(syncPlayback);
      }
    };

    addMediaListener(desktop);
    addMediaListener(reducedMotion);
    connection?.addEventListener?.("change", syncPlayback);

    return () => {
      removeMediaListener(desktop);
      removeMediaListener(reducedMotion);
      connection?.removeEventListener?.("change", syncPlayback);
    };
  }, []);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % VIDEOS.length);
  }, []);

  if (!canPlay) return null;

  return (
    <video
      ref={videoRef}
      key={index}
      autoPlay
      muted
      loop={VIDEOS.length === 1}
      playsInline
      preload="metadata"
      onEnded={VIDEOS.length > 1 ? advance : undefined}
      onPlaying={() => setPlaying(true)}
      aria-hidden="true"
      // Stacking comes from DOM order inside the hero's background wrapper:
      // static fallback image below, this video above it, gradient on top.
      // Fade in only once frames are actually rendering, so the handoff from
      // the static image reads as intentional rather than a brightness pop.
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:hidden ${
        playing ? "opacity-40" : "opacity-0"
      }`}
    >
      <source src={VIDEOS[index]} type="video/mp4" />
    </video>
  );
}
