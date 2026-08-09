"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VIDEOS = ["/hero-1.mp4", "/hero-2.mp4"];

export default function HeroVideo() {
  // Keep the first render deterministic so the server and client hydrate with
  // the same source. Subsequent clips still rotate when playback completes.
  const [index, setIndex] = useState(0);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }).connection;

    const syncPlayback = () => {
      // Avoid downloading 41 MB of decorative video on compact, reduced-motion,
      // or data-saver clients. The static hero image remains visible underneath.
      setCanPlay(desktop.matches && !reducedMotion.matches && !connection?.saveData);
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
      playsInline
      preload="metadata"
      onEnded={advance}
      aria-hidden="true"
      className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30 motion-reduce:hidden"
    >
      <source src={VIDEOS[index]} type="video/mp4" />
    </video>
  );
}
