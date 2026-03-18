"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import type { Mesh } from "three";

function EarthMesh({ animate }: { animate: boolean }) {
  const meshRef = useRef<Mesh>(null);
  const texture = useTexture("/earth-day.jpg");

  useFrame((_, delta) => {
    if (animate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    // Outer group handles axial tilt; inner mesh handles spin
    <group rotation={[0.2, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.3, 64, 64]} />
        <meshStandardMaterial map={texture} metalness={0.05} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Scene({ animate }: { animate: boolean }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 3, 4]} intensity={3.5} />
      <directionalLight position={[-4, -1, -3]} intensity={0.15} />
      <Suspense fallback={null}>
        <EarthMesh animate={animate} />
      </Suspense>
      <Stars radius={60} depth={30} count={2500} factor={2.6} saturation={0} fade speed={0.2} />
    </>
  );
}

export default function RotatingEarth() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
      if (!ctx) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      media.addListener(onChange);
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      return () => media.removeListener(onChange);
    }
  }, []);

  const dpr = useMemo(() => [1, 1.5] as [number, number], []);

  if (reducedMotion || !hasWebGL) {
    return (
      <div
        className="relative h-full w-full rounded-full border border-white/10 bg-gradient-to-br from-blue-600/70 via-blue-900/40 to-black/70"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], zoom: 130 }}
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        resize={{ debounce: { scroll: 50, resize: 50 } }}
      >
        <Scene animate />
      </Canvas>
    </div>
  );
}
