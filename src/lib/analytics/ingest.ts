import type { ObjectId } from "mongodb";
import { getAnalyticsBinding } from "./env";
import { COLLECTIONS, getAnalyticsDb } from "./mongo";
import { referrerHost, sanitizePath, type IngestPayload } from "./schema";
import { parseUserAgent, type UaInfo } from "./ua";

/**
 * Write path for analytics — server side only.
 *
 * Data model
 * ──────────
 * analytics_visits  one doc per session (visitor + browser session):
 *                   entry page, referrer host, device snapshot, coarse
 *                   country (Cloudflare header), pageview counter.
 * analytics_events  one doc per tracked action (page_view, download_click,
 *                   …) with its own device snapshot + optional flat metadata.
 *
 * Privacy invariants enforced here:
 * - raw IPs are NEVER persisted (they are only hashed in-memory for the
 *   rate-limit bucket by the route handler);
 * - referrers are stored as bare hostnames ("google.com"), paths have query
 *   strings stripped;
 * - no account/email/form data exists anywhere in these payloads.
 */

export type VisitDoc = {
  visitorId: string;
  sessionId: string;
  entryPath: string;
  referrer: string;
  deviceType: string;
  browser: string;
  os: string;
  country?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  pageviews: number;
};

export type EventDoc = {
  visitorId: string;
  sessionId: string;
  name: string;
  path: string;
  referrer: string;
  deviceType: string;
  browser: string;
  os: string;
  screen?: string;
  meta?: Record<string, string | number | boolean>;
  ts: Date;
  _id?: ObjectId;
};

let indexesReady: Promise<void> | null = null;

/** Creates collections + indexes once per process. TTL indexes are only
 * added when ANALYTICS_RETENTION_DAYS is set. */
export function ensureIndexes(): Promise<void> {
  indexesReady ??= (async () => {
    const db = await getAnalyticsDb();
    const retentionDays = Number(getAnalyticsBinding("ANALYTICS_RETENTION_DAYS"));

    const events = db.collection(COLLECTIONS.events);
    const visits = db.collection(COLLECTIONS.visits);

    await Promise.all([
      events.createIndex({ ts: 1 }),
      events.createIndex({ name: 1, ts: 1 }),
      events.createIndex({ visitorId: 1, ts: 1 }),
      events.createIndex({ path: 1, ts: 1 }),
      visits.createIndex({ visitorId: 1, sessionId: 1 }, { unique: true }),
      visits.createIndex({ visitorId: 1 }),
      visits.createIndex({ firstSeenAt: 1 }),
      Number.isFinite(retentionDays) && retentionDays > 0
        ? events.createIndex({ ts: 1 }, { expireAfterSeconds: Math.floor(retentionDays * 86_400) })
        : Promise.resolve(),
      Number.isFinite(retentionDays) && retentionDays > 0
        ? visits.createIndex({ lastSeenAt: 1 }, { expireAfterSeconds: Math.floor(retentionDays * 86_400) })
        : Promise.resolve(),
    ]);
  })().catch((err) => {
    indexesReady = null; // allow retry on next request
    throw err;
  });
  return indexesReady;
}

function deviceFields(ua: UaInfo) {
  return {
    deviceType: ua.deviceType,
    browser: ua.browser,
    os: ua.os,
  };
}

/** Upserts the session visit doc + inserts the event doc. */
export async function recordAnalytics(
  payload: IngestPayload,
  ua: UaInfo,
  country: string | undefined,
): Promise<void> {
  const db = await getAnalyticsDb();
  await ensureIndexes();

  const now = new Date();
  const path = sanitizePath(payload.path);
  const referrer = referrerHost(payload.referrer);
  const isPageview = payload.type === "pageview";

  const visitUpdate = {
    $setOnInsert: {
      visitorId: payload.visitorId,
      sessionId: payload.sessionId,
      entryPath: path,
      referrer,
      ...deviceFields(ua),
      ...(country ? { country } : {}),
      firstSeenAt: now,
    },
    $set: { lastSeenAt: now },
    ...(isPageview ? { $inc: { pageviews: 1 } } : {}),
  };

  const eventDoc: EventDoc = {
    visitorId: payload.visitorId,
    sessionId: payload.sessionId,
    name: isPageview ? "page_view" : payload.name,
    path,
    referrer,
    ...deviceFields(ua),
    ...(payload.screen ? { screen: payload.screen } : {}),
    ...(payload.type === "event" && payload.meta ? { meta: payload.meta } : {}),
    ts: now,
  };

  await Promise.all([
    db.collection(COLLECTIONS.visits).updateOne(
      { visitorId: payload.visitorId, sessionId: payload.sessionId },
      visitUpdate,
      { upsert: true },
    ),
    db.collection(COLLECTIONS.events).insertOne(eventDoc),
  ]);
}
