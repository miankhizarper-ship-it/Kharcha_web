import { MongoClient, type Db } from "mongodb";
import { getAnalyticsBinding } from "./env";
import { isSrvUri, resolveSrvUri } from "./srv";

/**
 * Analytics MongoDB access — server-only module.
 *
 * Never imported from client components. The connection string lives in
 * MONGODB_URI (server env / Worker secret) and is NEVER shipped to the
 * browser — the frontend only ever sees the boolean `isAnalyticsConfigured`.
 *
 * WORKERS RUNTIME MODEL (learned from the production hang incident):
 *
 * 1. Outbound sockets on workerd are tied to the request context that opened
 *    them and are cancelled when that context ends. A MongoClient with a
 *    connection pool cached ACROSS requests therefore keeps handing out
 *    sockets that are already dead — operations on them wait for a response
 *    that never arrives, and even the driver's own timeouts may not fire.
 *    That is exactly what hung /admin/analytics and /api/analytics in
 *    production until the runtime cancelled the requests.
 *
 * 2. Consequently a FRESH client is opened per database session (see
 *    `withAnalyticsDb`) and closed when the session ends. The TCP+TLS+auth
 *    handshake costs at most a few hundred milliseconds — negligible for a
 *    low-traffic landing page, and correct by construction.
 *
 * 3. Every awaited database step is ALSO raced against a plain timer (hard
 *    cap). A timer always fires, so a response is always produced — an
 *    unreachable database degrades to a 503 / amber banner instead of ever
 *    hanging the Worker.
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

const CLIENT_OPTIONS = {
  maxPoolSize: 4,
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 5_000,
  socketTimeoutMS: 8_000,
  /** Short-lived monitoring connections instead of persistent heartbeat
   * streams — the right mode for request-scoped clients on serverless. */
  serverMonitoringMode: "poll" as const,
} as const;

/** Guaranteed ceiling for one database session (connect + the operation
 * batch) and the default cap passed to `withDbTimeout`. */
export const DB_HARD_TIMEOUT_MS = 8_000;

/** Thrown when the hard cap fires — routes treat it like any other
 * database failure (503 / amber fallback); callers never see a hang. */
export class MongoDbTimeoutError extends Error {
  readonly label: string;
  readonly ms: number;
  constructor(label: string, ms: number) {
    super(`MongoDB "${label}" exceeded the ${ms}ms hard cap`);
    this.name = "MongoDbTimeoutError";
    this.label = label;
    this.ms = ms;
  }
}

/** True when a MongoDB URI is configured — safe to expose to the client. */
export function isAnalyticsConfigured(): boolean {
  return mongoUri().length > 0;
}

/** Race any promise against a hard timer. On timeout a MongoDbTimeoutError
 * is thrown — never a silent hang. */
export function withDbTimeout<T>(
  task: Promise<T>,
  label: string,
  ms: number = DB_HARD_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new MongoDbTimeoutError(label, ms));
    }, ms);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Run `fn` with a FRESH database handle and close the client afterwards.
 * One session per request (or per logical batch of operations); sessions
 * never share sockets, so a dead socket from an ended request context can
 * never be reused.
 */
export function withAnalyticsDb<T>(
  fn: (db: Db) => Promise<T>,
  label: string,
  ms: number = DB_HARD_TIMEOUT_MS,
): Promise<T> {
  return withDbTimeout(runWithClient(fn), label, ms);
}

async function runWithClient<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await buildClient();
  try {
    return await fn(client.db(mongoDbName()));
  } finally {
    void closeQuietly(client);
  }
}

/** Build + connect the client, resolving mongodb+srv:// via DoH first
 * (workerd cannot do the driver's own SRV lookups — see ./srv.ts). */
async function buildClient(): Promise<MongoClient> {
  const uri = mongoUri();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }
  const effectiveUri = isSrvUri(uri) ? (await resolveSrvUri(uri)).seedUri : uri;
  const client = new MongoClient(effectiveUri, CLIENT_OPTIONS);
  try {
    await client.connect();
    return client;
  } catch (err) {
    void closeQuietly(client);
    throw err;
  }
}

/** Best-effort close that can itself never hang (a close on dead sockets
 * may never settle in workerd). Errors are ignored by design. */
async function closeQuietly(client: MongoClient): Promise<void> {
  try {
    await withDbTimeout(client.close(true), "client-close", 2_000);
  } catch {
    // ignore — the runtime reaps the sockets with the request context
  }
}

export const COLLECTIONS = {
  visits: "analytics_visits",
  events: "analytics_events",
} as const;
