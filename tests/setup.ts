import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// In Vitest's jsdom environment, Node's built-in TextEncoder returns an outer-realm
// Uint8Array, which fails jose's `plaintext instanceof Uint8Array` check during
// Auth.js v5 JWE encryption. Wrap TextEncoder.prototype.encode so it returns a
// current-realm Uint8Array before any test imports jose / next-auth.
const NativeTextEncoder = globalThis.TextEncoder;
class RealmTextEncoder extends NativeTextEncoder {
  override encode(input?: string): Uint8Array<ArrayBuffer> {
    return new Uint8Array(super.encode(input));
  }
}
globalThis.TextEncoder = RealmTextEncoder;

// jsdom does not implement scrollIntoView (used by Navbar and ContactForm).
Element.prototype.scrollIntoView = vi.fn();

// framer-motion uses IntersectionObserver which jsdom doesn't support.
// Stub it so components using FadeIn render correctly in tests.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ children, ...props }: any) => {
          const React = require("react");
          return React.createElement(tag, props, children);
        },
    }
  ),
  useInView: () => true,
  useReducedMotion: () => false,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));
