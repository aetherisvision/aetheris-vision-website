import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CapabilityStatementForm from "@/components/CapabilityStatementForm";
import { CONVERSIONS, trackConversion } from "@/lib/analytics";

vi.mock("@/components/TurnstileWidget", () => ({
  default: ({ onTokenChange }: { onTokenChange: (token: string) => void }) => (
    <button type="button" onClick={() => onTokenChange("verified-token")}>Verify</button>
  ),
}));
vi.mock("@/lib/analytics", () => ({
  CONVERSIONS: { capabilityStatementRequested: "capability_statement_requested" },
  trackConversion: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("CapabilityStatementForm", () => {
  it("confirms a request for review without promising automatic delivery", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);
    render(<CapabilityStatementForm />);
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "officer@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    fireEvent.click(screen.getByRole("button", { name: "Request the capability statement" }));
    expect(await screen.findByText("Request received.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("provided after review");
    expect(screen.getByRole("status")).not.toHaveTextContent(/being delivered|on its way|spam folder/i);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(trackConversion).toHaveBeenCalledWith(CONVERSIONS.capabilityStatementRequested);
  });

  it("keeps notification failures visible so the visitor can retry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "We could not submit your request." }),
    }));
    render(<CapabilityStatementForm />);
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "officer@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    fireEvent.click(screen.getByRole("button", { name: "Request the capability statement" }));
    expect(await screen.findByText("We could not submit your request.")).toBeInTheDocument();
    expect(screen.queryByText("Request received.")).not.toBeInTheDocument();
    expect(trackConversion).not.toHaveBeenCalled();
  });
});
