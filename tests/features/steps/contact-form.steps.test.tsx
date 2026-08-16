import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import ContactForm from "@/components/ContactForm";

const CHALLENGE_ID = "11111111-1111-4111-8111-111111111111";

function fillValidForm(): void {
  fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: "Jane Doe" } });
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } });
  fireEvent.change(screen.getByLabelText(/^message/i), {
    target: { value: "I would like to discuss a custom website build." },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: /not an automated agent or bot/i }),
  );
}

describe("Feature: Contact Form verification journey", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("shows confirmation only after the email code is accepted", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({ ok: true, stage: "verification", challengeId: CHALLENGE_ID }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => ({ ok: true, stage: "submitted" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));

    expect(await screen.findByText("Enter the six-digit code")).toBeInTheDocument();
    expect(screen.queryByText("Message received")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/confirmation code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm and submit/i }));

    expect(await screen.findByText("Message received")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not treat an unrecognized 2xx response as a completed submission", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }),
    );

    render(<ContactForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The service returned an unexpected response.",
    );
    expect(screen.queryByText("Message received")).not.toBeInTheDocument();
  });
});
