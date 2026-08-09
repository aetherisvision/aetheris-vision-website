import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom does not implement scrollIntoView (used by ChatWidget, Navbar, ContactForm).
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
