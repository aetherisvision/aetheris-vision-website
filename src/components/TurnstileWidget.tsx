"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileStatus = "loading" | "verified" | "expired" | "error";

export const TURNSTILE_LOAD_TIMEOUT_MS = 12_000;

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "dark";
      size: "flexible";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      "timeout-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileWidgetProps {
  action: string;
  onTokenChange: (token: string | null) => void;
  resetKey?: string | number;
}

/**
 * Accessible, explicitly rendered Cloudflare Turnstile widget.
 *
 * `resetKey` may be changed after a failed submission to discard the consumed
 * token and render a fresh challenge. The server remains responsible for
 * validating the token, expected action, and hostname.
 */
export default function TurnstileWidget({
  action,
  onTokenChange,
  resetKey = 0,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onTokenChange);
  const [scriptReady, setScriptReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const cycleKey = `${String(resetKey)}:${retryCount}`;
  const [statusState, setStatusState] = useState<{
    cycleKey: string;
    value: TurnstileStatus;
  }>({ cycleKey, value: "loading" });
  const status = statusState.cycleKey === cycleKey ? statusState.value : "loading";

  useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!siteKey || status !== "loading") return;

    const timer = window.setTimeout(() => {
      setStatusState({ cycleKey, value: "error" });
      callbackRef.current(null);
    }, TURNSTILE_LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cycleKey, siteKey, status]);

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current) {
      return;
    }

    if (typeof window.turnstile?.render !== "function") {
      // Content blockers (Brave Shields, Opera Ad Blocker, Firefox ETP) can
      // shim third-party scripts so onReady fires without window.turnstile.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatusState({ cycleKey, value: "error" });
      callbackRef.current(null);
      return;
    }

    callbackRef.current(null);
    let widgetId: string | null = null;
    try {
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme: "dark",
        size: "flexible",
        callback: (token) => {
          setStatusState({ cycleKey, value: "verified" });
          callbackRef.current(token);
        },
        "expired-callback": () => {
          setStatusState({ cycleKey, value: "expired" });
          callbackRef.current(null);
        },
        "error-callback": () => {
          setStatusState({ cycleKey, value: "error" });
          callbackRef.current(null);
        },
        "timeout-callback": () => {
          setStatusState({ cycleKey, value: "expired" });
          callbackRef.current(null);
        },
      });
    } catch {
      setStatusState({ cycleKey, value: "error" });
      callbackRef.current(null);
      return;
    }

    return () => {
      if (!widgetId) return;
      try {
        window.turnstile?.remove(widgetId);
      } catch {
        /* ignore cleanup errors when widget iframe was blocked */
      }
    };
  }, [action, cycleKey, scriptReady, siteKey]);

  // Local development and tests can run without a public site key. Production
  // preflight treats the missing key as a deployment error.
  if (!siteKey && process.env.NODE_ENV !== "production") return null;

  if (!siteKey) {
    return (
      <p role="alert" className="text-sm text-red-300">
        Human verification is temporarily unavailable. Please try again later.
      </p>
    );
  }

  const statusMessage =
    status === "verified"
      ? "Human verification complete"
      : status === "expired"
        ? "Verification expired. Please complete it again."
        : status === "error"
          ? "Verification could not load. Refresh the page and try again, or allow challenges.cloudflare.com if Brave Shields, Opera Ad Blocker, Firefox Enhanced Tracking Protection, or a VPN is blocking the check."
          : "Human verification is loading";

  return (
    <div className="space-y-2">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => {
          setStatusState({ cycleKey, value: "error" });
          callbackRef.current(null);
        }}
      />
      <div ref={containerRef} className="min-h-[65px] w-full" />
      <div className="flex flex-wrap items-center gap-3">
        <p
          role={status === "error" || status === "expired" ? "alert" : "status"}
          aria-live="polite"
          className="text-xs text-white/50"
        >
          {statusMessage}
        </p>
        {(status === "error" || status === "expired") && (
          <button
            type="button"
            onClick={() => {
              callbackRef.current(null);
              setRetryCount((count) => count + 1);
            }}
            className="text-xs font-medium text-blue-300 underline underline-offset-4 hover:text-white"
          >
            Retry verification
          </button>
        )}
      </div>
    </div>
  );
}
