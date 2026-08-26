/**
 * Aetheris Vision brand tokens — keep in sync with
 * aetherisvision/brand/colors/tokens.json
 */
export const BRAND = {
  navy: "#29426C",
  navyPrint: "#1e3a5f",
  mid: "#486890",
  light: "#7EABCA",
  accent: "#5BA8D9",
  cyan: "#6EC4D6",
  siteBackground: "#101820",
  siteForeground: "#eae8ec",
} as const;

export const BRAND_LOGO = {
  horizontal: "/logo/av-logo-horizontal-color-rgb.png",
  horizontalSvg: "/logo/av-logo-horizontal-color-rgb.svg",
  horizontalReversed: "/logo/av-logo-horizontal-mono-white.png",
  horizontalReversedSvg: "/logo/av-logo-horizontal-mono-white.svg",
  mark: "/logo/av-mark-globe.png",
  markSvg: "/logo/av-mark-favicon.svg",
  mark192: "/logo/av-favicon-192.png",
  mark512: "/logo/av-favicon-512.png",
  favicon32: "/logo/av-favicon-32.png",
} as const;

/** rgba glow for accent (accent = #5BA8D9) */
export const brandAccentGlow = "rgba(91, 168, 217, 0.35)";
export const brandAccentMuted = "rgba(91, 168, 217, 0.12)";
export const brandAccentBorder = "rgba(91, 168, 217, 0.25)";

export const brandGradient = `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.accent})`;
export const brandGradientButton = `linear-gradient(135deg, ${BRAND.mid}, ${BRAND.accent})`;
