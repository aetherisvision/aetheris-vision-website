/**
 * Conversion events.
 *
 * Three actions count as a conversion on this site, in descending order of
 * intent. Keep this list short — a metric that counts everything measures
 * nothing, and the point is to be able to answer "is the site working?"
 *
 *  1. consultation_booked          A scheduled call. Highest intent: a named
 *                                  person has committed time.
 *  2. capability_statement_sent    The federal track. Someone is filing us
 *                                  against a requirement.
 *  3. contact_submitted            Verified inbound message. Real, but the
 *                                  broadest and least qualified of the three.
 *
 * Mark all three as key events in the GA4 property so they appear in reporting.
 */
export const CONVERSIONS = {
  consultationBooked: "consultation_booked",
  capabilityStatementSent: "capability_statement_sent",
  contactSubmitted: "contact_submitted",
} as const;

export type ConversionName = (typeof CONVERSIONS)[keyof typeof CONVERSIONS];

/** Conversion rank, 1 being the strongest signal. Sent as the event value. */
const RANK: Record<ConversionName, number> = {
  [CONVERSIONS.consultationBooked]: 1,
  [CONVERSIONS.capabilityStatementSent]: 2,
  [CONVERSIONS.contactSubmitted]: 3,
};

type PrivacySignalNavigator = Navigator & {
  globalPrivacyControl?: boolean;
  msDoNotTrack?: string;
};

type PrivacySignalWindow = Window & {
  doNotTrack?: string;
};

type HeaderReader = {
  get(name: string): string | null;
};

/**
 * True when request headers carry Global Privacy Control (`Sec-GPC: 1`, sent by
 * default in Brave and supported in Firefox ETP) or Do Not Track (`DNT: 1`).
 */
export function hasServerPrivacySignal(headers: HeaderReader): boolean {
  const gpc = headers.get("sec-gpc")?.trim();
  const dnt = headers.get("dnt")?.trim();
  const forwarded = headers.get("x-privacy-opt-out")?.trim();
  return gpc === "1" || dnt === "1" || forwarded === "1";
}

/**
 * True when the browser exposes an active client-side privacy opt-out signal
 * (`navigator.globalPrivacyControl` in Brave/Firefox or `doNotTrack === "1"` in
 * Firefox/Opera/Chromium).
 */
export function isClientPrivacySignalActive(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const nav = navigator as PrivacySignalNavigator;
  const win = window as PrivacySignalWindow;
  if (nav.globalPrivacyControl === true) return true;
  const dnt = nav.doNotTrack ?? win.doNotTrack ?? nav.msDoNotTrack;
  return dnt === "1" || dnt === "yes";
}

/**
 * Sends a non-essential analytics event only when analytics is loaded and the
 * visitor has not enabled Global Privacy Control or Do Not Track.
 */
export function trackAnalyticsEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (isClientPrivacySignalActive()) return;
  try {
    window.gtag("event", eventName, params);
  } catch {
    /* analytics must never surface to the visitor */
  }
}

/**
 * Records a conversion if analytics is present. Silent when it is not — a
 * blocked or unconfigured tag must never break a form the visitor is using.
 */
export function trackConversion(name: ConversionName, label?: string): void {
  trackAnalyticsEvent(name, {
    event_category: "conversion",
    event_label: label ?? name,
    value: RANK[name],
  });
}
