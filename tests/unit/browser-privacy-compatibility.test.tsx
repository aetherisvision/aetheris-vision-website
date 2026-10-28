import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONVERSIONS,
  hasServerPrivacySignal,
  isClientPrivacySignalActive,
  trackAnalyticsEvent,
  trackConversion,
} from "@/lib/analytics";
import {
  isSoftwareWebGLRenderer,
  probeWebGL2Support,
} from "@/components/hero-globe-config";
import { attachHeroVisibilityObserver } from "@/components/hero-globe-visibility";
import TurnstileWidget, { TURNSTILE_LOAD_TIMEOUT_MS } from "@/components/TurnstileWidget";

const scriptControl = vi.hoisted(() => ({
  autoReady: true,
  onReady: undefined as (() => void) | undefined,
  onError: undefined as (() => void) | undefined,
}));

vi.mock("next/script", () => ({
  default: ({
    onReady,
    onError,
  }: {
    onReady?: () => void;
    onError?: () => void;
  }) => {
    scriptControl.onReady = onReady;
    scriptControl.onError = onError;
    React.useEffect(() => {
      if (scriptControl.autoReady) onReady?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <script data-testid="turnstile-script" />;
  },
}));

describe("Global Privacy Control (Sec-GPC) and DNT across Brave, Firefox, Opera, and Linux Chromium", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
    Object.defineProperty(navigator, "doNotTrack", {
      configurable: true,
      value: null,
    });
  });

  it("detects Sec-GPC: 1 (Brave/Firefox) and DNT: 1 on incoming server headers", () => {
    expect(hasServerPrivacySignal(new Headers({ "sec-gpc": "1" }))).toBe(true);
    expect(hasServerPrivacySignal(new Headers({ dnt: "1" }))).toBe(true);
    expect(hasServerPrivacySignal(new Headers({ "x-privacy-opt-out": "1" }))).toBe(true);
    expect(hasServerPrivacySignal(new Headers({ "sec-gpc": "0", dnt: "0" }))).toBe(false);
    expect(hasServerPrivacySignal(new Headers())).toBe(false);
  });

  it("suppresses client analytics events when Brave/Firefox globalPrivacyControl or DNT is active", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    expect(isClientPrivacySignalActive()).toBe(false);
    trackConversion(CONVERSIONS.contactSubmitted, "contact_page");
    expect(gtag).toHaveBeenCalledTimes(1);

    Object.defineProperty(navigator, "globalPrivacyControl", {
      configurable: true,
      value: true,
    });
    expect(isClientPrivacySignalActive()).toBe(true);
    trackConversion(CONVERSIONS.contactSubmitted, "contact_page");
    trackAnalyticsEvent("form_submit", { event_category: "engagement" });
    expect(gtag).toHaveBeenCalledTimes(1);

    Object.defineProperty(navigator, "globalPrivacyControl", {
      configurable: true,
      value: false,
    });
    Object.defineProperty(navigator, "doNotTrack", {
      configurable: true,
      value: "1",
    });
    expect(isClientPrivacySignalActive()).toBe(true);
    trackConversion(CONVERSIONS.consultationBooked);
    expect(gtag).toHaveBeenCalledTimes(1);
  });
});

describe("WebGL2 probing across Brave Farbling, Firefox Linux ETP, Opera Battery Saver, and Linux Chromium", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("identifies CPU software rasterizers (Linux Chromium SwiftShader and Mesa llvmpipe/lavapipe)", () => {
    expect(
      isSoftwareWebGLRenderer(
        "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
      ),
    ).toBe(true);
    expect(isSoftwareWebGLRenderer("llvmpipe (LLVM 17.0.6, 256 bits)")).toBe(true);
    expect(isSoftwareWebGLRenderer("Mesa lavapipe")).toBe(true);
    expect(isSoftwareWebGLRenderer("Google SwiftShader")).toBe(true);
    expect(isSoftwareWebGLRenderer("Microsoft Basic Render Driver")).toBe(true);

    // Hardware GPUs and Brave/Firefox privacy-sanitized strings stay enabled
    expect(
      isSoftwareWebGLRenderer(
        "ANGLE (Mesa, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL 4.6)",
      ),
    ).toBe(false);
    expect(isSoftwareWebGLRenderer("Mesa Intel(R) Arc(tm) Graphics (MTL)")).toBe(false);
    expect(isSoftwareWebGLRenderer("WebKit WebGL")).toBe(false);
    expect(isSoftwareWebGLRenderer(null)).toBe(false);
  });

  it("falls back to the poster on Linux Chromium / Firefox CPU software WebGL2", () => {
    const fakeContext = {
      RENDERER: 0x1f01,
      isContextLost: () => false,
      getParameter: (param: number) =>
        param === 0x1f01 ? "WebKit WebGL" : "ANGLE (Google, SwiftShader Device)",
      getExtension: (name: string) =>
        name === "WEBGL_debug_renderer_info"
          ? { UNMASKED_RENDERER_WEBGL: 0x9246 }
          : null,
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
      type === "webgl2" ? (fakeContext as unknown as WebGL2RenderingContext) : null) as typeof HTMLCanvasElement.prototype.getContext);

    expect(probeWebGL2Support()).toBe(false);
  });

  it("tolerates Brave WebGL farbling and Firefox disabled WEBGL_debug_renderer_info", () => {
    const firefoxPrivacyContext = {
      RENDERER: 0x1f01,
      isContextLost: () => false,
      getParameter: () => "Mozilla",
      getExtension: () => null,
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
      type === "webgl2"
        ? (firefoxPrivacyContext as unknown as WebGL2RenderingContext)
        : null) as typeof HTMLCanvasElement.prototype.getContext);

    expect(probeWebGL2Support()).toBe(true);

    const braveStrictFarbledContext = {
      RENDERER: 0x1f01,
      isContextLost: () => false,
      getParameter: () => {
        throw new Error("Blocked by fingerprinting protection");
      },
      getExtension: () => {
        throw new Error("Blocked by fingerprinting protection");
      },
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
      type === "webgl2"
        ? (braveStrictFarbledContext as unknown as WebGL2RenderingContext)
        : null) as typeof HTMLCanvasElement.prototype.getContext);

    expect(probeWebGL2Support()).toBe(true);
  });

  it("rejects an already-lost WebGL2 context (Opera Battery Saver / GPU reset)", () => {
    const lostContext = {
      isContextLost: () => true,
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
      type === "webgl2" ? (lostContext as unknown as WebGL2RenderingContext) : null) as typeof HTMLCanvasElement.prototype.getContext);

    expect(probeWebGL2Support()).toBe(false);
  });
});

describe("Document visibility pausing (Opera Battery Saver / background tabs)", () => {
  class FakeObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    disconnected = false;
    callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.disconnected = true;
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });

  afterEach(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    vi.unstubAllGlobals();
  });

  it("pauses when the tab becomes hidden and resumes when visible again", () => {
    const node = document.createElement("div");
    const states: boolean[] = [];
    const observer = attachHeroVisibilityObserver(node, null, (visible) => {
      states.push(visible);
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(states.at(-1)).toBe(false);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(states.at(-1)).toBe(true);

    attachHeroVisibilityObserver(null, observer, () => undefined);
  });
});

describe("TurnstileWidget resilience under Brave Shields, Opera Ad Blocker, Firefox ETP, and Tor/VPN", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    scriptControl.autoReady = true;
    delete window.turnstile;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    delete window.turnstile;
  });

  it("surfaces an alert and Retry button when a blocker shims api.js without window.turnstile", async () => {
    const onTokenChange = vi.fn();
    render(<TurnstileWidget action="contact" onTokenChange={onTokenChange} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Verification could not load/);
    expect(alert).toHaveTextContent(/Brave Shields, Opera Ad Blocker, Firefox Enhanced Tracking Protection/);
    expect(onTokenChange).toHaveBeenCalledWith(null);

    const renderSpy = vi.fn().mockReturnValue("widget-retry");
    window.turnstile = {
      render: renderSpy,
      remove: vi.fn(),
    };

    fireEvent.click(screen.getByRole("button", { name: /retry verification/i }));
    await waitFor(() => expect(renderSpy).toHaveBeenCalledTimes(1));
  });

  it("times out cleanly instead of hanging when the Turnstile script stalls over Tor/VPN", () => {
    vi.useFakeTimers();
    scriptControl.autoReady = false;
    const onTokenChange = vi.fn();

    render(<TurnstileWidget action="contact" onTokenChange={onTokenChange} />);
    expect(screen.getByRole("status")).toHaveTextContent("Human verification is loading");

    act(() => {
      vi.advanceTimersByTime(TURNSTILE_LOAD_TIMEOUT_MS);
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/Verification could not load/);
    expect(onTokenChange).toHaveBeenLastCalledWith(null);
  });
});
