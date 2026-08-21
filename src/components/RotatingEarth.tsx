"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import {
  AdditiveBlending,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group, Mesh, MeshBasicMaterial, Texture } from "three";

const DAY_PREVIEW_TEXTURE = "/earth-textures/day-4k.webp";
const DAY_DETAIL_TEXTURE = "/earth-textures/day-8k.webp";
const NIGHT_TEXTURE = "/earth-textures/night-2k.webp";
const CLOUD_PREVIEW_TEXTURE = "/earth-textures/storm-clouds-4k.webp";
const CLOUD_DETAIL_TEXTURE = "/earth-textures/storm-clouds-8k.webp";
const EARTH_RADIUS = 1.3;
// Keep transparent detail layers nearly flush with the surface so their
// silhouettes read as one planet instead of concentric circles.
const NIGHT_RADIUS = EARTH_RADIUS * 1.0015;
const CLOUD_RADIUS = EARTH_RADIUS * 1.004;
const CAMERA_ZOOM = 182;
const LIGHT_DIRECTION = new Vector3(5, 3, 4).normalize();

const NIGHT_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NIGHT_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D nightMap;
  uniform vec3 lightDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vec3 nightColor = texture2D(nightMap, vUv).rgb;
    float luminance = dot(nightColor, vec3(0.2126, 0.7152, 0.0722));
    float daylight = dot(normalize(vWorldNormal), normalize(lightDirection));
    float nightSide = 1.0 - smoothstep(-0.12, 0.28, daylight);
    float lights = smoothstep(0.025, 0.34, luminance);

    gl_FragColor = vec4(nightColor * 1.35, nightSide * lights * 0.95);
  }
`;

function configureTexture(texture: Texture, anisotropy: number) {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

function DetailTextureUpgrade({
  anisotropy,
  onLoaded,
}: {
  anisotropy: number;
  onLoaded: (dayTexture: Texture, cloudTexture: Texture) => void;
}) {
  const [dayTexture, cloudTexture] = useTexture([DAY_DETAIL_TEXTURE, CLOUD_DETAIL_TEXTURE]);

  useEffect(() => {
    configureTexture(dayTexture, anisotropy);
    configureTexture(cloudTexture, anisotropy);
    onLoaded(dayTexture, cloudTexture);
  }, [anisotropy, cloudTexture, dayTexture, onLoaded]);

  return null;
}

function EarthMesh({ animate, onReady }: { animate: boolean; onReady?: () => void }) {
  const surfaceRef = useRef<Group>(null);
  const cloudsRef = useRef<Mesh>(null);
  const dayMaterialRef = useRef<MeshBasicMaterial>(null);
  const cloudMaterialRef = useRef<MeshBasicMaterial>(null);
  const readyNotifiedRef = useRef(false);
  const { gl } = useThree();
  const [dayTexture, nightTexture, cloudTexture] = useTexture([
    DAY_PREVIEW_TEXTURE,
    NIGHT_TEXTURE,
    CLOUD_PREVIEW_TEXTURE,
  ]);
  const anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());

  useEffect(() => {
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

  const applyDetailTextures = useCallback((detailDay: Texture, detailClouds: Texture) => {
    if (dayMaterialRef.current) {
      dayMaterialRef.current.map = detailDay;
      dayMaterialRef.current.needsUpdate = true;
    }
    if (cloudMaterialRef.current) {
      cloudMaterialRef.current.map = detailClouds;
      cloudMaterialRef.current.needsUpdate = true;
    }
  }, []);

  const nightUniforms = useMemo(
    () => ({
      nightMap: { value: nightTexture },
      lightDirection: { value: LIGHT_DIRECTION },
    }),
    [nightTexture],
  );
  useFrame((_, delta) => {
    if (!animate) return;
    if (surfaceRef.current) surfaceRef.current.rotation.y += delta * 0.055;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.064;
  });

  return (
    <group rotation={[0.16, -0.2, -0.08]}>
      <group ref={surfaceRef}>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 192, 192]} />
          <meshBasicMaterial
            ref={dayMaterialRef}
            map={dayTexture}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[NIGHT_RADIUS, 192, 192]} />
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

      <mesh ref={cloudsRef}>
        <sphereGeometry args={[CLOUD_RADIUS, 192, 192]} />
        <meshBasicMaterial
          ref={cloudMaterialRef}
          map={cloudTexture}
          color="#eef8ff"
          opacity={0.68}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Suspense fallback={null}>
        <DetailTextureUpgrade anisotropy={anisotropy} onLoaded={applyDetailTextures} />
      </Suspense>
    </group>
  );
}

function Scene({ animate, onReady }: { animate: boolean; onReady?: () => void }) {
  const { size } = useThree();
  const framing = useMemo(() => {
    // Keep the globe large enough to read as a horizon, but reveal substantially
    // more of the northern hemisphere behind the principal profile.
    const diameterPixels = Math.max(size.width * 1.28, size.height * 1.75);
    const scale = diameterPixels / (EARTH_RADIUS * 2 * CAMERA_ZOOM);
    // Lift the globe by another 10% of the hero height so more of the
    // northern hemisphere remains visible behind the profile.
    const horizonTopPixels = size.height * 0.15;
    const horizonTopWorld = (size.height * 0.5 - horizonTopPixels) / CAMERA_ZOOM;

    return {
      positionY: horizonTopWorld - EARTH_RADIUS * scale,
      scale,
    };
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

function supportsWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export default function RotatingEarth({ onReady }: { onReady?: () => void }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasWebGL(supportsWebGL2());
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  if (reducedMotion || !hasWebGL) return null;

  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], zoom: CAMERA_ZOOM }}
        dpr={2.25}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          precision: "highp",
          stencil: false,
        }}
        resize={{ debounce: { scroll: 50, resize: 50 } }}
      >
        <Scene animate onReady={onReady} />
      </Canvas>
    </div>
  );
}
