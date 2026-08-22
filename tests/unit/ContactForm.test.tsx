import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation's useSearchParams so the client component can read
// query params in the jsdom test environment. `holder.params` is mutable so
// individual tests can simulate different URLs.
const holder = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => holder.params,
}));

import ContactForm from "@/components/ContactForm";

beforeEach(() => {
  holder.params = new URLSearchParams();
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function setField(id: string, value: string) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
  fireEvent.change(el, { target: { value } });
}

function blurField(id: string) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
  fireEvent.blur(el);
}

function fillValidFields() {
  setField("name", "Jane Doe");
  setField("email", "jane@example.com");
  setField("message", "This is a valid message long enough.");
  confirmHumanSubmission();
}

function confirmHumanSubmission() {
  const checkbox = screen.getByRole("checkbox", {
    name: /not an automated agent or bot/i,
  });
  if (!(checkbox as HTMLInputElement).checked) {
    fireEvent.click(checkbox);
  }
}

describe("ContactForm — unavailable notice", () => {
  // The form can't know server-side config up front, so the "unavailable"
  // notice is surfaced reactively when the API returns 503 (RESEND_API_KEY
  // unset). Simulate that response and assert the notice renders.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("offers a consultation without exposing direct contact details after a 503", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({ error: "Form not configured" }) })
    ));
    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));

    const notice = await screen.findByRole("status");
    const text = notice.textContent?.replace(/\s+/g, " ").trim();
    expect(text).toContain("try again later or book a free consultation.");
    expect(notice.querySelector('a[href="/book#consultation"]')).not.toBeNull();
    expect(notice.innerHTML).not.toContain("mailto:");
    expect(notice.innerHTML).not.toContain("tel:");
  });
});

describe("ContactForm — submit validation", () => {
  it("shows all required field errors when submitted empty", async () => {
    render(<ContactForm />);
    confirmHumanSubmission();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Email address is required.")).toBeInTheDocument();
    expect(screen.getByText("Message is required.")).toBeInTheDocument();
  });

  it("shows error for name under 2 characters", async () => {
    render(<ContactForm />);
    setField("name", "A");
    confirmHumanSubmission();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Name must be at least 2 characters.")).toBeInTheDocument();
  });

  it("shows error for invalid characters in name", async () => {
    render(<ContactForm />);
    setField("name", "Jane123");
    confirmHumanSubmission();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Name contains invalid characters.")).toBeInTheDocument();
  });

  it("shows error for invalid email format", async () => {
    render(<ContactForm />);
    setField("name", "Jane Doe");
    setField("email", "not-an-email");
    setField("message", "This is a valid message long enough.");
    confirmHumanSubmission();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows error for email missing TLD", async () => {
    render(<ContactForm />);
    setField("name", "Jane Doe");
    setField("email", "jane@example");
    setField("message", "This is a valid message long enough.");
    confirmHumanSubmission();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows error when message is under 10 characters", async () => {
    render(<ContactForm />);
    setField("name", "Jane Doe");
    setField("email", "jane@example.com");
    setField("message", "Short");
    confirmHumanSubmission();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Message must be at least 10 characters.")).toBeInTheDocument();
  });

  it("accepts names with hyphens and apostrophes", async () => {
    render(<ContactForm />);
    setField("name", "Mary-Jane O'Brien");
    setField("email", "mj@example.com");
    setField("message", "This is a valid message long enough.");
    confirmHumanSubmission();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(screen.queryByText(/name is required|name must|name contains/i)).not.toBeInTheDocument();
  });
});

describe("ContactForm — blur validation", () => {
  it("shows name error on blur when empty", async () => {
    render(<ContactForm />);
    blurField("name");
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
  });

  it("shows email error on blur when invalid", async () => {
    render(<ContactForm />);
    setField("email", "bad@email");
    blurField("email");
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows message error on blur when too short", async () => {
    render(<ContactForm />);
    setField("message", "Hi");
    blurField("message");
    expect(await screen.findByText("Message must be at least 10 characters.")).toBeInTheDocument();
  });

  it("clears error when field is corrected after blur", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    blurField("name");
    await screen.findByText("Name is required.");
    await user.type(screen.getByLabelText(/^name/i), "Jane Doe");
    expect(screen.queryByText("Name is required.")).not.toBeInTheDocument();
  });

  it("re-validates live after field has been touched", async () => {
    render(<ContactForm />);
    // Touch the email field with an invalid value
    setField("email", "bad");
    blurField("email");
    await screen.findByText("Enter a valid email address.");
    // Now fix it — error should clear immediately
    setField("email", "jane@example.com");
    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
  });
});

describe("ContactForm — query param prefill", () => {
  it("prefills the message field from the ?topic= param", () => {
    holder.params = new URLSearchParams("topic=Please send me the Aetheris Vision capability statement.");
    render(<ContactForm />);
    const message = document.getElementById("message") as HTMLTextAreaElement;
    expect(message.value).toBe("Please send me the Aetheris Vision capability statement.");
  });

  it("prefills a recognized requirement from the ?requirement= param", () => {
    holder.params = new URLSearchParams("requirement=Capability Statement Request");
    render(<ContactForm />);
    const requirement = document.getElementById("requirement") as HTMLSelectElement;
    expect(requirement.value).toBe("Capability Statement Request");
  });

  it("ignores an unrecognized requirement from the query string", () => {
    holder.params = new URLSearchParams("requirement=Not A Real Category");
    render(<ContactForm />);
    const requirement = document.getElementById("requirement") as HTMLSelectElement;
    expect(requirement.value).toBe("");
  });

  it("prefills the message field from the ?subject= param", () => {
    holder.params = new URLSearchParams("subject=Federal partnership inquiry");
    render(<ContactForm />);
    const message = document.getElementById("message") as HTMLTextAreaElement;
    expect(message.value).toBe("Federal partnership inquiry");
  });

  it("leaves the message field empty when no param is present", () => {
    render(<ContactForm />);
    const message = document.getElementById("message") as HTMLTextAreaElement;
    expect(message.value).toBe("");
  });
});

describe("ContactForm — character count", () => {
  it("shows character counter when message has content", () => {
    render(<ContactForm />);
    setField("message", "Hello world");
    expect(screen.getByText(/11 \/ 5,000/)).toBeInTheDocument();
  });

  it("does not show counter when message is empty", () => {
    render(<ContactForm />);
    expect(screen.queryByText(/\/ 5,000/)).not.toBeInTheDocument();
  });
});

describe("ContactForm — submission", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires email confirmation before showing the success state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: () =>
          Promise.resolve({
            ok: true,
            stage: "verification",
            challengeId: "11111111-1111-4111-8111-111111111111",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: () => Promise.resolve({ ok: true, stage: "submitted" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));

    expect(await screen.findByText("Enter the six-digit code")).toBeInTheDocument();
    expect(screen.queryByText("Message received")).not.toBeInTheDocument();

    const firstBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(firstBody).toEqual(
      expect.objectContaining({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "This is a valid message long enough.",
        humanAttestation: true,
      }),
    );
    expect(firstBody.interactionDurationMs).toEqual(expect.any(Number));
    expect(firstBody.submissionId).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(firstBody).not.toHaveProperty("challengeId");

    fireEvent.change(screen.getByLabelText(/confirmation code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm and submit/i }));

    expect(await screen.findByText("Message received")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const secondBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(secondBody).toEqual(
      expect.objectContaining({
        submissionId: firstBody.submissionId,
        challengeId: "11111111-1111-4111-8111-111111111111",
        verificationCode: "123456",
      }),
    );
  });

  it("fails closed when the API returns an unexpected successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        }),
      ),
    );

    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The service returned an unexpected response.",
    );
    expect(screen.queryByText("Message received")).not.toBeInTheDocument();
  });

  it("shows error message on API failure", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      })
    ));
    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Something went wrong/);
    expect(alert.querySelector('a[href="/book#consultation"]')).toHaveTextContent("book a free consultation");
    expect(alert.querySelector('a[href^="mailto:"]')).not.toBeInTheDocument();
    expect(alert.querySelector('a[href^="tel:"]')).not.toBeInTheDocument();
  });

  it("shows rate limit message on 429", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({}) })
    ));
    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText(/Too many submissions/)).toBeInTheDocument();
  });
});
