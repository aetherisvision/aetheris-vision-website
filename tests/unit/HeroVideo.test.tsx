import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import HeroVideo from "@/components/HeroVideo";

describe("HeroVideo", () => {
  it("hydrates with a deterministic source and rotates through existing clips", () => {
    const { container } = render(<HeroVideo />);
    const video = container.querySelector("video");

    expect(video?.querySelector("source")).toHaveAttribute("src", "/hero-1.mp4");

    fireEvent.ended(video!);
    expect(container.querySelector("source")).toHaveAttribute("src", "/hero-2.mp4");

    fireEvent.ended(container.querySelector("video")!);
    expect(container.querySelector("source")).toHaveAttribute("src", "/hero-1.mp4");
  });
});
