import { z } from "zod";

/**
 * Ingestion payload contracts for POST /api/analytics.
 *
 * Everything the client sends is untrusted: strict allow-lists, hard length
 * caps, character-set restrictions. Device/browser/OS are parsed SERVER-SIDE
 * from the User-Agent header and never accepted from the payload. Referrers
 * are reduced to a hostname (no query strings — they can carry PII).
 */

export const EVENT_NAMES = [
  "page_view",
  "download_click",
  "github_click",
  "external_link_click",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

/** Opaque first-party identifiers generated client-side (UUID-ish). */
const idSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "invalid id charset");

const pathSchema = z
  .string()
  .max(200)
  .regex(/^\/[A-Za-z0-9\-._~%/]*$/, "path must start with /");

/** Coarse viewport/screen string like "412x915" — no exact positioning data. */
const screenSchema = z
  .string()
  .regex(/^\d{2,5}x\d{2,5}$/)
  .max(11)
  .optional();

/** Flat scalar metadata for future events — no nesting, no huge values. */
const metaSchema = z
  .record(
    z.string().min(1).max(40).regex(/^[A-Za-z0-9_.-]+$/),
    z.union([z.string().max(200), z.number().finite(), z.boolean()]),
  )
  .optional();

const shared = {
  visitorId: idSchema,
  sessionId: idSchema,
  path: pathSchema,
  screen: screenSchema,
};

export const pageviewSchema = z.object({
  type: z.literal("pageview"),
  ...shared,
  referrer: z.union([z.string().max(300), z.literal("")]).optional(),
});

export const eventSchema = z.object({
  type: z.literal("event"),
  ...shared,
  name: z.enum(EVENT_NAMES),
  referrer: z.union([z.string().max(300), z.literal("")]).optional(),
  meta: metaSchema,
});

export const ingestSchema = z.discriminatedUnion("type", [
  pageviewSchema,
  eventSchema,
]);

export type IngestPayload = z.infer<typeof ingestSchema>;

/** Reduces a raw referrer URL to a safe host label for aggregation. */
export function referrerHost(raw: string | undefined | null): string {
  if (!raw) return "Direct";
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    return host || "Direct";
  } catch {
    // Garbage / malformed referrers collapse into Direct — never stored raw.
    return "Direct";
  }
}

/** Strips any query string from a path (defence in depth — clients are
 * validated to path-only already, but SPA routers can smuggle "?x=" in). */
export function sanitizePath(path: string): string {
  const q = path.indexOf("?");
  return q === -1 ? path : path.slice(0, q);
}
