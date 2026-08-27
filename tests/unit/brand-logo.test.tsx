import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BRAND_LOGO } from "@/lib/brand";
import { BRAND_POSITIONING } from "@/lib/constants";

// Navbar pulls navigation hooks from next/navigation; stub them so the
// component renders in jsdom without a real router.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// next/image may rewrite the src through the optimizer; decode before asserting
// so we match on the underlying asset path regardless of query-param encoding.
function logoSrc(container: HTMLElement): string {
  const img = container.querySelector("img");
  if (!img) throw new Error("Expected a rendered brand image");
  return decodeURIComponent(img.getAttribute("src") ?? "");
}

describe("brand logo", () => {
  it("BRAND_LOGO.markSvg is the canonical eye+globe mark", () => {
    expect(BRAND_LOGO.markSvg).toBe("/logo/av-mark-favicon.svg");
  });

  it("defines separate Family 3 lockups for light and dark backgrounds", () => {
    expect(BRAND_LOGO.family3OnLightSvg).toBe(
      "/logo/candidates/av-logo-family3-natural-on-light.svg",
    );
    expect(BRAND_LOGO.family3OnDarkSvg).toBe(
      "/logo/candidates/av-logo-family3-web-dark.svg",
    );
  });

  it("Navbar renders the Family 3 dark lockup from BRAND_LOGO", () => {
    const { container } = render(<Navbar />);
    const logo = container.querySelector("img");

    expect(logoSrc(container)).toContain(BRAND_LOGO.family3OnDarkSvg);
    expect(logo).toHaveAttribute("alt", "Aetheris Vision");
  });

  it("Navbar logo descriptor matches the site positioning", () => {
    const { container } = render(<Navbar />);
    const descriptor = Array.from(container.querySelectorAll("p")).find(
      (paragraph) => paragraph.textContent === BRAND_POSITIONING.text,
    );

    expect(descriptor).toBeDefined();
    expect(descriptor).toHaveClass("pl-[34.5%]", "text-left");
    expect(descriptor).not.toHaveClass("text-center");
    expect(container).not.toHaveTextContent("Scientific & Technical Consulting");
  });

  it("Footer renders the Family 3 dark lockup from BRAND_LOGO", () => {
    const { container } = render(<Footer />);
    const logo = container.querySelector("img");

    expect(logoSrc(container)).toContain(BRAND_LOGO.family3OnDarkSvg);
    expect(logo).toHaveAttribute("alt", "Aetheris Vision");
    expect(container).toHaveTextContent(BRAND_POSITIONING.text);
  });

  it("does not reference the retired off-brand logo asset", () => {
    const { container: nav } = render(<Navbar />);
    const { container: foot } = render(<Footer />);
    expect(nav.innerHTML).not.toContain("aetheris-logo");
    expect(foot.innerHTML).not.toContain("aetheris-logo");
  });
});
