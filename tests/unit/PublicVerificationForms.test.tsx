import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProjectIntakeForm from "@/components/ProjectIntakeForm";
import QuickContactForm from "@/components/QuickContactForm";

const CHALLENGE_ID = "11111111-1111-4111-8111-111111111111";

function jsonResponse(body: unknown, status = 202): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  // Turnstile behavior is covered independently. These tests exercise the
  // complete public-form flow in the same configuration used by local tests.
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("public form email verification", () => {
  it("keeps the homepage contact request pending until its code is confirmed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, stage: "verification", challengeId: CHALLENGE_ID }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, stage: "submitted" }));
    vi.stubGlobal("fetch", fetchMock);

    render(<QuickContactForm />);
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/what can we help with/i), {
      target: { value: "Please help with a secure website redesign." },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /not an automated agent or bot/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText("Enter the Six-Digit Code")).toBeInTheDocument();
    expect(screen.queryByText("Message Received")).not.toBeInTheDocument();

    const initialBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/contact");
    expect(initialBody.submissionId).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(initialBody.humanAttestation).toBe(true);
    expect(initialBody.interactionDurationMs).toEqual(expect.any(Number));
    expect(initialBody).not.toHaveProperty("challengeId");

    fireEvent.change(screen.getByLabelText(/confirmation code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm and submit/i }));

    expect(await screen.findByText("Message Received")).toBeInTheDocument();
    const verifiedBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(verifiedBody).toEqual(
      expect.objectContaining({
        submissionId: initialBody.submissionId,
        challengeId: CHALLENGE_ID,
        verificationCode: "123456",
      }),
    );
  });

  it("uses the two-stage intake contract without legacy browser metadata", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.startsWith("/api/places?")) {
        return jsonResponse([]);
      }

      expect(url).toBe("/api/intake");
      const body = JSON.parse(init?.body as string) as { challengeId?: string };
      return body.challengeId
        ? jsonResponse({ ok: true, stage: "submitted" })
        : jsonResponse({ ok: true, stage: "verification", challengeId: CHALLENGE_ID });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProjectIntakeForm />);
    const submitButton = screen.getByRole("button", { name: /send project details/i });
    const form = submitButton.closest("form");
    expect(form).not.toBeNull();

    for (const input of form!.querySelectorAll<HTMLInputElement>("input[required]")) {
      if (input.type === "checkbox") continue;
      const value = input.type === "email" ? "jane@example.com" : "Valid response";
      fireEvent.change(input, { target: { value } });
    }
    for (const textarea of form!.querySelectorAll<HTMLTextAreaElement>("textarea[required]")) {
      fireEvent.change(textarea, { target: { value: "A measurable project outcome" } });
    }
    for (const select of form!.querySelectorAll<HTMLSelectElement>("select[required]")) {
      const option = Array.from(select.options).find(({ value }) => value);
      expect(option).toBeDefined();
      fireEvent.change(select, { target: { value: option!.value } });
    }
    fireEvent.click(screen.getByLabelText("Generate leads and inquiries"));
    fireEvent.click(
      screen.getByRole("checkbox", { name: /authorized to submit this project request/i }),
    );
    fireEvent.submit(form!);

    expect(await screen.findByText("Enter the Six-Digit Code")).toBeInTheDocument();
    expect(screen.queryByText("Project Details Received")).not.toBeInTheDocument();

    const initialCall = fetchMock.mock.calls.find(([url]) => url === "/api/intake");
    expect(initialCall).toBeDefined();
    const initialBody = JSON.parse(initialCall![1]?.body as string);
    expect(initialBody.contactEmail).toBe("jane@example.com");
    expect(initialBody.submissionId).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(initialBody.humanAttestation).toBe(true);
    expect(initialBody.interactionDurationMs).toEqual(expect.any(Number));
    expect(initialBody).not.toHaveProperty("submittedAt");
    expect(initialBody).not.toHaveProperty("userAgent");
    expect(initialBody).not.toHaveProperty("referrer");

    fireEvent.change(screen.getByLabelText(/confirmation code/i), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm and send project details/i }));

    expect(await screen.findByText("Project Details Received")).toBeInTheDocument();
    const intakeCalls = fetchMock.mock.calls.filter(([url]) => url === "/api/intake");
    expect(intakeCalls).toHaveLength(2);
    const verifiedBody = JSON.parse(intakeCalls[1][1]?.body as string);
    expect(verifiedBody).toEqual(
      expect.objectContaining({
        submissionId: initialBody.submissionId,
        challengeId: CHALLENGE_ID,
        verificationCode: "654321",
      }),
    );
  });
});
