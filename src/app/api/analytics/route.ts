import { NextResponse } from "next/server";
import { isAnalyticsConfigured } from "@/lib/analytics/mongo";
import { recordAnalytics } from "@/lib/analytics/ingest";
import { RATE_LIMITS, rateLimit } from "@/lib/analytics/rate-limit";
import { ingestSchema } from "@/lib/analytics/schema";
import { anonymizeIp } from "@/lib/analytics/server-utils";
import { parseUserAgent } from "@/lib/analytics/ua";

/**
 * POST /api/analytics — single ingestion endpoint (event-based payload).
 *
 * Contract with the client tracker:
 * - fire-and-forget via sendBeacon (fetch keepalive fallback);
 * - a 2 KB payload cap, strict zod validation, per-IP-hashed rate limit;
 * - device/browser/OS parsed SERVER-SIDE from the User-Agent header —
 *   never trusted from the body;
 * - raw IPs are hashed for the rate-limit bucket only and never persisted;
 * - bots are silently dropped;
 * - every failure mode returns quickly and never leaks internals —
 *   analytics being down must never affect the site or the download.
 */

const MAX_PAYLOAD_BYTES = 2048;

/** Two-letter country code from Cloudflare's edge header, if present. */
function coarseCountry(request: Request): string | undefined {
  const c = request.headers.get("cf-ipcountry");
  if (!c || c === "XX" || c === "T1" || !/^[A-Z]{2}$/.test(c)) return undefined;
  return c;
}

export async function POST(request: Request) {
  try {
    const ipHash = anonymizeIp(request);

    if (!rateLimit(`ingest:${ipHash}`, RATE_LIMITS.ingest.limit, RATE_LIMITS.ingest.windowMs).allowed) {
      return new NextResponse(null, { status: 429 });
    }

    if (!isAnalyticsConfigured()) {
      // Not an error from the client's perspective — tracking is disabled.
      return new NextResponse(null, { status: 204 });
    }

    const length = Number(request.headers.get("content-length") ?? "0");
    if (length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "payload too large" }, { status: 413 });
    }

    const raw = await request.text();
    if (raw.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "payload too large" }, { status: 413 });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const parsed = ingestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const ua = parseUserAgent(request.headers.get("user-agent"));
    if (ua.deviceType === "bot") {
      // Keep bot traffic out of the funnel entirely; pretend success.
      return new NextResponse(null, { status: 204 });
    }

    await recordAnalytics(parsed.data, ua, coarseCountry(request));

    // sendBeacon ignores responses — keep it tiny.
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // Mongo down, write failed, anything else: analytics is best-effort.
    // Log server-side only (never leak internals to the client).
    console.error("[analytics] ingest failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "analytics unavailable" }, { status: 503 });
  }
}
