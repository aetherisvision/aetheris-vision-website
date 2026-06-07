// Preloaded via `node --import` before cucumber loads any step/support code, so
// a DOM exists before @testing-library/react and React components are imported.
//
// We hand-roll this (instead of global-jsdom) because global-jsdom's peer range
// requires jsdom >= 29, while this repo pins jsdom@28 (shared with Vitest).
//
// The global-population strategy mirrors Vitest's jsdom environment: rather than
// making the jsdom window the global object, we copy its keys onto the Node
// global as *configurable* get/set accessors and point `window` back at the
// global. This is what lets scenarios redefine otherwise-locked properties such
// as `window.location` (jsdom defines it non-configurable).
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
  url: "http://localhost:3000/",
  pretendToBeVisual: true,
});

const { window } = dom;

// jsdom does not implement these layout/navigation APIs; provide no-op shims
// before they get bridged onto the global below.
window.HTMLElement.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};

const skipKeys = new Set(["window", "self", "top", "parent", "global", "globalThis"]);

// Node provides its own implementations of these runtime / fetch / stream
// primitives. We must NOT override them with jsdom's versions: tests and route
// handlers create Response/ReadableStream/etc. with Node's globals, and mixing
// realms breaks them. Everything else (DOM classes such as Event, CustomEvent,
// KeyboardEvent, etc.) is bridged from jsdom so DOM event dispatch stays in a
// single realm.
const nodeKeepKeys = new Set([
  "setTimeout", "setInterval", "clearTimeout", "clearInterval", "setImmediate",
  "clearImmediate", "queueMicrotask", "process", "Buffer", "console", "require",
  "module", "exports", "__dirname", "__filename", "fetch", "Response", "Request",
  "Headers", "FormData", "Blob", "File", "ReadableStream", "WritableStream",
  "TransformStream", "ByteLengthQueuingStrategy", "CountQueuingStrategy",
  "TextEncoder", "TextDecoder", "TextEncoderStream", "TextDecoderStream",
  "AbortController", "AbortSignal", "structuredClone", "crypto", "performance",
  "URL", "URLSearchParams", "MessageChannel", "MessagePort", "WebSocket",
]);

const isClassLike = (name) => name[0] === name[0].toUpperCase();

// Collect own + inherited property names so prototype methods such as
// addEventListener / getComputedStyle / matchMedia are bridged, not just the
// window instance's own properties.
const windowKeys = new Set();
for (let obj = window; obj && obj !== Object.prototype; obj = Object.getPrototypeOf(obj)) {
  for (const key of Object.getOwnPropertyNames(obj)) windowKeys.add(key);
}

for (const key of windowKeys) {
  if (skipKeys.has(key)) continue;
  if (nodeKeepKeys.has(key)) continue;

  const overrides = new Map();
  const bound =
    typeof window[key] === "function" && !isClassLike(key) ? window[key].bind(window) : null;

  try {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get() {
        if (overrides.has("v")) return overrides.get("v");
        return bound ?? window[key];
      },
      set(value) {
        overrides.set("v", value);
      },
    });
  } catch {
    // Some Node globals cannot be redefined; ignore and keep Node's version.
  }
}

globalThis.window = globalThis;
globalThis.self = globalThis;
globalThis.top = globalThis;
globalThis.parent = globalThis;

// Keep document.defaultView pointing at the global so React/testing-library see
// a consistent window identity.
if (globalThis.document?.defaultView) {
  Object.defineProperty(globalThis.document, "defaultView", {
    configurable: true,
    enumerable: true,
    get: () => globalThis,
  });
}

// React 19 / testing-library run in an "act" environment for predictable updates.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
