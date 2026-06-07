import React from "react";

/**
 * Test stub for `next/image` — renders a plain <img> so components can mount in
 * jsdom without the Next.js image optimizer / loader. Next-only props are
 * stripped so they do not leak onto the DOM element.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Image({ alt, ...props }: any) {
  const {
    priority,
    fill,
    loader,
    quality,
    placeholder,
    blurDataURL,
    unoptimized,
    onLoadingComplete,
    ...rest
  } = props;
  void priority;
  void fill;
  void loader;
  void quality;
  void placeholder;
  void blurDataURL;
  void unoptimized;
  void onLoadingComplete;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img alt={alt} {...rest} />;
}
