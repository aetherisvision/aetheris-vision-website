export const HERO_POSTER_SRC = "/earth-textures/hero-poster.webp";
/**
 * Responsive poster widths, smallest first. The largest is the file name
 * without a suffix (hero-poster.webp); the rest are hero-poster-<w>.webp.
 * All are rendered by scripts/render-hero-poster.ts from one WebGL frame.
 */
export const HERO_POSTER_WIDTHS = [512, 1024, 1800] as const;
export const HERO_POSTER_INTRINSIC_SIZE = HERO_POSTER_WIDTHS[HERO_POSTER_WIDTHS.length - 1];

export function heroPosterSrc(width: number): string {
  return width === HERO_POSTER_INTRINSIC_SIZE
    ? HERO_POSTER_SRC
    : HERO_POSTER_SRC.replace(/\.webp$/, `-${width}.webp`);
}

export const HERO_POSTER_SRCSET = HERO_POSTER_WIDTHS.map(
  (width) => `${heroPosterSrc(width)} ${width}w`,
).join(", ");

/**
 * Only large viewports show the poster (see HERO_POSTER_MEDIA). The disc is
 * 86% of the smaller hero dimension; the hero is ~830 px tall on desktop, so
 * the poster tops out around 720 CSS px and a 1x screen takes the 1024 file.
 */
export const HERO_POSTER_SIZES = "min(86vw, 720px)";

/**
 * Poster and canvas share the desktop-only gate. Below this width the hero is
 * the navy backdrop and the h1, as it was before the globe shipped, so no
 * image competes with the heading for Largest Contentful Paint on phones.
 */
export const HERO_POSTER_MEDIA = "(min-width: 1024px)";
/** Exact complement of HERO_POSTER_MEDIA (no gap at fractional widths). */
export const HERO_POSTER_SKIP_MEDIA = `not all and ${HERO_POSTER_MEDIA}`;

/**
 * A `<picture>` source matched below the desktop breakpoint. Browsers fetch an
 * `<img>` even when it is display:none, so phones are pointed at an inline
 * transparent 1x1 GIF instead of any poster file. (srcset splits on
 * whitespace, so the value must contain none.)
 */
export const HERO_POSTER_SKIP_SRC =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
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

const SOFTWARE_WEBGL_RENDERER =
  /\b(?:swiftshader|llvmpipe|softpipe|lavapipe|software rasterizer|basic render driver)\b/i;

/**
 * True when a WebGL renderer string identifies a CPU software rasterizer
 * (such as SwiftShader in Linux Chromium or llvmpipe/lavapipe in Linux Mesa)
 * rather than hardware acceleration. Privacy-sanitized or farbled strings in
 * Brave and Firefox return false so valid hardware contexts stay enabled.
 */
export function isSoftwareWebGLRenderer(renderer: unknown): boolean {
  return typeof renderer === "string" && SOFTWARE_WEBGL_RENDERER.test(renderer);
}

/**
 * Probes whether hardware-backed WebGL2 is available for the hero globe.
 * Tolerates Brave WebGL farbling and Firefox's disabled debug-renderer info
 * while rejecting lost contexts and CPU-only software rasterizers.
 */
export function probeWebGL2Support(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    if (typeof gl.isContextLost === "function" && gl.isContextLost()) {
      return false;
    }

    try {
      if (typeof gl.getParameter === "function") {
        const renderer = gl.getParameter(gl.RENDERER);
        if (isSoftwareWebGLRenderer(renderer)) return false;

        if (typeof gl.getExtension === "function") {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            const unmasked = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (isSoftwareWebGLRenderer(unmasked)) return false;
          }
        }
      }
    } catch {
      /* Brave strict farbling or Firefox privacy hooks may throw on parameter queries */
    }

    return true;
  } catch {
    return false;
  }
}

export function shouldMountHeroCanvas(options: {
  isDesktop: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  webgl2: boolean;
}): boolean {
  return options.isDesktop && !options.reducedMotion && !options.saveData && options.webgl2;
}
