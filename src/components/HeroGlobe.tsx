"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const RotatingEarth = lazy(() => import("@/components/RotatingEarth"));

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export default function HeroGlobe() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only load the heavy globe chunk on desktop-width capable clients.
    // Returning null here means the dynamic import never fires on mobile.
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop && checkWebGL()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-y-0 right-8 z-0 flex w-[48vw] max-w-[640px] items-center justify-center">
      <div className="relative h-[420px] w-[420px] lg:h-[520px] lg:w-[520px]">
        <Suspense fallback={null}>
          <RotatingEarth />
        </Suspense>
      </div>
    </div>
  );
}
