import { createHash } from "node:crypto";
import { getAnalyticsBinding } from "./env";

/**
 * Shared server-only helpers for API routes.
 */

/**
 * Derives a daily-rotating, salted SHA-256 bucket key from the client IP.
 * Raw IPs are NEVER logged or persisted — this hash is used only for
 * in-memory rate-limit buckets and changes every day, so it cannot track a
 * visitor across days either.
 */
export function anonymizeIp(request: Request): string {
  const raw =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";
  const salt = `${getAnalyticsBinding("ANALYTICS_IP_SALT") || getAnalyticsBinding("ANALYTICS_SESSION_SECRET") || "kharcha"}:${new Date().toISOString().slice(0, 10)}`;
  return createHash("sha256").update(`${salt}:${raw}`).digest("hex");
}
