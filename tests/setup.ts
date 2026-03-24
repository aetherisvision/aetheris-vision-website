import "@testing-library/jest-dom/vitest";

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
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));
