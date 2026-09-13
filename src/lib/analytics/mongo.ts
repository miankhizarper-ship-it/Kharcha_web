import { MongoClient } from "mongodb";

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

const uri = process.env.MONGODB_URI?.trim() ?? "";
const dbName = process.env.MONGODB_DATABASE?.trim() || "kharcha_analytics";

/** Fail fast (3s) so a down database never hangs a request for long. */
const CLIENT_OPTIONS = {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 3_000,
  connectTimeoutMS: 3_000,
  socketTimeoutMS: 5_000,
} as const;

const globalStore = globalThis as typeof globalThis & {
  __kharchaMongoClient_v2?: Promise<MongoClient>;
};

/** True when a MongoDB URI is configured — safe to expose to the client. */
export function isAnalyticsConfigured(): boolean {
  return uri.length > 0;
}

/** Cached Mongo client promise. Throws when MONGODB_URI is not set.
 * A failed connection attempt evicts itself so the NEXT request retries
 * (a down database must heal automatically once it comes back). */
export function getMongoClient(): Promise<MongoClient> {
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
  return getMongoClient().then((client) => client.db(dbName));
}

export const COLLECTIONS = {
  visits: "analytics_visits",
  events: "analytics_events",
} as const;
