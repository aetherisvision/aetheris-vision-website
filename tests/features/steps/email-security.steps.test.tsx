import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailLink from "@/components/EmailLink";
import Footer from "@/components/Footer";

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

/**
 * BDD step definitions for email-security.feature
 * These follow Given/When/Then structure matching the Gherkin scenarios.
 *
 * Anti-scraping contract: no email address must appear in server-rendered HTML.
 * The address is assembled only at click time, never stored in the DOM.
 */

const realLocation = window.location;

beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { href: "" },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: realLocation,
  });
});

// ── Scenario: EmailLink renders without any address in the DOM ────────────────

describe("Feature: Email Anti-Scraping Security", () => {
  describe("Scenario: EmailLink renders without any address in the DOM", () => {
    let container: HTMLElement;

    beforeEach(() => {
      // Given the EmailLink component is rendered with default props
      ({ container } = render(<EmailLink>Email us</EmailLink>));
    });

    it("Then the rendered HTML should not contain '@aetherisvision'", () => {
      expect(container.innerHTML).not.toContain("@aetherisvision");
    });

    it("And the rendered HTML should not contain 'mailto:'", () => {
      expect(container.innerHTML).not.toContain("mailto:");
    });

    it("And the anchor href attribute should be '#'", () => {
      expect(screen.getByText("Email us").closest("a")).toHaveAttribute("href", "#");
    });
  });

  // ── Scenario: Contact address assembled only on click ─────────────────────

  describe("Scenario: EmailLink assembles the contact address only on click", () => {
    beforeEach(() => {
      // Given the EmailLink component is rendered with default props
      render(<EmailLink>Email us</EmailLink>);
    });

    it("Then window.location.href should equal 'mailto:contact@aetherisvision.com'", () => {
      // When the user clicks the link
      fireEvent.click(screen.getByText("Email us"));
      expect(window.location.href).toBe("mailto:contact@aetherisvision.com");
    });
  });

  // ── Scenario: Federal POC address assembled on click ─────────────────────

  describe("Scenario: EmailLink assembles the federal POC address on click when account is marston", () => {
    beforeEach(() => {
      // Given the EmailLink component is rendered with account "marston"
      render(<EmailLink account="marston">Email</EmailLink>);
    });

    it("Then window.location.href should equal 'mailto:marston@aetherisvision.com'", () => {
      // When the user clicks the link
      fireEvent.click(screen.getByText("Email"));
      expect(window.location.href).toBe("mailto:marston@aetherisvision.com");
    });
  });

  // ── Scenario: Subject encoding ────────────────────────────────────────────

  describe("Scenario: EmailLink encodes a subject into the mailto on click", () => {
    beforeEach(() => {
      // Given the EmailLink component is rendered with subject "Blog Subscription"
      render(<EmailLink subject="Blog Subscription">Subscribe</EmailLink>);
    });

    it("Then window.location.href should equal the encoded mailto", () => {
      // When the user clicks the link
      fireEvent.click(screen.getByText("Subscribe"));
      expect(window.location.href).toBe(
        "mailto:contact@aetherisvision.com?subject=Blog%20Subscription"
      );
    });
  });

  // ── Scenario: Footer does not expose the business email as plaintext ──────

  describe("Scenario: Footer does not expose the business email as plaintext", () => {
    it("Then the rendered HTML should not contain '@aetherisvision'", () => {
      // Given the Footer component is rendered
      const { container } = render(<Footer />);
      // Then no raw address in SSR output
      expect(container.innerHTML).not.toContain("@aetherisvision");
    });
  });
});
