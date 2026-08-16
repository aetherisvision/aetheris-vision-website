import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
}

describe("ContactForm — unavailable notice", () => {
  // The form can't know server-side config up front, so the "unavailable"
  // notice is surfaced reactively when the API returns 503 (RESEND_API_KEY
  // unset). Simulate that response and assert the notice renders.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the notice with correct spacing around the links after a 503", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({ error: "Form not configured" }) })
    ));
    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));

    const notice = await screen.findByRole("status");
    // Collapse runtime whitespace and assert no words are glued together.
    const text = notice.textContent?.replace(/\s+/g, " ").trim();
    expect(text).toContain("or book a call and we'll follow up.");
    expect(text).not.toMatch(/book a calland/);
  });
});

describe("ContactForm — submit validation", () => {
  it("shows all required field errors when submitted empty", async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Email address is required.")).toBeInTheDocument();
    expect(screen.getByText("Message is required.")).toBeInTheDocument();
  });

  it("shows error for name under 2 characters", async () => {
    render(<ContactForm />);
    setField("name", "A");
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Name must be at least 2 characters.")).toBeInTheDocument();
  });

  it("shows error for invalid characters in name", async () => {
    render(<ContactForm />);
    setField("name", "Jane123");
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Name contains invalid characters.")).toBeInTheDocument();
  });

  it("shows error for invalid email format", async () => {
    render(<ContactForm />);
    setField("name", "Jane Doe");
    setField("email", "not-an-email");
    setField("message", "This is a valid message long enough.");
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows error for email missing TLD", async () => {
    render(<ContactForm />);
    setField("name", "Jane Doe");
    setField("email", "jane@example");
    setField("message", "This is a valid message long enough.");
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows error when message is under 10 characters", async () => {
    render(<ContactForm />);
    setField("name", "Jane Doe");
    setField("email", "jane@example.com");
    setField("message", "Short");
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Message must be at least 10 characters.")).toBeInTheDocument();
  });

  it("accepts names with hyphens and apostrophes", async () => {
    render(<ContactForm />);
    setField("name", "Mary-Jane O'Brien");
    setField("email", "mj@example.com");
    setField("message", "This is a valid message long enough.");
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

  it("shows success state after successful submission", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) })
    ));
    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
    expect(await screen.findByText("Inquiry received")).toBeInTheDocument();
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
    expect(await screen.findByText(/Something went wrong/)).toBeInTheDocument();
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
