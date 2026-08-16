import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BRAND_LOGO } from "@/lib/brand";

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

  it("Navbar renders the canonical mark from BRAND_LOGO", () => {
    const { container } = render(<Navbar />);
    expect(logoSrc(container)).toContain(BRAND_LOGO.markSvg);
  });

  it("Footer renders the canonical mark from BRAND_LOGO", () => {
    const { container } = render(<Footer />);
    const mark = container.querySelector("img");

    expect(logoSrc(container)).toContain(BRAND_LOGO.markSvg);
    expect(mark).toHaveAttribute("alt", "");
    expect(mark).toHaveAttribute("aria-hidden", "true");
  });

  it("does not reference the retired off-brand logo asset", () => {
    const { container: nav } = render(<Navbar />);
    const { container: foot } = render(<Footer />);
    expect(nav.innerHTML).not.toContain("aetheris-logo");
    expect(foot.innerHTML).not.toContain("aetheris-logo");
  });
});
