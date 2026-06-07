import React from "react";

/**
 * Test stub for `framer-motion`. framer-motion relies on IntersectionObserver
 * and layout/animation APIs that jsdom does not implement, so we render plain
 * DOM elements and strip motion-only props to avoid invalid-attribute warnings.
 * Mirrors the Vitest mock in tests/setup.ts.
 */
const MOTION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "layout",
  "layoutId",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "viewport",
  "drag",
  "dragConstraints",
  "onAnimationStart",
  "onAnimationComplete",
  "custom",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripMotionProps(props: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clean: Record<string, any> = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_PROPS.has(key)) clean[key] = props[key];
  }
  return clean;
}

export const motion = new Proxy(
  {},
  {
    get: (_target, tag: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ children, ...props }: any) =>
        React.createElement(tag, stripMotionProps(props), children),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) as any;

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const useInView = () => true;
export const useAnimation = () => ({ start: () => Promise.resolve(), stop: () => {}, set: () => {} });
export const useReducedMotion = () => false;
