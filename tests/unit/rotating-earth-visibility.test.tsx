import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import type { Clock } from "three";

const harness = vi.hoisted(() => ({
  clock: null as Clock | null,
}));

vi.mock("@react-three/fiber", () => {
  // Vitest hoists this factory above imports, so these modules are loaded with require.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react") as typeof import("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Clock } = require("three") as typeof import("three");

  return {
    Canvas: ({
      frameloop,
      onCreated,
      children,
    }: {
      frameloop?: string;
      onCreated?: (state: { clock: Clock }) => void;
      children?: import("react").ReactNode;
    }) => {
      const clockRef = React.useRef<Clock | null>(null);
      if (!clockRef.current) {
        const clock = new Clock(false);
        clock.start();
        clockRef.current = clock;
        harness.clock = clock;
      }

      React.useLayoutEffect(() => {
        const clock = clockRef.current;
        if (clock) onCreated?.({ clock });
      }, [onCreated]);

      React.useLayoutEffect(() => {
        const clock = clockRef.current;
        if (!clock) return;
        clock.stop();
        clock.elapsedTime = 0;
        if (frameloop !== "never") {
          clock.start();
          clock.elapsedTime = 0;
        }
      }, [frameloop]);

      return React.createElement(
        "div",
        { "data-testid": "canvas", "data-frameloop": frameloop },
        children,
      );
    },
    useFrame: () => undefined,
    useThree: () => ({
      gl: { capabilities: { getMaxAnisotropy: () => 8 } },
      size: { width: 1200, height: 800 },
    }),
  };
});

vi.mock("@react-three/drei", () => ({
  Stars: () => null,
  useTexture: () => {
    const texture = { colorSpace: "", anisotropy: 0, needsUpdate: false };
    return [texture, texture, texture];
  },
}));

import RotatingEarth from "@/components/RotatingEarth";

class FakeObserver implements IntersectionObserver {
  static records: FakeObserver[] = [];
  readonly callback: IntersectionObserverCallback;
  target: Element | null = null;
  disconnected = false;
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: readonly number[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeObserver.records.push(this);
  }

  observe(target: Element) {
    this.target = target;
  }

  unobserve() {
    this.target = null;
  }

  disconnect() {
    this.disconnected = true;
    this.target = null;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  emit(isIntersecting: boolean) {
    if (this.disconnected || !this.target) return;
    this.callback(
      [{ isIntersecting, target: this.target } as unknown as IntersectionObserverEntry],
      this,
    );
  }
}

function installMatchMedia(initialReduced: boolean) {
  let reduced = initialReduced;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query === "(prefers-reduced-motion: reduce)" ? reduced : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (query === "(prefers-reduced-motion: reduce)") listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  return {
    setReduced(next: boolean) {
      reduced = next;
    },
    emit() {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      for (const listener of listeners) {
        listener({ matches: media.matches, media } as unknown as MediaQueryListEvent);
      }
    },
  };
}

describe("RotatingEarth visibility", () => {
  beforeEach(() => {
    harness.clock = null;
    FakeObserver.records = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
      type === "webgl2" ? ({} as WebGL2RenderingContext) : null) as typeof HTMLCanvasElement.prototype.getContext);
  });

  it("keeps the star clock when drawing pauses and resumes", async () => {
    installMatchMedia(false);
    render(<RotatingEarth />);

    expect(await screen.findByTestId("canvas")).toHaveAttribute("data-frameloop", "always");
    const clock = harness.clock;
    expect(clock).not.toBeNull();
    if (!clock) return;
    clock.elapsedTime = 9.2;

    act(() => FakeObserver.records[0]?.emit(false));

    expect(screen.getByTestId("canvas")).toHaveAttribute("data-frameloop", "never");
    expect(clock.elapsedTime).toBe(9.2);

    act(() => FakeObserver.records[0]?.emit(true));

    expect(screen.getByTestId("canvas")).toHaveAttribute("data-frameloop", "always");
    expect(clock.elapsedTime).toBe(9.2);
    const delta = clock.getDelta();
    expect(delta).toBeGreaterThanOrEqual(0);
    expect(delta).toBeLessThan(0.05);
    expect(clock.elapsedTime).toBeLessThan(9.25);
  });

  it("observes the canvas mounted after reduced motion turns off", async () => {
    const media = installMatchMedia(false);
    render(<RotatingEarth />);

    const firstCanvas = await screen.findByTestId("canvas");
    const firstObserver = FakeObserver.records[0];
    expect(firstObserver?.target).toBe(firstCanvas.parentElement);

    media.setReduced(true);
    act(() => media.emit());

    expect(screen.queryByTestId("canvas")).toBeNull();
    expect(firstObserver?.disconnected).toBe(true);

    media.setReduced(false);
    act(() => media.emit());

    const secondCanvas = await screen.findByTestId("canvas");
    const secondObserver = FakeObserver.records[1];
    expect(secondObserver?.target).toBe(secondCanvas.parentElement);
    expect(secondObserver?.target).not.toBe(firstObserver?.target);
    expect(firstObserver?.disconnected).toBe(true);

    act(() => secondObserver?.emit(false));
    expect(screen.getByTestId("canvas")).toHaveAttribute("data-frameloop", "never");

    act(() => secondObserver?.emit(true));
    expect(screen.getByTestId("canvas")).toHaveAttribute("data-frameloop", "always");
  });
});
