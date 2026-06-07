import React from "react";

/**
 * Test stub for `next/link` — renders a plain <a> so components can mount in
 * jsdom without the Next.js router context.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Link({ children, href, ...props }: any) {
  const { prefetch, replace, scroll, shallow, ...rest } = props;
  void prefetch;
  void replace;
  void scroll;
  void shallow;
  return (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  );
}
