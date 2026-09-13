/**
 * Basic in-memory rate limiting / abuse protection.
 *
 * Fixed-window counters keyed by an anonymized client key (hashed IP — never
 * the raw address). Honest limitation: on Cloudflare Workers each isolate has
 * its own memory, so this is per-isolate best-effort throttling rather than a
 * global quota — cheap, dependency-free, and sufficient to stop casual abuse
 * and runaway clients. MongoDB is intentionally NOT used as a limiter store
 * to keep every ingestion a single write path.
 */

type Window = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & {
  __kharchaRateWindows?: Map<string, Window>;
};

const windows: Map<string, Window> = (globalStore.__kharchaRateWindows ??= new Map());

/** Periodically drop expired windows so the map can't grow unbounded. */
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, win] of windows) {
    if (win.resetAt <= now) windows.delete(key);
  }
}

export type RateResult = { allowed: boolean; remaining: number };

/**
 * @param key     anonymized bucket key (e.g. "ingest:<iphash>")
 * @param limit   max requests per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);

  const win = windows.get(key);
  if (!win || win.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (win.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  win.count += 1;
  return { allowed: true, remaining: limit - win.count };
}

export const RATE_LIMITS = {
  /** Analytics ingestion: 30 requests / minute / client. */
  ingest: { limit: 30, windowMs: 60_000 },
  /** Admin login attempts: 10 / 5 minutes / client. */
  login: { limit: 10, windowMs: 5 * 60_000 },
} as const;
