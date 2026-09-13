"use client";

/**
 * Client-side analytics transport — anonymous, cookie-free, fire-and-forget.
 *
 * - Visitor ID: random UUID in localStorage (first-party, rotation on
 *   clearance). NOT fingerprinting — nothing is derived from the device.
 * - Session ID: random UUID in sessionStorage (fresh per tab session).
 * - Transport: navigator.sendBeacon (survives the download navigation),
 *   fetch(keepalive) fallback. Never awaited by callers, never blocks UI,
 *   silently ignored on failure.
 * - Privacy: Do Not Track is respected; payloads contain path-level data
 *   only — no query strings, no form values, no personal info.
 */

const VISITOR_KEY = "kharcha_vid";
const SESSION_KEY = "kharcha_sid";
const ENDPOINT = "/api/analytics";

export type AnalyticsEventName =
  | "page_view"
  | "download_click"
  | "github_click"
  | "external_link_click";

/** Respects Do Not Track; exposed for the page-view tracker too. */
export function trackingAllowed(): boolean {
  try {
    const dnt = navigator.doNotTrack ?? (navigator as { msDoNotTrack?: string }).msDoNotTrack;
    return dnt !== "1" && (window as { doNotTrack?: string }).doNotTrack !== "1";
  } catch {
    return true;
  }
}

function randomId(): string {
  try {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const fresh = randomId();
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    // Storage blocked — ephemeral per-load id (still anonymous, still works).
    return randomId();
  }
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = randomId();
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return randomId();
  }
}

export function send(payload: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(payload);
    const blob = new Blob([body], { type: "application/json" });
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, blob)) {
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* analytics is optional — ignore */
    });
  } catch {
    /* analytics is optional — ignore */
  }
}

/** Tracks a named event (e.g. download_click) without ever blocking the action. */
export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  meta?: Record<string, string | number | boolean>,
): void {
  if (!trackingAllowed()) return;
  send({
    type: "event",
    name,
    path: typeof location !== "undefined" ? location.pathname : "/",
    referrer: document.referrer || "",
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    ...(meta ? { meta } : {}),
  });
}
