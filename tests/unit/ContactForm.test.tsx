import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "@/components/ContactForm";

/** Set uncontrolled form field values so FormData picks them up. */
function setField(id: string, value: string) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
  fireEvent.change(el, { target: { value } });
}

function fillValidFields() {
  setField("name", "Jane Doe");
  setField("email", "jane@example.com");
  setField("message", "This is a valid message long enough.");
}

describe("ContactForm — inline validation", () => {
  it("shows all required field errors when submitted empty", async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Valid email address required.")).toBeInTheDocument();
    expect(screen.getByText("Message must be at least 10 characters.")).toBeInTheDocument();
  });

  it("clears name error when name is typed", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText("Name is required.");
    await user.type(screen.getByLabelText(/^name/i), "Jane");
    expect(screen.queryByText("Name is required.")).not.toBeInTheDocument();
  });

  it("shows error for invalid email format", async () => {
    render(<ContactForm />);
    setField("name", "Jane Doe");
    setField("email", "not-an-email");
    setField("message", "This is a valid message long enough.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText("Valid email address required.")).toBeInTheDocument();
  });

  it("shows error when message is under 10 characters", async () => {
    render(<ContactForm />);
    setField("name", "Jane Doe");
    setField("email", "jane@example.com");
    setField("message", "Short");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText("Message must be at least 10 characters.")).toBeInTheDocument();
  });
});

describe("ContactForm — submission", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ID", "test123");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("shows success state after successful submission", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) })
    ));
    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText("Message Received")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("shows rate limit message on 429", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({}) })
    ));
    render(<ContactForm />);
    fillValidFields();
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText(/Too many submissions/)).toBeInTheDocument();
  });
});
