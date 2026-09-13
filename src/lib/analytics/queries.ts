import { COLLECTIONS, DB_HARD_TIMEOUT_MS, withAnalyticsDb } from "./mongo";

/**
 * Dashboard read path — 100% MongoDB aggregation pipelines.
 * No raw event documents ever reach the frontend; every query returns
 * grouped, counted, bounded results (max 8 buckets per breakdown).
 *
 * The whole read is raced against DB_HARD_TIMEOUT_MS: if any aggregation
 * (or the connection itself) never settles — the driver's promises can hang
 * forever in the Workers runtime — the page still renders its amber
 * "database unreachable" fallback instead of hanging the Worker.
 */

export type DateRange = "today" | "7d" | "30d" | "all";

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export function parseDateRange(value: string | undefined | null): DateRange {
  return DATE_RANGES.some((r) => r.value === value) ? (value as DateRange) : "7d";
}

function sinceFor(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 86_400_000);
    case "30d":
      return new Date(now.getTime() - 30 * 86_400_000);
    case "all":
      return null;
  }
}

export type Bucket = { label: string; count: number };
export type DayPoint = { day: string; visitors: number; pageviews: number; downloads: number };

export type DashboardData = {
  range: DateRange;
  totalVisitors: number; // sessions
  uniqueVisitors: number; // distinct visitor IDs
  pageviews: number;
  downloadClicks: number;
  conversionRate: number; // downloadClicks / uniqueVisitors * 100
  daily: DayPoint[];
  devices: Bucket[];
  browsers: Bucket[];
  operatingSystems: Bucket[];
  referrers: Bucket[];
  topPaths: Bucket[];
};

export async function getDashboardData(range: DateRange): Promise<DashboardData> {
  // One hard-capped database session — see file header. A never-settling
  // driver promise must degrade to the page's amber fallback, never hang
  // the Worker.
  return withAnalyticsDb((db) => getDashboardDataWithDb(db, range), "dashboard-read", DB_HARD_TIMEOUT_MS);
}

async function getDashboardDataWithDb(db: import("mongodb").Db, range: DateRange): Promise<DashboardData> {
  const since = sinceFor(range);
  const visits = db.collection(COLLECTIONS.visits);
  const events = db.collection(COLLECTIONS.events);

  const rangeMatch = since ? { ts: { $gte: since } } : {};
  const visitRangeMatch = since ? { firstSeenAt: { $gte: since } } : {};

  const [
    visitorTotals,
    eventCounts,
    dailyRaw,
    deviceRows,
    browserRows,
    osRows,
    referrerRows,
    pathRows,
  ] = await Promise.all([
    // Sessions vs. unique visitors
    visits
      .aggregate([
        { $match: visitRangeMatch },
        {
          $group: {
            _id: null,
            sessions: { $sum: 1 },
            visitorIds: { $addToSet: "$visitorId" },
          },
        },
        { $project: { sessions: 1, visitors: { $size: "$visitorIds" } } },
      ])
      .toArray(),

    // page_view / download_click totals
    events
      .aggregate([
        { $match: { ...rangeMatch, name: { $in: ["page_view", "download_click"] } } },
        { $group: { _id: "$name", count: { $sum: 1 } } },
      ])
      .toArray(),

    // One pass for the whole daily series (visitors = distinct per day)
    events
      .aggregate([
        { $match: { ...rangeMatch, name: { $in: ["page_view", "download_click"] } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: "%Y-%m-%d", date: "$ts" } },
              name: "$name",
            },
            count: { $sum: 1 },
            visitorIds: { $addToSet: "$visitorId" },
          },
        },
        { $sort: { "_id.day": 1 } },
      ])
      .toArray(),

    // Breakdowns run over SESSION docs — they represent visitors, not raw
    // pageview volume, and already carry the entry snapshot.
    visits
      .aggregate([
        { $match: visitRangeMatch },
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray(),
    visits
      .aggregate([
        { $match: visitRangeMatch },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray(),
    visits
      .aggregate([
        { $match: visitRangeMatch },
        { $group: { _id: "$os", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray(),
    visits
      .aggregate([
        { $match: visitRangeMatch },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray(),

    // Top pages (by pageviews)
    events
      .aggregate([
        { $match: { ...rangeMatch, name: "page_view" } },
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray(),
  ]);

  const sessions = visitorTotals[0]?.sessions ?? 0;
  const uniqueVisitors = visitorTotals[0]?.visitors ?? 0;
  const counts = new Map(eventCounts.map((r) => [r._id as string, r.count as number]));
  const pageviews = counts.get("page_view") ?? 0;
  const downloadClicks = counts.get("download_click") ?? 0;

  const dailyMap = new Map<string, DayPoint>();
  for (const row of dailyRaw) {
    const day = row._id.day as string;
    const point = dailyMap.get(day) ?? { day, visitors: 0, pageviews: 0, downloads: 0 };
    if (row._id.name === "page_view") {
      point.pageviews = row.count;
      point.visitors = row.visitorIds.length;
    } else {
      point.downloads = row.count;
    }
    dailyMap.set(day, point);
  }

  return {
    range,
    totalVisitors: sessions,
    uniqueVisitors,
    pageviews,
    downloadClicks,
    conversionRate:
      uniqueVisitors > 0 ? Math.round((downloadClicks / uniqueVisitors) * 1000) / 10 : 0,
    daily: Array.from(dailyMap.values()),
    devices: toBuckets(deviceRows),
    browsers: toBuckets(browserRows),
    operatingSystems: toBuckets(osRows),
    referrers: toBuckets(referrerRows),
    topPaths: toBuckets(pathRows),
  };
}

function toBuckets(rows: readonly { _id?: unknown; count?: unknown }[]): Bucket[] {
  return rows
    .filter((r) => r._id != null)
    .map((r) => ({
      label: String(r._id) || "Unknown",
      count: typeof r.count === "number" ? r.count : Number(r.count ?? 0),
    }));
}
