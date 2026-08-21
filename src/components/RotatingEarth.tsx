"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  Color,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group, Mesh, Texture } from "three";

const DAY_TEXTURE = "/earth-textures/day-4k.webp";
const NIGHT_TEXTURE = "/earth-textures/night-2k.webp";
const CLOUD_TEXTURE = "/earth-textures/clouds-4k.webp";
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

const ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
  varying float vIntensity;

  void main() {
    vec3 viewNormal = normalize(normalMatrix * normal);
    vec3 viewPosition = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    vIntensity = pow(max(0.0, 0.72 + dot(viewNormal, viewPosition)), 2.4);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 glowColor;
  varying float vIntensity;

  void main() {
    gl_FragColor = vec4(glowColor, vIntensity * 0.48);
  }
`;

function configureTexture(texture: Texture, anisotropy: number) {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

function EarthMesh({ animate }: { animate: boolean }) {
  const surfaceRef = useRef<Group>(null);
  const cloudsRef = useRef<Mesh>(null);
  const { gl } = useThree();
  const [dayTexture, nightTexture, cloudTexture] = useTexture([
    DAY_TEXTURE,
    NIGHT_TEXTURE,
    CLOUD_TEXTURE,
  ]);

  useEffect(() => {
    const anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    configureTexture(dayTexture, anisotropy);
    configureTexture(nightTexture, anisotropy);
    configureTexture(cloudTexture, anisotropy);
  }, [cloudTexture, dayTexture, gl, nightTexture]);

  const nightUniforms = useMemo(
    () => ({
      nightMap: { value: nightTexture },
      lightDirection: { value: LIGHT_DIRECTION },
    }),
    [nightTexture],
  );
  const atmosphereUniforms = useMemo(
    () => ({ glowColor: { value: new Color("#559bd1") } }),
    [],
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
          <sphereGeometry args={[1.3, 128, 128]} />
          <meshStandardMaterial map={dayTexture} metalness={0} roughness={0.9} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.304, 128, 128]} />
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
        <sphereGeometry args={[1.318, 128, 128]} />
        <meshBasicMaterial
          map={cloudTexture}
          color="#dceeff"
          opacity={0.32}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh scale={1.075}>
        <sphereGeometry args={[1.3, 128, 128]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERTEX_SHADER}
          fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
          uniforms={atmosphereUniforms}
          side={BackSide}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Scene({ animate }: { animate: boolean }) {
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 3, 4]} color="#d8efff" intensity={2.5} />
      <EarthMesh animate={animate} />
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

export default function RotatingEarth() {
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
        camera={{ position: [0, 0, 5], zoom: 182 }}
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
        <Scene animate />
      </Canvas>
    </div>
  );
}
