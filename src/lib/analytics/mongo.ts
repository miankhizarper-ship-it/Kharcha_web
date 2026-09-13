import { MongoClient } from "mongodb";
import { getAnalyticsBinding } from "./env";

/**
 * Analytics MongoDB connection — server-only module.
 *
 * - Single cached client per process (reused across requests; required on
 *   Cloudflare Workers where a fresh TCP+TLS handshake per request would be
 *   far too slow).
 * - Stored on globalThis so Next.js dev hot-reloads don't open a new pool
 *   every time a module re-evaluates.
 * - Never imported from client components. The connection string lives in
 *   MONGODB_URI (server env / Worker secret) and is NEVER shipped to the
 *   browser — the frontend only ever sees the boolean `isAnalyticsConfigured`.
 *
 * All failures are expected to be handled by callers: analytics is a
 * best-effort feature and must never break the landing page.
 */

/**
 * Binding values are resolved LAZILY (per call) instead of at module scope —
 * module evaluation happens before request context exists, and a top-level
 * read would freeze whatever the worker booted with.
 */
function mongoUri(): string {
  return getAnalyticsBinding("MONGODB_URI");
}

function mongoDbName(): string {
  return getAnalyticsBinding("MONGODB_DATABASE") || "kharcha_analytics";
}

/** Generous timeouts (10s): workerd socket establishment can be slow under
 * CPU contention, and Atlas cold starts occasionally exceed 3s — a tight
 * window killed retried connections before the driver could re-attempt.
 * Ingest is fire-and-forget (sendBeacon) and every failure is caught by the
 * route (graceful 503), so a slow database never affects the visitor. */
const CLIENT_OPTIONS = {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 10_000,
} as const;

const globalStore = globalThis as typeof globalThis & {
  __kharchaMongoClient_v2?: Promise<MongoClient>;
};

/** True when a MongoDB URI is configured — safe to expose to the client. */
export function isAnalyticsConfigured(): boolean {
  return mongoUri().length > 0;
}

/** Cached Mongo client promise. Throws when MONGODB_URI is not set.
 * A failed connection attempt evicts itself so the NEXT request retries
 * (a down database must heal automatically once it comes back). */
export function getMongoClient(): Promise<MongoClient> {
  const uri = mongoUri();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }
  globalStore.__kharchaMongoClient_v2 ??= new MongoClient(uri, CLIENT_OPTIONS)
    .connect()
    .catch((err) => {
      globalStore.__kharchaMongoClient_v2 = undefined; // evict failed attempt
      throw err;
    });
  return globalStore.__kharchaMongoClient_v2;
}

export function getAnalyticsDb() {
  return getMongoClient().then((client) => client.db(mongoDbName()));
}

export const COLLECTIONS = {
  visits: "analytics_visits",
  events: "analytics_events",
} as const;
