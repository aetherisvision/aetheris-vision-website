import Anthropic from "@anthropic-ai/sdk";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-context";
import { rateLimit } from "@/lib/rate-limit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const runtime = "nodejs";

// Rate limit: 10 requests per IP per 15-minute window. Distributed across
// Vercel instances when Upstash/Vercel KV is configured, else in-memory
// fallback (issue #12).
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;
const MAX_TURNS = 10; // max conversation turns per session

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  // Rate limit check
  const ip = getClientIp(request);
  const { success, retryAfterSeconds } = await rateLimit(ip, {
    limit: MAX_REQUESTS,
    windowMs: WINDOW_MS,
    prefix: "chat",
  });

  if (!success) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Content-Type": "text/plain",
      },
    });
  }

  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("Invalid messages", { status: 400 });
    }

    // Sanitize: only user/assistant roles, string content, cap history at MAX_TURNS
    const filtered: Anthropic.MessageParam[] = messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0 &&
          m.content.length <= 500 // match frontend cap
      )
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    // Strip any leading assistant messages (e.g. welcome greeting from ChatWidget)
    // — the Anthropic API requires the first message to be from the user
    const sanitized = filtered.slice(
      filtered.findIndex((m) => m.role === "user")
    );

    if (sanitized.length === 0 || sanitized[0].role !== "user") {
      return new Response("Invalid message sequence", { status: 400 });
    }

    const stream = client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: CHAT_SYSTEM_PROMPT,
      messages: sanitized,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch {
          controller.error("Stream error");
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}
