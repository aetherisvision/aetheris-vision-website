export const HERO_POSTER_SRC = "/earth-textures/hero-poster.webp";
export const HERO_EARTH_DAY_TEXTURE = "/earth-textures/day-2k.webp";
export const HERO_EARTH_NIGHT_TEXTURE = "/earth-textures/night-2k.webp";
export const HERO_EARTH_CLOUD_TEXTURE = "/earth-textures/storm-clouds-2k.webp";

export const HERO_GLOBE_SPHERE_SEGMENTS = 64;
export const HERO_GLOBE_MAX_PIXEL_RATIO = 1.5;
export const HERO_GLOBE_EARTH_RADIUS = 1.3;
export const HERO_GLOBE_NIGHT_SCALE = 1.0015;
export const HERO_GLOBE_CLOUD_SCALE = 1.004;
export const HERO_GLOBE_OBSCURED_TOP_PX = 80;
export const HERO_GLOBE_DIAMETER_RATIO = 0.86;
export const HERO_GLOBE_CAMERA_ZOOM = 182;
export const HERO_GLOBE_CAMERA_DISTANCE = 50;
export const HERO_GLOBE_ROTATION = [0.16, -0.2, -0.08] as const;
export const HERO_GLOBE_LIGHT_DIRECTION = [5, 3, 4] as const;
export const HERO_GLOBE_CLOUD_OPACITY = 0.68;
export const HERO_GLOBE_CLOUD_COLOR = "#eef8ff";

export const NIGHT_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const NIGHT_FRAGMENT_SHADER = /* glsl */ `
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

export function shouldMountHeroCanvas(options: {
  isDesktop: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  webgl2: boolean;
}): boolean {
  return options.isDesktop && !options.reducedMotion && !options.saveData && options.webgl2;
}
