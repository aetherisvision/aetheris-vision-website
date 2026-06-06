import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmailLink from "@/components/EmailLink";

// EmailLink assembles the mailto on click and assigns window.location.href.
// jsdom does not implement navigation, so stub a writable location for assertions.
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

describe("EmailLink", () => {
  it("renders the default label", () => {
    render(<EmailLink />);
    expect(screen.getByText("Email us")).toBeInTheDocument();
  });

  it("renders custom label children", () => {
    render(<EmailLink>Contact our team</EmailLink>);
    expect(screen.getByText("Contact our team")).toBeInTheDocument();
  });

  it("does not expose any plaintext address in the rendered DOM (anti-scraping)", () => {
    const { container } = render(<EmailLink>Email us</EmailLink>);
    expect(container.innerHTML).not.toContain("@aetherisvision");
    expect(container.innerHTML).not.toContain("mailto:");
    // The visible href is an inert placeholder until activation.
    expect(screen.getByText("Email us").closest("a")).toHaveAttribute("href", "#");
  });

  it("assembles the contact mailto on click", () => {
    render(<EmailLink>Email us</EmailLink>);
    fireEvent.click(screen.getByText("Email us"));
    expect(window.location.href).toBe("mailto:contact@aetherisvision.com");
  });

  it("uses the federal POC address when account=marston", () => {
    render(<EmailLink account="marston">Email</EmailLink>);
    fireEvent.click(screen.getByText("Email"));
    expect(window.location.href).toBe("mailto:marston@aetherisvision.com");
  });

  it("encodes the subject into the mailto", () => {
    render(<EmailLink subject="Blog Subscription">Subscribe</EmailLink>);
    fireEvent.click(screen.getByText("Subscribe"));
    expect(window.location.href).toBe(
      "mailto:contact@aetherisvision.com?subject=Blog%20Subscription",
    );
  });
});
