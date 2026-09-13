import { withAnalyticsDb } from "./analytics/mongo";
import { resolveBinding } from "./analytics/env";
import { normalizeApkUrl } from "./apk-url";
/**
 * App release registry — server-side source of truth for the mobile app's
 * in-app update checker (GET /api/app-version).
 *
 * WHY THIS EXISTS: the Kharcha Android app asks the backend for the latest
 * available release on launch and compares Android versionCodes. The latest
 * release must be configurable WITHOUT shipping a new mobile build, so the
 * value can live in two places, in this order:
 *
 * 1. Environment bindings (explicit ops override — set in the Cloudflare
 *    dashboard like every other secret). When a full env release is present
 *    it WINS, because it must keep working even while MongoDB is unhealthy
 *    (the update check is a launch-time dependency of every app user).
 * 2. MongoDB `app_releases` (default store — preferred for ongoing release
 *    management; insert one document per release, highest `versionCode` with
 *    `enabled: true` wins).
 *
 * `APP_RELEASE_SOURCE` forces a mode: `environment` skips the database
 * entirely (escape hatch while MongoDB is broken), `database` skips env.
 *
 * Both sources pass through the SAME sanitizer before anything is served,
 * and every failure is contained: this module NEVER throws for "data is
 * bad/unavailable" — it degrades to the next source or to `null`.
 */

export interface AppRelease {
  version: string;
  versionCode: number;
  apkUrl: string;
  releaseNotes: string[];
  mandatory: boolean;
}

export type ReleaseSource = "environment" | "database" | "none";

export interface AppReleaseResolution {
  release: AppRelease | null;
  source: ReleaseSource;
}

/** MongoDB collection holding one document per release (default store). */
export const APP_RELEASES_COLLECTION = "app_releases";

// ── sanitizer ────────────────────────────────────────────────────────────────

const MAX_VERSION_LENGTH = 32;
const MAX_APK_URL_LENGTH = 2048;
const MAX_NOTES = 10;
const MAX_NOTE_LENGTH = 200;
/** Android versionCode is a signed 32-bit int; Play caps it at 2100000000. */
const MAX_ANDROID_VERSION_CODE = 2_100_000_000;

function safeVersionCode(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return null;
  if (value <= 0 || value > MAX_ANDROID_VERSION_CODE) return null;
  return value;
}

/**
 * Validate an untrusted release candidate (DB document fields or env values).
 * Returns null for ANY violation of the behavioral contract (version string,
 * positive integer versionCode, HTTPS apkUrl). `releaseNotes` is cosmetic, so
 * it is sanitized leniently (non-strings dropped, trimmed, capped) instead of
 * rejecting the whole release. Extra/unknown fields are ignored — the API can
 * grow without breaking old clients.
 */
function sanitizeRelease(candidate: unknown): AppRelease | null {
  if (typeof candidate !== "object" || candidate === null) return null;
  const raw = candidate as Record<string, unknown>;

  const version = typeof raw.version === "string" ? raw.version.trim() : "";
  if (!version || version.length > MAX_VERSION_LENGTH) return null;

  const versionCode = safeVersionCode(raw.versionCode);
  if (versionCode === null) return null;

  if (typeof raw.apkUrl !== "string") return null;
  const apkUrl = raw.apkUrl.trim();
  if (!apkUrl || apkUrl.length > MAX_APK_URL_LENGTH) return null;
  let parsed: URL;
  try {
    parsed = new URL(apkUrl);
  } catch {
    return null;
  }
  // HTTPS only — the mobile app downloads and installs whatever lands here.
  if (parsed.protocol !== "https:") return null;

  let releaseNotes: string[] = [];
  if (Array.isArray(raw.releaseNotes)) {
    releaseNotes = raw.releaseNotes
      .filter((note): note is string => typeof note === "string")
      .map((note) => note.trim())
      .filter(Boolean)
      .slice(0, MAX_NOTES)
      .map((note) => note.slice(0, MAX_NOTE_LENGTH));
  }

  return {
    version,
    versionCode,
    apkUrl,
    releaseNotes,
    mandatory: raw.mandatory === true,
  };
}

// ── source 1: environment bindings ───────────────────────────────────────────

/**
 * Env names (all optional; the release is only served when the three
 * behavioral ones validate):
 *   APP_LATEST_VERSION      e.g. "1.1.0"
 *   APP_LATEST_VERSION_CODE e.g. "2"
 *   APP_LATEST_APK_URL      direct HTTPS download URL for the APK (known
 *                           page-shaped links — Drive share pages, GitHub
 *                           blob/raw — are auto-converted to direct URLs,
 *                           so pasting a share link still works)
 *   APP_RELEASE_NOTES       JSON array string, or one note per line
 *   APP_UPDATE_MANDATORY    "true" forces the update dialog
 *   APP_RELEASE_SOURCE      "environment" | "database" — forces a mode
 */
function releaseFromEnvironment(): AppRelease | null {
  const notesRaw = resolveBinding("APP_RELEASE_NOTES").value;
  let notes: unknown;
  if (notesRaw) {
    try {
      const parsed: unknown = JSON.parse(notesRaw);
      notes = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      notes = notesRaw.split(/\r?\n/);
    }
  }

  const codeRaw = resolveBinding("APP_LATEST_VERSION_CODE").value;
  return sanitizeRelease({
    version: resolveBinding("APP_LATEST_VERSION").value,
    versionCode: codeRaw ? Number(codeRaw) : Number.NaN,
    apkUrl: normalizeApkUrl(resolveBinding("APP_LATEST_APK_URL").value),
    releaseNotes: notes,
    mandatory:
      resolveBinding("APP_UPDATE_MANDATORY").value.trim().toLowerCase() ===
      "true",
  });
}

// ── source 2: MongoDB app_releases ───────────────────────────────────────────

/**
 * Document shape:
 * {
 *   platform: "android",     // reserved for future targets
 *   version: "1.1.0",
 *   versionCode: 2,          // authoritative comparison value
 *   apkUrl: "https://...",   // DIRECT download URL (https)
 *   releaseNotes: ["..."],
 *   mandatory: false,
 *   enabled: true,           // false = never serve this doc
 *   createdAt / updatedAt: Date
 * }
 */
async function releaseFromDatabase(): Promise<AppRelease | null> {
  const doc = await withAnalyticsDb(
    (db) =>
      db
        .collection(APP_RELEASES_COLLECTION)
        .findOne({ platform: "android", enabled: true }, { sort: { versionCode: -1 } }),
    "release-lookup",
  );
  if (!doc) return null;
  return sanitizeRelease({
    version: doc.version,
    versionCode: doc.versionCode,
    apkUrl: normalizeApkUrl(doc.apkUrl),
    releaseNotes: doc.releaseNotes,
    mandatory: doc.mandatory,
  });
}

/**
 * Bounded database attempt. A database that is slow, misconfigured or
 * unreachable must never hang the update check: the lookup is raced against
 * a timeout and ANY rejection resolves to null (→ next source takes over).
 */
function withTimeout<T>(task: Promise<T>, ms: number): Promise<T | null> {
  return new Promise<T | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

const DB_LOOKUP_TIMEOUT_MS = 6_000;

// ── resolution order ─────────────────────────────────────────────────────────

export async function resolveLatestAndroidRelease(): Promise<AppReleaseResolution> {
  const forced = resolveBinding("APP_RELEASE_SOURCE").value.trim().toLowerCase();

  // Explicit environment mode: never touch the database (use while MongoDB
  // is unhealthy so the update check stays fully independent of it).
  if (forced === "environment") {
    return { release: releaseFromEnvironment(), source: "environment" };
  }

  // An env release, when fully configured, is the explicit ops override and
  // keeps serving even if the database below fails or times out.
  const envRelease = forced === "database" ? null : releaseFromEnvironment();
  if (envRelease) {
    return { release: envRelease, source: "environment" };
  }

  // Default store: latest enabled android release from MongoDB.
  const dbRelease = await withTimeout(
    releaseFromDatabase(),
    DB_LOOKUP_TIMEOUT_MS,
  );
  if (dbRelease) {
    return { release: dbRelease, source: "database" };
  }

  return { release: null, source: "none" };
}
