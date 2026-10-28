import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OmniGridderShowcase from "@/components/OmniGridderShowcase";
import { showcaseCatalogView } from "@/lib/showcase-catalog-view";
import { hashMagicLinkToken } from "@/lib/magic-link-token";
import { sessionCookieName } from "@/lib/auth-cookie";

/**
 * Vitest mirror of showcase-and-portal.feature.
 */
describe("Feature: Public Omni-Gridder Showcase and Client Portal Access", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("Scenario: Public Omni-Gridder showcase loads the dataset catalog and enforces the compatibility matrix", () => {
    it("lists catalog datasets and explains swath refusal of bilinear interpolation", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ datasets: showcaseCatalogView() }), { status: 200 }),
      );

      render(<OmniGridderShowcase mode="public" />);

      expect(await screen.findByText("GFS 500 hPa geopotential height")).toBeInTheDocument();
      expect(screen.getByText("GOES-18 ABI band 13 — clean IR window")).toBeInTheDocument();

      fireEvent.click(screen.getByText("GOES-18 ABI band 13 — clean IR window"));
      expect(screen.getAllByText(/Not applicable to swath geometry/i).length).toBeGreaterThan(0);
    });
  });

  describe("Scenario: Public Omni-Gridder showcase surfaces a consultation link when the daily demo budget is exhausted", () => {
    it("displays the daily compute budget notice with a link to /book", async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ datasets: showcaseCatalogView() }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              error: "Today's public live-demo compute budget has been reached.",
              budgetExhausted: true,
            }),
            { status: 429 },
          ),
        );

      render(<OmniGridderShowcase mode="public" />);
      await screen.findByText("GFS 500 hPa geopotential height");

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /run single job/i }));
      });

      await waitFor(() =>
        expect(screen.getByText("Daily live-demo compute budget reached")).toBeInTheDocument(),
      );
      expect(
        screen.getByRole("link", { name: /schedule a free consultation/i }),
      ).toHaveAttribute("href", "/book");
    });
  });

  describe("Scenario: Client portal magic-link round-trip authenticates project and signed SOW access", () => {
    it("mints __Secure-authjs.session-token over HTTPS and decodes clientId for signed SOW access", async () => {
      const { encode, getToken } = await import("next-auth/jwt");
      const email = "jane.client@example.com";
      const rawToken = "bdd-magic-link-token-0123456789abcdef0123456789abcdef0123456789abcdef";
      expect(hashMagicLinkToken(rawToken)).toMatch(/^[a-f0-9]{64}$/);

      const secret = "bdd-authjs-v5-secret-at-least-32-characters-long";
      const cookieName = sessionCookieName(true);
      expect(cookieName).toBe("__Secure-authjs.session-token");

      const jwe = await encode({
        secret,
        salt: cookieName,
        token: {
          email,
          name: "Jane Client",
          sub: "1",
          clientId: "1",
        },
        maxAge: 3600,
      });

      const req = new NextRequest("https://aetherisvision.com/api/client/projects/1/signed-sow", {
        headers: { Cookie: `${cookieName}=${jwe}` },
      });
      const decoded = await getToken({ req, secret, secureCookie: true });
      expect(decoded).not.toBeNull();
      expect(decoded?.clientId).toBe("1");
      expect(decoded?.email).toBe(email);
    });
  });
});
