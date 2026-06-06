import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CapabilityRequestForm from "@/components/CapabilityRequestForm";

describe("CapabilityRequestForm", () => {
  it("renders the Request PDF button initially", () => {
    render(<CapabilityRequestForm />);
    expect(screen.getByRole("button", { name: /request pdf/i })).toBeInTheDocument();
  });

  it("expands the form when the button is clicked", () => {
    render(<CapabilityRequestForm />);
    fireEvent.click(screen.getByRole("button", { name: /request pdf/i }));
    expect(screen.getByRole("textbox", { name: /your name/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /your email/i })).toBeInTheDocument();
  });

  it("name and email inputs have accessible labels", () => {
    render(<CapabilityRequestForm />);
    fireEvent.click(screen.getByRole("button", { name: /request pdf/i }));
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument();
  });

  it("shows success message after successful submission", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })
    );

    render(<CapabilityRequestForm />);
    fireEvent.click(screen.getByRole("button", { name: /request pdf/i }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/your email/i), { target: { value: "jane@agency.gov" } });
    fireEvent.submit(screen.getByLabelText(/your name/i).closest("form")!);

    await waitFor(() =>
      expect(screen.getByText(/request received/i)).toBeInTheDocument()
    );

    vi.unstubAllGlobals();
  });

  it("shows error state when the API returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "fail" }) })
    );

    render(<CapabilityRequestForm />);
    fireEvent.click(screen.getByRole("button", { name: /request pdf/i }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane" } });
    fireEvent.change(screen.getByLabelText(/your email/i), { target: { value: "jane@test.com" } });
    fireEvent.submit(screen.getByLabelText(/your name/i).closest("form")!);

    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    );

    vi.unstubAllGlobals();
  });

  it("POSTs to /api/contact with the correct pre-filled subject and message", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<CapabilityRequestForm />);
    fireEvent.click(screen.getByRole("button", { name: /request pdf/i }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Bob" } });
    fireEvent.change(screen.getByLabelText(/your email/i), { target: { value: "bob@gov.gov" } });
    fireEvent.submit(screen.getByLabelText(/your name/i).closest("form")!);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/contact");
    const body = JSON.parse(init.body);
    expect(body._subject).toBe("Capabilities Statement PDF Request");
    expect(body.message).toMatch(/capabilities statement pdf/i);

    vi.unstubAllGlobals();
  });
});
