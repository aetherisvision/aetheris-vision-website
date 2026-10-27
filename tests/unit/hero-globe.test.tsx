import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { shouldMountHeroCanvas } from "@/components/hero-globe-config";
import SatelliteDisplay from "@/components/SatelliteDisplay";

vi.mock("@/components/RotatingEarth", () => {
  const React = require("react") as typeof import("react");
  return {
    default: function MockEarth({ onReady }: { onReady?: () => void }) {
      React.useEffect(() => {
        onReady?.();
      }, [onReady]);
      return React.createElement("div", { "data-testid": "rotating-earth" });
    },
  };
});

import HeroGlobe from "@/components/HeroGlobe";

const root = process.cwd();

function installMatchMedia(matches: (query: string) => boolean) {
  window.matchMedia = ((query: string) => ({
    matches: matches(query),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

function installConnection(saveData: boolean) {
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: { saveData },
  });
}

describe("shouldMountHeroCanvas", () => {
  const eligible = {
    isDesktop: true,
    reducedMotion: false,
    saveData: false,
    webgl2: true,
  };

  it("mounts only when every existing gate passes", () => {
    expect(shouldMountHeroCanvas(eligible)).toBe(true);
    expect(shouldMountHeroCanvas({ ...eligible, isDesktop: false })).toBe(false);
    expect(shouldMountHeroCanvas({ ...eligible, reducedMotion: true })).toBe(false);
    expect(shouldMountHeroCanvas({ ...eligible, saveData: true })).toBe(false);
    expect(shouldMountHeroCanvas({ ...eligible, webgl2: false })).toBe(false);
  });
});

describe("HeroGlobe", () => {
  beforeEach(() => {
    installConnection(false);
    installMatchMedia(() => false);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  it("shows the poster and skips the canvas for reduced motion", () => {
    installMatchMedia((query) => query === "(min-width: 1024px)" || query === "(prefers-reduced-motion: reduce)");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
      type === "webgl2" ? ({} as WebGL2RenderingContext) : null) as typeof HTMLCanvasElement.prototype.getContext);

    render(<HeroGlobe />);

    const poster = document.querySelector("img");
    expect(poster?.getAttribute("src")).toBe("/earth-textures/hero-poster.webp");
    expect(poster?.closest("div")?.className).toContain("opacity-100");
    expect(screen.queryByTestId("rotating-earth")).toBeNull();
  });

  it("shows the poster and skips the canvas for phones, save-data, and missing WebGL2", () => {
    installMatchMedia(() => false);
    installConnection(true);
    render(<HeroGlobe />);
    expect(document.querySelector("img")?.getAttribute("src")).toBe("/earth-textures/hero-poster.webp");
    expect(screen.queryByTestId("rotating-earth")).toBeNull();
  });

  it("loads the globe only after the gate passes, then crossfades off the poster", async () => {
    installMatchMedia((query) => query === "(min-width: 1024px)");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
      type === "webgl2" ? ({} as WebGL2RenderingContext) : null) as typeof HTMLCanvasElement.prototype.getContext);

    render(<HeroGlobe />);

    expect(await screen.findByTestId("rotating-earth")).toBeInTheDocument();
    const poster = document.querySelector("img");
    expect(poster?.closest("div")?.className).toContain("opacity-0");
  });
});

describe("hero globe source", () => {
  const earth = readFileSync(join(root, "src/components/RotatingEarth.tsx"), "utf8");
  const hero = readFileSync(join(root, "src/components/HeroGlobe.tsx"), "utf8");
  const page = readFileSync(join(root, "src/app/page.tsx"), "utf8");

  it("keeps the 2K maps and does not idle-swap to 8K", () => {
    expect(earth).not.toMatch(/8k\.webp/);
    expect(earth).not.toMatch(/requestIdleCallback/);
    expect(earth).toContain("HERO_EARTH_DAY_TEXTURE");
    expect(earth).toContain("HERO_EARTH_CLOUD_TEXTURE");
  });

  it("caps pixel ratio and turns multisampling off above 1x", () => {
    expect(earth).toContain("dpr={[1, HERO_GLOBE_MAX_PIXEL_RATIO]}");
    expect(earth).toContain("antialias: pixelRatio <= 1");
    expect(earth).not.toContain("powerPreference");
    expect(earth).not.toContain("2.25");
  });

  it("pauses drawing off screen without switching to a demand loop", () => {
    expect(earth).toContain('frameloop={inView ? "always" : "never"}');
    expect(earth).not.toContain('frameloop="demand"');
  });

  it("code-splits the 3D stack and shows the poster first", () => {
    expect(hero).toContain('from "next/dynamic"');
    expect(hero).toContain("ssr: false");
    expect(hero).toContain("{showCanvas ? (");
    expect(hero).toContain("HERO_POSTER_SRC");
    expect(page).toContain('href="/earth-textures/hero-poster.webp"');
  });

  it("uses 64 segments on the sphere geometry", () => {
    expect(earth).toContain("HERO_GLOBE_SPHERE_SEGMENTS");
    expect(earth).not.toMatch(/192,\s*192/);
  });

  it("ships a poster still of the earth", () => {
    const stat = statSync(join(root, "public/earth-textures/hero-poster.webp"));
    expect(stat.size).toBeGreaterThan(20_000);
    expect(stat.size).toBeLessThan(800_000);
  });
});

describe("SatelliteDisplay", () => {
  it("does not eagerly preload the GOES frames", () => {
    render(
      <SatelliteDisplay
        sources={[
          { url: "/api/satellite?url=https%3A%2F%2Fexample.test%2Feast.jpg", label: "GOES East", region: "Atlantic" },
          { url: "/api/satellite?url=https%3A%2F%2Fexample.test%2Fwest.jpg", label: "GOES West", region: "Pacific" },
        ]}
      />,
    );

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    for (const img of images) {
      expect(img).toHaveAttribute("loading", "lazy");
    }
  });
});
