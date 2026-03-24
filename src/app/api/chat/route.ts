import Anthropic from "@anthropic-ai/sdk";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-context";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// In-memory rate limiter
// Limits: 20 requests per IP per 15-minute window
// ---------------------------------------------------------------------------
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;
const MAX_TURNS = 10; // max conversation turns per session

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Purge stale entries every 15 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, WINDOW_MS);

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

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
  const { allowed, retryAfter } = checkRateLimit(ip);

  if (!allowed) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
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
    const sanitized: Anthropic.MessageParam[] = messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0 &&
          m.content.length <= 500 // match frontend cap
      )
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    if (sanitized.length === 0 || sanitized[0].role !== "user") {
      return new Response("Invalid message sequence", { status: 400 });
    }

    const stream = client.messages.stream({
      model: "claude-haiku-4-5",
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
