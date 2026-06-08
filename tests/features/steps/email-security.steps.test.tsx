import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import Footer from "@/components/Footer";
import PrivacyPage from "@/app/privacy/page";

// next/image and next/link can't resolve relative paths in jsdom.
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img alt={alt} {...props} />;
  },
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
// PrivacyPage renders Navbar, which reads the current pathname.
vi.mock("next/navigation", () => ({
  usePathname: () => "/privacy",
  useRouter: () => ({ push: vi.fn() }),
}));

/**
 * Vitest mirror of email-security.feature.
 *
 * Anti-scraping contract (now structural): no page renders an email address or
 * a mailto: link. All contact is routed through the /contact form page.
 */

function hasLinkTo(container: HTMLElement, href: string): boolean {
  return Array.from(container.querySelectorAll("a")).some((a) =>
    (a.getAttribute("href") ?? "").startsWith(href),
  );
}

describe("Feature: Email Anti-Scraping Security", () => {
  describe("Scenario: Footer does not expose any email address or mailto link", () => {
    it("renders no plaintext address and no mailto: link", () => {
      const { container } = render(<Footer />);
      expect(container.innerHTML).not.toContain("@aetherisvision");
      expect(container.innerHTML).not.toContain("mailto:");
    });

    it("routes contact through the /contact page", () => {
      const { container } = render(<Footer />);
      expect(hasLinkTo(container, "/contact")).toBe(true);
    });
  });

  describe("Scenario: Privacy page does not expose any email address or mailto link", () => {
    it("renders no plaintext address and no mailto: link", () => {
      const { container } = render(<PrivacyPage />);
      expect(container.innerHTML).not.toContain("@aetherisvision");
      expect(container.innerHTML).not.toContain("mailto:");
    });

    it("routes contact through the /contact page", () => {
      const { container } = render(<PrivacyPage />);
      expect(hasLinkTo(container, "/contact")).toBe(true);
    });
  });
});
