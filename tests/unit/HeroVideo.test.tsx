import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import HeroVideo from "@/components/HeroVideo";

describe("HeroVideo", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn((query: string) => ({
        matches: query === "(min-width: 1024px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("hydrates with a deterministic source and rotates through existing clips", async () => {
    const { container } = render(<HeroVideo />);
    const video = await waitFor(() => {
      const element = container.querySelector("video");
      expect(element).toBeInTheDocument();
      return element!;
    });

    expect(video?.querySelector("source")).toHaveAttribute("src", "/hero-1.mp4");

    fireEvent.ended(video!);
    await waitFor(() =>
      expect(container.querySelector("source")).toHaveAttribute("src", "/hero-2.mp4")
    );

    fireEvent.ended(container.querySelector("video")!);
    await waitFor(() =>
      expect(container.querySelector("source")).toHaveAttribute("src", "/hero-1.mp4")
    );
  });

  it("does not load decorative video on compact screens", async () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<HeroVideo />);
    await waitFor(() => expect(container.querySelector("video")).not.toBeInTheDocument());
  });
});
