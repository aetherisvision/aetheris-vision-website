/**
 * Render the hero poster with the same three.js materials as RotatingEarth.
 * The still is the initial rotation only: day, night lights, and clouds.
 *
 *   npx tsx scripts/render-hero-poster.ts
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "@playwright/test";
import {
  HERO_EARTH_CLOUD_TEXTURE,
  HERO_EARTH_DAY_TEXTURE,
  HERO_EARTH_NIGHT_TEXTURE,
  HERO_GLOBE_CAMERA_DISTANCE,
  HERO_GLOBE_CLOUD_COLOR,
  HERO_GLOBE_CLOUD_OPACITY,
  HERO_GLOBE_CLOUD_SCALE,
  HERO_GLOBE_EARTH_RADIUS,
  HERO_GLOBE_LIGHT_DIRECTION,
  HERO_GLOBE_NIGHT_SCALE,
  HERO_GLOBE_ROTATION,
  NIGHT_FRAGMENT_SHADER,
  NIGHT_VERTEX_SHADER,
} from "../src/components/hero-globe-config";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SIZE = 1800;
const OUT = join(ROOT, "public/earth-textures/hero-poster.webp");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
};

function pageHtml(): string {
  const config = {
    size: SIZE,
    day: HERO_EARTH_DAY_TEXTURE,
    night: HERO_EARTH_NIGHT_TEXTURE,
    clouds: HERO_EARTH_CLOUD_TEXTURE,
    earthRadius: HERO_GLOBE_EARTH_RADIUS,
    nightScale: HERO_GLOBE_NIGHT_SCALE,
    cloudScale: HERO_GLOBE_CLOUD_SCALE,
    cameraDistance: HERO_GLOBE_CAMERA_DISTANCE,
    rotation: HERO_GLOBE_ROTATION,
    light: HERO_GLOBE_LIGHT_DIRECTION,
    cloudColor: HERO_GLOBE_CLOUD_COLOR,
    cloudOpacity: HERO_GLOBE_CLOUD_OPACITY,
    nightVertex: NIGHT_VERTEX_SHADER,
    nightFragment: NIGHT_FRAGMENT_SHADER,
  };

  return `<!doctype html>
<html>
<body style="margin:0;background:transparent">
<script type="importmap">
{ "imports": { "three": "/vendor/three/build/three.module.js" } }
</script>
<script type="module">
import * as THREE from "three";
const config = ${JSON.stringify(config)};

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: false,
  preserveDrawingBuffer: true,
  precision: "highp",
  stencil: false,
});
renderer.setPixelRatio(1);
renderer.setSize(config.size, config.size, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
camera.position.set(0, 0, config.cameraDistance);
camera.zoom = 1 / (config.earthRadius * config.cloudScale);
camera.updateProjectionMatrix();

const scene = new THREE.Scene();
const earth = new THREE.Group();
earth.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
scene.add(earth);

const loader = new THREE.TextureLoader();
function load(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

const [dayMap, nightMap, cloudMap] = await Promise.all([
  load(config.day),
  load(config.night),
  load(config.clouds),
]);

const anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
for (const texture of [dayMap, nightMap, cloudMap]) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

const segments = 64;
const light = new THREE.Vector3(config.light[0], config.light[1], config.light[2]).normalize();

const day = new THREE.Mesh(
  new THREE.SphereGeometry(config.earthRadius, segments, segments),
  new THREE.MeshBasicMaterial({ map: dayMap }),
);
const night = new THREE.Mesh(
  new THREE.SphereGeometry(config.earthRadius * config.nightScale, segments, segments),
  new THREE.ShaderMaterial({
    vertexShader: config.nightVertex,
    fragmentShader: config.nightFragment,
    uniforms: {
      nightMap: { value: nightMap },
      lightDirection: { value: light },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }),
);
const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(config.earthRadius * config.cloudScale, segments, segments),
  new THREE.MeshBasicMaterial({
    map: cloudMap,
    color: config.cloudColor,
    opacity: config.cloudOpacity,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }),
);
earth.add(day, night, clouds);
renderer.render(scene, camera);

const copy = document.createElement("canvas");
copy.width = config.size;
copy.height = config.size;
const ctx = copy.getContext("2d");
if (!ctx) throw new Error("2d canvas unavailable");
ctx.drawImage(renderer.domElement, 0, 0);
window.__posterPng = copy.toDataURL("image/png");
window.__posterReady = true;
</script>
</body>
</html>`;
}

function startServer(html: string): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/poster.html") {
      response.writeHead(200, { "content-type": MIME[".html"] });
      response.end(html);
      return;
    }

    const file = url.pathname.startsWith("/vendor/three/")
      ? join(ROOT, "node_modules/three", url.pathname.slice("/vendor/three".length))
      : url.pathname.startsWith("/earth-textures/")
        ? join(ROOT, "public", url.pathname)
        : "";

    if (!file) {
      response.writeHead(404);
      response.end();
      return;
    }

    try {
      const body = readFileSync(file);
      response.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Poster server did not bind");
      resolve({
        url: `http://127.0.0.1:${address.port}/poster.html`,
        close: () =>
          new Promise((done, reject) => {
            server.close((error) => (error ? reject(error) : done()));
          }),
      });
    });
  });
}

async function main() {
  const html = pageHtml();
  const server = await startServer(html);
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--use-angle=swiftshader"],
  });

  try {
    const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () => (window as unknown as { __posterReady?: boolean }).__posterReady === true,
      { timeout: 30_000 },
    );
    const dataUrl = await page.evaluate(
      () => (window as unknown as { __posterPng: string }).__posterPng,
    );
    const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const center = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels;
    if ((data[center + 3] ?? 0) < 200) {
      throw new Error("Poster center is transparent. WebGL did not draw the earth.");
    }

    await sharp(png)
      .webp({ quality: 90, alphaQuality: 100, effort: 6, smartSubsample: true })
      .toFile(OUT);

    const stat = await sharp(OUT).metadata();
    console.log(`wrote ${OUT} ${stat.width}x${stat.height} ${stat.format}`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
