"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HERO_GLOBE_CLOUD_SCALE,
  HERO_GLOBE_DIAMETER_RATIO,
  HERO_GLOBE_OBSCURED_TOP_PX,
  HERO_POSTER_INTRINSIC_SIZE,
  HERO_POSTER_MEDIA,
  HERO_POSTER_SIZES,
  HERO_POSTER_SKIP_MEDIA,
  HERO_POSTER_SKIP_SRC,
  HERO_POSTER_SRC,
  HERO_POSTER_SRCSET,
  probeWebGL2Support,
  shouldMountHeroCanvas,
} from "@/components/hero-globe-config";

const RotatingEarth = dynamic(() => import("@/components/RotatingEarth"), {
  ssr: false,
});

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

const POSTER_WIDTH = `min(calc(${HERO_GLOBE_DIAMETER_RATIO * 100}cqw * ${HERO_GLOBE_CLOUD_SCALE}), calc((100cqh - ${HERO_GLOBE_OBSCURED_TOP_PX}px) * ${HERO_GLOBE_DIAMETER_RATIO} * ${HERO_GLOBE_CLOUD_SCALE}))`;

export default function HeroGlobe() {
  const [showCanvas, setShowCanvas] = useState(false);
  const [ready, setReady] = useState(false);
  const contextLostRef = useRef(false);
  const handleReady = useCallback(() => setReady(true), []);
  const handleContextLost = useCallback(() => {
    contextLostRef.current = true;
    setReady(false);
    setShowCanvas(false);
  }, []);

  useEffect(() => {
    // Phone width, save-data, and missing WebGL2 are read once. Reduced motion
    // stays live: turning it on after the globe is ready must take the canvas
    // down and bring the poster back, and turning it off mounts a new canvas
    // unless the WebGL context was already lost.
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
    let webgl2Checked = false;
    let webgl2 = false;

    const applyGate = () => {
      const reducedMotion = motionQuery.matches;
      if (isDesktop && !reducedMotion && !saveData && !webgl2Checked) {
        webgl2Checked = true;
        webgl2 = probeWebGL2Support();
      }
      const mount = shouldMountHeroCanvas({
        isDesktop,
        reducedMotion,
        saveData,
        webgl2: webgl2 && !contextLostRef.current,
      });
      setShowCanvas(mount);
      if (!mount) setReady(false);
    };

    applyGate();
    motionQuery.addEventListener("change", applyGate);
    return () => motionQuery.removeEventListener("change", applyGate);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        data-testid="hero-poster"
        className={`absolute inset-0 hidden transition-opacity duration-100 lg:block ${ready ? "opacity-0" : "opacity-100"}`}
        style={{ containerType: "size" }}
      >
        {/* The box owns the geometry: a square sized like the canvas disc, so
            the image can never reflow it while loading (CLS 0). */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: POSTER_WIDTH,
            aspectRatio: "1 / 1",
            top: `calc(50% + ${HERO_GLOBE_OBSCURED_TOP_PX / 2}px)`,
          }}
        >
          {/* Plain img so the disc can use the same fit as the canvas. next/image's
              wrapper would change that box. The 1.004 scale matches the cloud shell. */}
          <picture>
            <source media={HERO_POSTER_SKIP_MEDIA} srcSet={HERO_POSTER_SKIP_SRC} />
            <source
              media={HERO_POSTER_MEDIA}
              type="image/webp"
              srcSet={HERO_POSTER_SRCSET}
              sizes={HERO_POSTER_SIZES}
            />
            <img
              src={HERO_POSTER_SRC}
              alt=""
              width={HERO_POSTER_INTRINSIC_SIZE}
              height={HERO_POSTER_INTRINSIC_SIZE}
              fetchPriority="high"
              decoding="async"
              draggable={false}
              className="block h-full w-full max-w-none"
            />
          </picture>
        </div>
      </div>
      {showCanvas ? (
        <div
          className={`absolute inset-0 transition-opacity duration-100 ${ready ? "opacity-100" : "opacity-0"}`}
        >
          <RotatingEarth onReady={handleReady} onContextLost={handleContextLost} />
        </div>
      ) : null}
    </div>
  );
}
