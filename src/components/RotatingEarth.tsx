"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import { AdditiveBlending, SRGBColorSpace, Vector3 } from "three";
import type { Clock, Group, Texture } from "three";
import {
  HERO_EARTH_CLOUD_TEXTURE,
  HERO_EARTH_DAY_TEXTURE,
  HERO_EARTH_NIGHT_TEXTURE,
  HERO_GLOBE_CAMERA_DISTANCE,
  HERO_GLOBE_CAMERA_ZOOM,
  HERO_GLOBE_CLOUD_COLOR,
  HERO_GLOBE_CLOUD_OPACITY,
  HERO_GLOBE_CLOUD_SCALE,
  HERO_GLOBE_DIAMETER_RATIO,
  HERO_GLOBE_EARTH_RADIUS,
  HERO_GLOBE_LIGHT_DIRECTION,
  HERO_GLOBE_MAX_PIXEL_RATIO,
  HERO_GLOBE_NIGHT_SCALE,
  HERO_GLOBE_OBSCURED_TOP_PX,
  HERO_GLOBE_ROTATION,
  HERO_GLOBE_SPHERE_SEGMENTS,
  NIGHT_FRAGMENT_SHADER,
  NIGHT_VERTEX_SHADER,
  probeWebGL2Support,
} from "@/components/hero-globe-config";
import { attachHeroVisibilityObserver, restoreHeroStarTime } from "@/components/hero-globe-visibility";

const EARTH_RADIUS = HERO_GLOBE_EARTH_RADIUS;
const NIGHT_RADIUS = EARTH_RADIUS * HERO_GLOBE_NIGHT_SCALE;
const CLOUD_RADIUS = EARTH_RADIUS * HERO_GLOBE_CLOUD_SCALE;
const CAMERA_ZOOM = HERO_GLOBE_CAMERA_ZOOM;
// Orthographic distance does not affect the globe's apparent size. Keep the
// camera well outside the enlarged sphere so wide/retina viewports cannot clip
// a circular hole through its near surface.
const CAMERA_DISTANCE = HERO_GLOBE_CAMERA_DISTANCE;
// The globe's background layer fills the whole hero section, including the
// band directly behind the fixed navbar (h-20 in Navbar.tsx) — that strip is
// visually obscured even though it's part of the canvas. Excluded from the
// fit so the sphere isn't centered as if that space were visible, which cut
// off the Arctic.
const OBSCURED_TOP_PX = HERO_GLOBE_OBSCURED_TOP_PX;
const LIGHT_DIRECTION = new Vector3(...HERO_GLOBE_LIGHT_DIRECTION).normalize();
// A stalled frame must not spin the planet. This is a ceiling on one step,
// not a 30fps render loop.
const MAX_ROTATION_STEP_SECONDS = 0.05;

function configureTexture(texture: Texture, anisotropy: number) {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

function EarthMesh({ animate, onReady }: { animate: boolean; onReady?: () => void }) {
  const surfaceRef = useRef<Group>(null);
  const cloudsRef = useRef<Group>(null);
  const readyNotifiedRef = useRef(false);
  const { gl } = useThree();
  const [dayTexture, nightTexture, cloudTexture] = useTexture([
    HERO_EARTH_DAY_TEXTURE,
    HERO_EARTH_NIGHT_TEXTURE,
    HERO_EARTH_CLOUD_TEXTURE,
  ]);
  const rawAnisotropy = Number(gl.capabilities?.getMaxAnisotropy?.());
  const anisotropy =
    Number.isFinite(rawAnisotropy) && rawAnisotropy > 0 ? Math.min(16, rawAnisotropy) : 1;

  useLayoutEffect(() => {
    configureTexture(dayTexture, anisotropy);
    configureTexture(nightTexture, anisotropy);
    configureTexture(cloudTexture, anisotropy);

    const frame = requestAnimationFrame(() => {
      if (!readyNotifiedRef.current) {
        readyNotifiedRef.current = true;
        onReady?.();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [anisotropy, cloudTexture, dayTexture, nightTexture, onReady]);

  const nightUniforms = useMemo(
    () => ({
      nightMap: { value: nightTexture },
      lightDirection: { value: LIGHT_DIRECTION },
    }),
    [nightTexture],
  );

  useFrame((_, delta) => {
    if (!animate) return;
    const step = Math.min(delta, MAX_ROTATION_STEP_SECONDS);
    if (surfaceRef.current) surfaceRef.current.rotation.y += step * 0.055;
    if (cloudsRef.current) cloudsRef.current.rotation.y += step * 0.064;
  });

  return (
    <group rotation={[...HERO_GLOBE_ROTATION]}>
      <group ref={surfaceRef}>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, HERO_GLOBE_SPHERE_SEGMENTS, HERO_GLOBE_SPHERE_SEGMENTS]} />
          <meshBasicMaterial map={dayTexture} />
        </mesh>
        <mesh>
          <sphereGeometry args={[NIGHT_RADIUS, HERO_GLOBE_SPHERE_SEGMENTS, HERO_GLOBE_SPHERE_SEGMENTS]} />
          <shaderMaterial
            vertexShader={NIGHT_VERTEX_SHADER}
            fragmentShader={NIGHT_FRAGMENT_SHADER}
            uniforms={nightUniforms}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={cloudsRef}>
        <mesh>
          <sphereGeometry args={[CLOUD_RADIUS, HERO_GLOBE_SPHERE_SEGMENTS, HERO_GLOBE_SPHERE_SEGMENTS]} />
          <meshBasicMaterial
            map={cloudTexture}
            color={HERO_GLOBE_CLOUD_COLOR}
            opacity={HERO_GLOBE_CLOUD_OPACITY}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function Scene({ animate, onReady }: { animate: boolean; onReady?: () => void }) {
  const { size } = useThree();
  const framing = useMemo(() => {
    // Show the full sphere, centered within the space that's actually
    // visible (below the fixed navbar), sized to whichever dimension of
    // that space is smaller so the complete disc always fits without
    // clipping.
    const visibleHeight = size.height - OBSCURED_TOP_PX;
    const diameterPixels = Math.min(size.width, visibleHeight) * HERO_GLOBE_DIAMETER_RATIO;
    const scale = diameterPixels / (EARTH_RADIUS * 2 * CAMERA_ZOOM);
    // Shift down by half the obscured band to re-center within the visible
    // area; screen-down is negative world-Y under this camera's convention.
    const positionY = -(OBSCURED_TOP_PX / 2) / CAMERA_ZOOM;

    return { positionY, scale };
  }, [size.height, size.width]);

  return (
    <>
      <group position={[0, framing.positionY, 0]} scale={framing.scale}>
        <EarthMesh animate={animate} onReady={onReady} />
      </group>
      <Stars radius={55} depth={28} count={1800} factor={2.2} saturation={0} fade speed={0.12} />
    </>
  );
}

export default function RotatingEarth({
  onReady,
  onContextLost,
}: {
  onReady?: () => void;
  onContextLost?: () => void;
}) {
  const inViewRef = useRef(true);
  const clockRef = useRef<Clock | null>(null);
  const starTimeRef = useRef(0);
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);
  const contextLossCleanupRef = useRef<(() => void) | null>(null);
  const [inView, setInView] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasWebGL(probeWebGL2Support());
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const bindVisibilityTarget = useCallback(
    (node: HTMLDivElement | null) => {
      contextLossCleanupRef.current?.();
      contextLossCleanupRef.current = null;

      if (node) {
        const handleContextLost = (event: Event) => {
          event.preventDefault();
          setHasWebGL(false);
          onContextLost?.();
        };
        node.addEventListener("webglcontextlost", handleContextLost, true);
        contextLossCleanupRef.current = () => {
          node.removeEventListener("webglcontextlost", handleContextLost, true);
        };
      }

      visibilityObserverRef.current = attachHeroVisibilityObserver(
        node,
        visibilityObserverRef.current,
        (visible) => {
          if (visible === inViewRef.current) return;
          // Save the star clock before setFrameloop zeros it on the frameloop switch.
          if (clockRef.current) starTimeRef.current = clockRef.current.elapsedTime;
          inViewRef.current = visible;
          setInView(visible);
        },
      );
    },
    [onContextLost],
  );

  useLayoutEffect(() => {
    const clock = clockRef.current;
    if (!clock) return;
    restoreHeroStarTime(clock, starTimeRef.current, inView);
  }, [inView]);

  if (typeof window === "undefined" || reducedMotion || !hasWebGL) return null;

  const deviceRatio = window.devicePixelRatio || 1;
  const pixelRatio = Math.min(HERO_GLOBE_MAX_PIXEL_RATIO, Math.max(1, deviceRatio));

  return (
    <div ref={bindVisibilityTarget} className="relative h-full w-full" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, CAMERA_DISTANCE], zoom: CAMERA_ZOOM }}
        dpr={[1, HERO_GLOBE_MAX_PIXEL_RATIO]}
        frameloop={inView ? "always" : "never"}
        gl={{
          antialias: pixelRatio <= 1,
          alpha: true,
          precision: "highp",
          stencil: false,
        }}
        resize={{ debounce: { scroll: 50, resize: 50 } }}
        onCreated={({ clock }) => {
          clockRef.current = clock;
        }}
      >
        <Suspense fallback={null}>
          <Scene animate onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
