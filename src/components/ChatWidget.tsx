"use client";

import { useState, useRef, useEffect } from "react";
import { XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { SITE } from "@/lib/constants";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING = `Hi! I'm the ${SITE.name} assistant. I can answer questions about our meteorology, AI/ML, web development, and consulting services. How can I help?`;

const SUGGESTIONS = [
  "What services do you offer?",
  "How much does a website cost?",
  "What contracting credentials do you hold?",
  "How do I get started?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: GREETING,
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...nextMessages, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (res.status === 429) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Too many requests. Please try again in a moment.",
          };
          return updated;
        });
        return;
      }

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "Sorry, something went wrong. Please reach us through the contact page at aetherisvision.com/contact.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content: GREETING,
      },
    ]);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-av-mid text-white shadow-lg hover:bg-av-accent transition-colors focus:outline-none focus:ring-2 focus:ring-av-light focus:ring-offset-2 focus:ring-offset-black"
      >
        {open ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="region"
          aria-label="Chat"
          className="fixed bottom-24 left-6 z-50 flex w-[22rem] flex-col rounded-2xl border border-white/10 bg-[#0d0c0f] shadow-2xl overflow-hidden"
          style={{ maxHeight: "min(32rem, calc(100svh - 8rem))" }}
        >

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/8 bg-black/40 px-4 py-3 shrink-0">
            <div className="h-8 w-8 rounded-full bg-av-mid/20 border border-av-accent/30 flex items-center justify-center shrink-0">
              <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4 text-av-light" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">Aetheris Vision</p>
              <p className="text-xs text-gray-500">AI Assistant</p>
            </div>
            <button
              type="button"
              onClick={clearChat}
              aria-label="Clear chat"
              className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-white/[0.06] hover:text-white transition-colors shrink-0"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-av-mid text-white rounded-br-sm"
                      : "bg-white/[0.06] text-gray-200 rounded-bl-sm"
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Suggestion chips — show after greeting only */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/8 bg-black/30 px-3 py-3 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about our services…"
                rows={1}
                disabled={streaming}
                maxLength={500}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-av-accent/50 focus:bg-white/[0.07] transition disabled:opacity-50"
                style={{ maxHeight: "6rem" }}
              />
              <button
                onClick={() => send(input)}
                disabled={streaming || !input.trim()}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-av-mid text-white hover:bg-av-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-600">
              Powered by Claude · <a href="/privacy" className="underline hover:text-gray-400">Privacy</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
