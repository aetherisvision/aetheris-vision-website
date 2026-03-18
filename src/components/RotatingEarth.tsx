"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { AdditiveBlending, CanvasTexture, RepeatWrapping } from "three";
import type { Group, MeshStandardMaterial } from "three";

type WeatherMode = "calm" | "stormy" | "temperature";

type WeatherModeConfig = {
  mode: WeatherMode;
  label: string;
  cloudThreshold: number;
  cloudBoost: number;
  precipThreshold: number;
  precipBoost: number;
  tintBlue: number;
  tintGreenDrop: number;
  alphaScale: number;
  overlayOpacity: number;
  speed: number;
};

const WEATHER_MODES: WeatherModeConfig[] = [
  {
    mode: "calm",
    label: "Simulated Mode: Calm",
    cloudThreshold: 0.36,
    cloudBoost: 1.3,
    precipThreshold: 0.72,
    precipBoost: 1.7,
    tintBlue: 0.16,
    tintGreenDrop: 10,
    alphaScale: 145,
    overlayOpacity: 0.2,
    speed: 0.008,
  },
  {
    mode: "stormy",
    label: "Simulated Mode: Stormy",
    cloudThreshold: 0.22,
    cloudBoost: 1.9,
    precipThreshold: 0.51,
    precipBoost: 3.2,
    tintBlue: 0.34,
    tintGreenDrop: 24,
    alphaScale: 195,
    overlayOpacity: 0.38,
    speed: 0.017,
  },
  {
    mode: "temperature",
    label: "Simulated Mode: Temperature Bands",
    cloudThreshold: 0.4,
    cloudBoost: 1.1,
    precipThreshold: 0.76,
    precipBoost: 1.5,
    tintBlue: 0.45,
    tintGreenDrop: 6,
    alphaScale: 135,
    overlayOpacity: 0.3,
    speed: 0.005,
  },
];

function hashNoise(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + 58.5453123) * 43758.5453123;
  return value - Math.floor(value);
}

function createWeatherTexture(config: WeatherModeConfig, width = 320, height = 160): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    const fallbackCanvas = document.createElement("canvas");
    return new CanvasTexture(fallbackCanvas);
  }

  const image = context.createImageData(width, height);
  const data = image.data;

  for (let y = 0; y < height; y += 1) {
    const latitude = Math.abs((y / (height - 1)) * 2 - 1);
    const tropicalBelt = Math.exp(-Math.pow(latitude - 0.18, 2) / 0.0065);
    const midLatitudeBelt = Math.exp(-Math.pow(latitude - 0.52, 2) / 0.0125);
    const beltStrength = Math.min(1, tropicalBelt * 0.8 + midLatitudeBelt * 0.7);

    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const xNorm = x / width;
      const yNorm = y / height;

      const wave1 = Math.sin((xNorm * 14.3 + yNorm * 5.1) * Math.PI * 2);
      const wave2 = Math.sin((xNorm * 31.7 - yNorm * 11.4) * Math.PI * 2);
      const wave3 = Math.sin((xNorm * 7.8 + yNorm * 23.8) * Math.PI * 2);
      const baseNoise = hashNoise(xNorm * 180, yNorm * 180) * 2 - 1;
      const fineNoise = hashNoise(xNorm * 420 + 13, yNorm * 420 + 9) * 2 - 1;

      const structure = wave1 * 0.34 + wave2 * 0.26 + wave3 * 0.2 + baseNoise * 0.16 + fineNoise * 0.04;
      const cloudField = structure * 0.5 + beltStrength * 0.78;

      const cloudAlpha = Math.max(0, Math.min(1, (cloudField - config.cloudThreshold) * config.cloudBoost));
      const precipSignal = Math.max(0, Math.min(1, (cloudField - config.precipThreshold) * config.precipBoost));

      const temperatureBands = Math.sin((yNorm * 9.2 + xNorm * 1.2) * Math.PI * 2) * 0.5 + 0.5;

      const cloudBrightness = 165 + cloudAlpha * 75;
      const precipTint = 55 + precipSignal * 145;

      const redMix = config.mode === "temperature" ? 55 + temperatureBands * 150 : cloudBrightness;
      const greenMix = cloudBrightness - precipSignal * config.tintGreenDrop;
      const blueMix = cloudBrightness + precipTint * config.tintBlue;

      data[idx] = Math.round(redMix);
      data[idx + 1] = Math.round(greenMix);
      data[idx + 2] = Math.round(blueMix);
      data[idx + 3] = Math.round(Math.max(cloudAlpha * config.alphaScale, precipSignal * (config.alphaScale + 20)));
    }
  }

  context.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;

  return texture;
}

function EarthModel({ animate, mode }: { animate: boolean; mode: WeatherModeConfig }) {
  const earthRef = useRef<Group>(null);
  const cloudsRef = useRef<Group>(null);
  const weatherRef = useRef<MeshStandardMaterial>(null);

  const weatherTexture = useMemo(() => createWeatherTexture(mode), [mode]);

  useFrame((_, delta) => {
    if (!animate) return;

    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.18;
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.24;
    }

    if (weatherRef.current?.map) {
      weatherRef.current.map.offset.x -= delta * mode.speed;
    }
  });

  useEffect(() => {
    return () => {
      weatherTexture.dispose();
    };
  }, [weatherTexture]);

  return (
    <group rotation={[0.15, -0.55, 0]}>
      <group ref={earthRef}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1.3, 64, 64]} />
          <meshStandardMaterial color="#1d4ed8" metalness={0.08} roughness={0.8} emissive="#1e40af" emissiveIntensity={0.22} />
        </mesh>

        <mesh>
          <sphereGeometry args={[1.302, 64, 64]} />
          <meshStandardMaterial color="#0f172a" transparent opacity={0.3} metalness={0} roughness={1} />
        </mesh>
      </group>

      <group ref={cloudsRef}>
        <mesh>
          <sphereGeometry args={[1.335, 48, 48]} />
          <meshStandardMaterial color="#e5e7eb" transparent opacity={0.16} depthWrite={false} roughness={1} />
        </mesh>
      </group>

      <mesh>
        <sphereGeometry args={[1.345, 64, 64]} />
        <meshStandardMaterial
          ref={weatherRef}
          color="#dbeafe"
          transparent
          opacity={mode.overlayOpacity}
          depthWrite={false}
          roughness={1}
          metalness={0}
          map={weatherTexture}
          alphaMap={weatherTexture}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Scene({ animate, mode }: { animate: boolean; mode: WeatherModeConfig }) {

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 2, 4]} intensity={2.1} />
      <directionalLight position={[-3, -1, -3]} intensity={0.35} />
      <EarthModel animate={animate} mode={mode} />
      <Stars radius={60} depth={30} count={2500} factor={2.6} saturation={0} fade speed={0.2} />
    </>
  );
}

export default function RotatingEarth() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [modeIndex, setModeIndex] = useState(0);
  const activeMode = WEATHER_MODES[modeIndex];

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
    // Safari < 14 uses addListener/removeListener
    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      media.addListener(onChange);
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        media.removeListener(onChange);
      };
    }
  }, []);

  const dpr = useMemo(() => [1, 1.5] as [number, number], []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setModeIndex((current) => (current + 1) % WEATHER_MODES.length);
    }, 12000);

    return () => window.clearInterval(interval);
  }, []);

  if (reducedMotion || !hasWebGL) {
    return (
      <div className="relative h-full w-full rounded-full border border-white/10 bg-gradient-to-br from-blue-600/70 via-blue-900/40 to-black/70" aria-hidden="true" />
    );
  }

  return (
    <>
      {/* Screen-reader disclosure: outside aria-hidden so assistive tech can read it */}
      <span className="sr-only">{activeMode.label}</span>
      <div className="relative h-full w-full" aria-hidden="true">
        <Suspense fallback={null}>
          <Canvas
            camera={{ position: [0, 0, 3.8], fov: 35 }}
            dpr={dpr}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            resize={{ debounce: { scroll: 50, resize: 50 } }}
          >
            <Scene animate mode={activeMode} />
          </Canvas>
        </Suspense>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-wider text-gray-300 backdrop-blur-sm">
          {activeMode.label}
        </div>
      </div>
    </>
  );
}
