/**
 * In-memory rate limiter — server-side only.
 *
 * Uses a Map of key -> { count, windowStart }. Expired entries are pruned on
 * each call to avoid unbounded memory growth. Suitable for a single-process
 * server (which is the case for this Next.js app).
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Prune at most once per ~30s to keep the map small without overhead.
let lastPrune = Date.now();
const PRUNE_INTERVAL_MS = 30_000;

interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
}

/**
 * Check a rate limit for the given key.
 *
 * @param key     Stable identifier (e.g. `signup:init:ip:1.2.3.4`).
 * @param limit   Maximum number of requests allowed in the window.
 * @param windowMs  Window duration in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic pruning of expired entries.
  if (now - lastPrune > PRUNE_INTERVAL_MS) {
    lastPrune = now;
    for (const [k, b] of buckets) {
      if (now - b.windowStart > windowMs) {
        buckets.delete(k);
      }
    }
  }

  const existing = buckets.get(key);
  if (!existing || now - existing.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, remaining: 0, resetAt: existing.windowStart + windowMs };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.windowStart + windowMs,
  };
}
