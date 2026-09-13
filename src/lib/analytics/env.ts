import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Central environment-binding resolution for the analytics system.
 *
 * Why this exists: on the Cloudflare Worker there are TWO places a binding
 * can be visible, and relying on only one of them proved fragile in
 * production:
 *
 * 1. `getCloudflareContext().env` — the Worker's LIVE bindings object
 *    (canonical). Dashboard Variables/Secrets appear here the moment the
 *    running deployment carries them, regardless of any process.env
 *    plumbing.
 * 2. `process.env` — populated by the OpenNext adapter's
 *    `populateProcessEnv()` shim, which copies every string binding into
 *    process.env when the worker boots.
 *
 * Every analytics env read goes through `getAnalyticsBinding()` so a missing
 * copy in either location can never silently disable the dashboard again.
 * Values are only ever returned to server-side callers — never serialized
 * to the client (the env-check endpoint reports presence booleans only).
 */

export type BindingSource = "context" | "process" | "missing";

export interface BindingResolution {
  value: string;
  source: BindingSource;
}

/** All bindings the analytics system understands (diagnostic order). */
export const ANALYTICS_BINDING_KEYS = [
  "MONGODB_URI",
  "MONGODB_DATABASE",
  "ANALYTICS_ADMIN_USERNAME",
  "ANALYTICS_ADMIN_PASSWORD",
  "ANALYTICS_SESSION_SECRET",
  "ANALYTICS_IP_SALT",
  "ANALYTICS_RETENTION_DAYS",
] as const;

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Resolve one binding from the live Worker context first, then process.env.
 * Safe to call during build-time prerendering: outside a request scope
 * `getCloudflareContext()` throws and we transparently fall back to
 * process.env (which is empty at build time — same behaviour as before).
 */
export function resolveBinding(key: string): BindingResolution {
  try {
    const ctx = getCloudflareContext();
    const fromContext = (ctx?.env as Record<string, unknown> | undefined)?.[key];
    if (nonEmpty(fromContext)) {
      return { value: fromContext.trim(), source: "context" };
    }
  } catch {
    // No request scope (build/prerender) — fall through to process.env.
  }

  const fromProcess = (process.env as Record<string, unknown> | undefined)?.[key];
  if (nonEmpty(fromProcess)) {
    return { value: fromProcess.trim(), source: "process" };
  }

  return { value: "", source: "missing" };
}

/** Resolved value for a binding, or "" when unset in both sources. */
export function getAnalyticsBinding(key: string): string {
  return resolveBinding(key).value;
}

/** Boolean convenience for "configured at all" checks. */
export function hasAnalyticsBinding(key: string): boolean {
  return resolveBinding(key).source !== "missing";
}

export interface BindingReportEntry {
  present: boolean;
  source: BindingSource;
}

/**
 * Presence map for the env-check diagnostic endpoint. Booleans and source
 * labels ONLY — binding values are never included.
 */
export function getBindingReport(): Record<string, BindingReportEntry> {
  const report: Record<string, BindingReportEntry> = {};
  for (const key of ANALYTICS_BINDING_KEYS) {
    const { source } = resolveBinding(key);
    report[key] = { present: source !== "missing", source };
  }
  return report;
}
