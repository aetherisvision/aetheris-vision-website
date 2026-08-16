"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileStatus = "loading" | "verified" | "expired" | "error";

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
  const [statusState, setStatusState] = useState<{
    resetKey: string | number;
    value: TurnstileStatus;
  }>({ resetKey, value: "loading" });
  const status = statusState.resetKey === resetKey ? statusState.value : "loading";

  useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || !window.turnstile) {
      return;
    }

    callbackRef.current(null);
    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "dark",
      size: "flexible",
      callback: (token) => {
        setStatusState({ resetKey, value: "verified" });
        callbackRef.current(token);
      },
      "expired-callback": () => {
        setStatusState({ resetKey, value: "expired" });
        callbackRef.current(null);
      },
      "error-callback": () => {
        setStatusState({ resetKey, value: "error" });
        callbackRef.current(null);
      },
      "timeout-callback": () => {
        setStatusState({ resetKey, value: "expired" });
        callbackRef.current(null);
      },
    });

    return () => {
      window.turnstile?.remove(widgetId);
    };
  }, [action, resetKey, scriptReady, siteKey]);

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
          ? "Verification could not load. Refresh the page and try again."
          : "Human verification is loading";

  return (
    <div className="space-y-2">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => {
          setStatusState({ resetKey, value: "error" });
          callbackRef.current(null);
        }}
      />
      <div ref={containerRef} className="min-h-[65px] w-full" />
      <p
        role={status === "error" || status === "expired" ? "alert" : "status"}
        aria-live="polite"
        className="text-xs text-white/50"
      >
        {statusMessage}
      </p>
    </div>
  );
}
