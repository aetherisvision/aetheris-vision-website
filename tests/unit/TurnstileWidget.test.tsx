import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const turnstile = vi.hoisted(() => ({
  render: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("next/script", () => ({
  default: ({ onReady }: { onReady?: () => void }) => {
    React.useEffect(() => {
      onReady?.();
      // The real Next.js Script only reports readiness once per load.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <script data-testid="turnstile-script" />;
  },
}));

import TurnstileWidget from "@/components/TurnstileWidget";

type RenderOptions = Parameters<typeof turnstile.render>[1];

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
  turnstile.render.mockReset();
  turnstile.remove.mockReset();
  turnstile.render.mockReturnValue("widget-1");
  window.turnstile = turnstile;
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.turnstile;
});

describe("TurnstileWidget", () => {
  it("renders explicitly with the requested action and reports verification", async () => {
    const onTokenChange = vi.fn();
    render(<TurnstileWidget action="review" onTokenChange={onTokenChange} />);

    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1));
    const options = turnstile.render.mock.calls[0][1] as RenderOptions;

    expect(options).toMatchObject({
      sitekey: "site-key",
      action: "review",
      theme: "dark",
      size: "flexible",
    });

    act(() => options.callback("verified-token"));

    expect(onTokenChange).toHaveBeenLastCalledWith("verified-token");
    expect(screen.getByRole("status")).toHaveTextContent("Human verification complete");
  });

  it.each([
    ["expired-callback", "Verification expired"],
    ["error-callback", "Verification could not load"],
    ["timeout-callback", "Verification expired"],
  ] as const)("clears the token on %s", async (callbackName, message) => {
    const onTokenChange = vi.fn();
    render(<TurnstileWidget action="review" onTokenChange={onTokenChange} />);

    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1));
    const options = turnstile.render.mock.calls[0][1] as RenderOptions;
    act(() => options.callback("verified-token"));
    act(() => options[callbackName]());

    expect(onTokenChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  it("discards the old widget when resetKey changes", async () => {
    const onTokenChange = vi.fn();
    const { rerender } = render(
      <TurnstileWidget action="review" onTokenChange={onTokenChange} resetKey={0} />,
    );
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1));

    rerender(<TurnstileWidget action="review" onTokenChange={onTokenChange} resetKey={1} />);

    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(2));
    expect(turnstile.remove).toHaveBeenCalledWith("widget-1");
    expect(onTokenChange).toHaveBeenLastCalledWith(null);
  });
});
