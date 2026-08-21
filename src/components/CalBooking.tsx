"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect, useState } from "react";
import { CONVERSIONS, trackConversion } from "@/lib/analytics";

const CAL_BOOKING_URL = "https://cal.com/aetherisvision/30min";

export default function CalBooking() {
  const [initializationFailed, setInitializationFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let detach: (() => void) | null = null;
    const onBookingSuccessful = () => trackConversion(CONVERSIONS.consultationBooked);

    void (async function () {
      try {
        const cal = await getCalApi({ namespace: "30min" });
        cal("ui", {
          hideEventTypeDetails: true,
          layout: "month_view",
        });
        // A completed booking is the strongest conversion signal on the site.
        // The booking itself happens inside Cal's iframe, so this event is the
        // only way it reaches analytics. getCalApi hands back a shared global,
        // so the listener must come off again on unmount — otherwise navigating
        // away and back registers a second one and a single booking is counted
        // twice.
        if (!active) return;
        cal("on", { action: "bookingSuccessful", callback: onBookingSuccessful });
        detach = () => cal("off", { action: "bookingSuccessful", callback: onBookingSuccessful });
      } catch {
        if (active) setInitializationFailed(true);
      }
    })();

    return () => {
      active = false;
      detach?.();
    };
  }, []);

  return (
    <div>
      {initializationFailed ? (
        <p role="status" className="px-6 pt-10 text-center text-sm text-gray-300">
          The embedded scheduler could not load here.
        </p>
      ) : (
        <Cal
          namespace="30min"
          calLink="aetherisvision/30min"
          style={{ width: "100%", minHeight: "600px" }}
          config={{ layout: "month_view" }}
        />
      )}
      <p className="px-4 pb-5 text-center text-sm text-gray-300">
        <a
          href={CAL_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center font-medium text-blue-300 underline underline-offset-4 transition hover:text-white"
        >
          Open the scheduler in a new tab
        </a>
      </p>
    </div>
  );
}
