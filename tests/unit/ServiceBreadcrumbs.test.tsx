import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ServiceBreadcrumbs from "@/components/ServiceBreadcrumbs";

describe("service breadcrumbs", () => {
  it("keeps structured discovery URLs aligned with visible accessible navigation", () => {
    const { container } = render(<ServiceBreadcrumbs name="Weather AI" path="/services/weather-ai" />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/services");
    expect(screen.getByText("Weather AI")).toHaveAttribute("aria-current", "page");
    const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement.map((item: { position: number }) => item.position)).toEqual([1, 2, 3]);
    expect(schema.itemListElement.at(-1)).toMatchObject({ name: "Weather AI", item: "https://aetherisvision.com/services/weather-ai" });
  });

  it("preserves names without allowing markup to terminate the schema script", () => {
    const { container } = render(<ServiceBreadcrumbs name={"Example </script>"} path="/services/example" />);
    const script = container.querySelector('script[type="application/ld+json"]')!;
    expect(script.textContent).not.toContain("</script>");
    expect(JSON.parse(script.textContent!).itemListElement.at(-1).name).toBe("Example </script>");
  });
});
