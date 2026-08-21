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

/**
 * Records a conversion if analytics is present. Silent when it is not — a
 * blocked or unconfigured tag must never break a form the visitor is using.
 */
export function trackConversion(name: ConversionName, label?: string): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, {
      event_category: "conversion",
      event_label: label ?? name,
      value: RANK[name],
    });
  } catch {
    /* analytics must never surface to the visitor */
  }
}
