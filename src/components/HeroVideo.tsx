"use client";

import { useCallback, useRef, useState } from "react";

const VIDEOS = ["/hero-1.mp4", "/hero-2.mp4"];

export default function HeroVideo() {
  // Keep the first render deterministic so the server and client hydrate with
  // the same source. Subsequent clips still rotate when playback completes.
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % VIDEOS.length);
  }, []);

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
