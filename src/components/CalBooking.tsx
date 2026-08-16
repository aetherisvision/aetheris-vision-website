"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect, useState } from "react";

const CAL_BOOKING_URL = "https://cal.com/aetherisvision/30min";

export default function CalBooking() {
  const [initializationFailed, setInitializationFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void (async function () {
      try {
        const cal = await getCalApi({ namespace: "30min" });
        cal("ui", {
          hideEventTypeDetails: true,
          layout: "month_view",
        });
      } catch {
        if (active) setInitializationFailed(true);
      }
    })();

    return () => {
      active = false;
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
