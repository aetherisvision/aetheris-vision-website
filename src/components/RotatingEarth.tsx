"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import {
  AdditiveBlending,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group, MeshBasicMaterial, Texture } from "three";

const DAY_PREVIEW_TEXTURE = "/earth-textures/day-2k.webp";
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
// Orthographic distance does not affect the globe's apparent size. Keep the
// camera well outside the enlarged sphere so wide/retina viewports cannot clip
// a circular hole through its near surface.
const CAMERA_DISTANCE = 50;
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

function TextureUpgrade({
  source,
  anisotropy,
  onLoaded,
}: {
  source: string;
  anisotropy: number;
  onLoaded: (texture: Texture) => void;
}) {
  const texture = useTexture(source);

  useEffect(() => {
    configureTexture(texture, anisotropy);
    onLoaded(texture);
  }, [anisotropy, onLoaded, texture]);

  return null;
}

function NightLayer({ anisotropy }: { anisotropy: number }) {
  const nightTexture = useTexture(NIGHT_TEXTURE);

  useEffect(() => {
    configureTexture(nightTexture, anisotropy);
  }, [anisotropy, nightTexture]);

  const nightUniforms = useMemo(
    () => ({
      nightMap: { value: nightTexture },
      lightDirection: { value: LIGHT_DIRECTION },
    }),
    [nightTexture],
  );

  return (
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
  );
}

function CloudLayer({
  anisotropy,
  materialRef,
  onDetailLoaded,
}: {
  anisotropy: number;
  materialRef: RefObject<MeshBasicMaterial | null>;
  onDetailLoaded: (texture: Texture) => void;
}) {
  const cloudTexture = useTexture(CLOUD_PREVIEW_TEXTURE);

  useEffect(() => {
    configureTexture(cloudTexture, anisotropy);
  }, [anisotropy, cloudTexture]);

  return (
    <mesh>
      <sphereGeometry args={[CLOUD_RADIUS, 192, 192]} />
      <meshBasicMaterial
        ref={materialRef}
        map={cloudTexture}
        color="#eef8ff"
        opacity={0.68}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
      <Suspense fallback={null}>
        <TextureUpgrade
          source={CLOUD_DETAIL_TEXTURE}
          anisotropy={anisotropy}
          onLoaded={onDetailLoaded}
        />
      </Suspense>
    </mesh>
  );
}

function EarthMesh({ animate, onReady }: { animate: boolean; onReady?: () => void }) {
  const surfaceRef = useRef<Group>(null);
  const cloudsRef = useRef<Group>(null);
  const dayMaterialRef = useRef<MeshBasicMaterial>(null);
  const cloudMaterialRef = useRef<MeshBasicMaterial>(null);
  const readyNotifiedRef = useRef(false);
  const { gl } = useThree();
  const dayTexture = useTexture(DAY_PREVIEW_TEXTURE);
  const anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());

  useEffect(() => {
    configureTexture(dayTexture, anisotropy);

    const frame = requestAnimationFrame(() => {
      if (!readyNotifiedRef.current) {
        readyNotifiedRef.current = true;
        onReady?.();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [anisotropy, dayTexture, onReady]);

  const applyDayDetail = useCallback((detailDay: Texture) => {
    if (dayMaterialRef.current) {
      dayMaterialRef.current.map = detailDay;
      dayMaterialRef.current.needsUpdate = true;
    }
  }, []);

  const applyCloudDetail = useCallback((detailClouds: Texture) => {
    if (cloudMaterialRef.current) {
      cloudMaterialRef.current.map = detailClouds;
      cloudMaterialRef.current.needsUpdate = true;
    }
  }, []);

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
        <Suspense fallback={null}>
          <NightLayer anisotropy={anisotropy} />
        </Suspense>
      </group>

      <group ref={cloudsRef}>
        <Suspense fallback={null}>
          <CloudLayer
            anisotropy={anisotropy}
            materialRef={cloudMaterialRef}
            onDetailLoaded={applyCloudDetail}
          />
        </Suspense>
      </group>

      <Suspense fallback={null}>
        <TextureUpgrade source={DAY_DETAIL_TEXTURE} anisotropy={anisotropy} onLoaded={applyDayDetail} />
      </Suspense>
    </group>
  );
}

function Scene({ animate, onReady }: { animate: boolean; onReady?: () => void }) {
  const { size } = useThree();
  const framing = useMemo(() => {
    // Preserve the horizon treatment while revealing the northern tropics.
    const diameterPixels = Math.max(size.width * 1.08, size.height * 1.5);
    const scale = diameterPixels / (EARTH_RADIUS * 2 * CAMERA_ZOOM);
    const horizonTopPixels = size.height * 0.04;
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
        camera={{ position: [0, 0, CAMERA_DISTANCE], zoom: CAMERA_ZOOM }}
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
