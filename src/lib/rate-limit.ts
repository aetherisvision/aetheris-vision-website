import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Shared rate limiter.
 *
 * Issue #12: per-instance `new Map()` limiters are ineffective on Vercel —
 * each serverless/edge instance has its own memory, so an attacker spread
 * across instances bypasses the limit and counters reset on cold start.
 *
 * When the Upstash Redis env vars are present (provisioned via the Vercel
 * Marketplace — "Vercel KV" is Upstash Redis under the hood) this uses a
 * distributed fixed-window limiter shared across all instances. When they are
 * absent (local dev / CI) it falls back to the previous in-memory limiter so
 * the app still runs without external infrastructure.
 *
 * Works in both the Edge runtime (proxy.ts) and the Node.js runtime (API
 * routes): the Upstash client is REST/fetch-based.
 */
export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
  /** Namespace so different routes do not share counters. */
  prefix: string
}

export interface RateLimitResult {
  success: boolean
  /** Requests remaining in the current window. */
  remaining: number
  /** Seconds until the window resets — use for the `Retry-After` header. */
  retryAfterSeconds: number
}

/** True when the distributed (Upstash/Vercel KV) backend is configured. */
export function isRateLimitDistributed(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  )
}

// ---- Distributed backend (Upstash Redis) -----------------------------------

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function msToDuration(windowMs: number): Duration {
  const seconds = Math.max(1, Math.ceil(windowMs / 1000))
  return `${seconds} s`
}

function getLimiter(opts: RateLimitOptions): Ratelimit {
  const key = `${opts.prefix}:${opts.limit}:${opts.windowMs}`
  let limiter = limiters.get(key)
  if (!limiter) {
    redis ??= Redis.fromEnv()
    limiter = new Ratelimit({
      redis,
      // Fixed window matches the previous in-memory semantics.
      limiter: Ratelimit.fixedWindow(opts.limit, msToDuration(opts.windowMs)),
      prefix: `rl:${opts.prefix}`,
      analytics: false,
    })
    limiters.set(key, limiter)
  }
  return limiter
}

// ---- In-memory fallback ----------------------------------------------------

const memStore = new Map<string, { count: number; resetAt: number }>()

// Hard cap on the in-memory store so high-cardinality traffic (many unique
// IPs) or a sustained attack during a Redis outage cannot grow it without
// bound in a long-lived Node process.
const MAX_MEM_ENTRIES = 10000

function sweepExpired(now: number): void {
  // Opportunistic cleanup to bound memory (replaces the per-route setInterval).
  if (memStore.size < MAX_MEM_ENTRIES) return
  for (const [k, v] of memStore.entries()) {
    if (now > v.resetAt) memStore.delete(k)
  }
  // If still over the cap after removing expired entries, evict oldest
  // (insertion-order) entries until back under the limit.
  if (memStore.size >= MAX_MEM_ENTRIES) {
    const evict = memStore.size - MAX_MEM_ENTRIES + 1
    let i = 0
    for (const k of memStore.keys()) {
      memStore.delete(k)
      if (++i >= evict) break
    }
  }
}

function memoryLimit(identifier: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  sweepExpired(now)
  const key = `${opts.prefix}:${identifier}`
  const entry = memStore.get(key)

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { success: true, remaining: opts.limit - 1, retryAfterSeconds: 0 }
  }

  if (entry.count >= opts.limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    }
  }

  entry.count++
  return { success: true, remaining: opts.limit - entry.count, retryAfterSeconds: 0 }
}

// ---- Public API ------------------------------------------------------------

/**
 * Check (and consume) one unit of rate-limit budget for `identifier` (usually
 * the client IP). Returns whether the request is allowed plus headroom/retry
 * info. Never throws: a distributed-backend failure degrades to the in-memory
 * limiter so the site stays up.
 */
export async function rateLimit(
  identifier: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  if (isRateLimitDistributed()) {
    try {
      const { success, remaining, reset } = await getLimiter(opts).limit(identifier)
      const retry = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
      return {
        success,
        remaining: Math.max(0, remaining),
        // Guarantee a non-zero Retry-After on denial even if clock skew makes
        // the computed value 0, so clients don't hot-loop retries.
        retryAfterSeconds: success ? retry : Math.max(1, retry),
      }
    } catch (err) {
      // A Redis/network failure must not take the site down — fall back to the
      // per-instance limiter for this request.
      console.error('rate-limit: distributed backend error, using in-memory fallback', err)
      return memoryLimit(identifier, opts)
    }
  }
  return memoryLimit(identifier, opts)
}

/** Test-only: clear the in-memory store between cases. */
export function __resetInMemoryRateLimit(): void {
  memStore.clear()
}
