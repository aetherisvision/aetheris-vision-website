"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const RotatingEarth = lazy(() => import("@/components/RotatingEarth"));

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

function supportsWebGL2(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export default function HeroGlobe() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Preserve the static hero for smaller screens, reduced-motion users,
    // data-saver clients, and browsers without the WebGL2 required by Three.js.
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;

    if (isDesktop && !reducedMotion && !saveData && supportsWebGL2()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#06101e]/75" />
      <div className="absolute left-[49%] top-1/2 h-[clamp(42rem,66vw,58rem)] w-[clamp(42rem,66vw,58rem)] -translate-y-1/2 opacity-95 xl:left-[54%]">
        <Suspense fallback={null}>
          <RotatingEarth />
        </Suspense>
      </div>
    </div>
  );
}
