import { NextResponse } from "next/server";
import {
  getAnalyticsBinding,
  getBindingReport,
  hasAnalyticsBinding,
} from "@/lib/analytics/env";
import {
  MongoDbTimeoutError,
  withAnalyticsDb,
  withDbTimeout,
} from "@/lib/analytics/mongo";
import { isSrvUri } from "@/lib/analytics/srv";
import { diagnoseAndroidRelease } from "@/lib/app-release";

/**
 * GET /api/admin/env-check — deployment diagnostic for the analytics system.
 *
 * Reports WHICH bindings the RUNNING deployment can actually see, from which
 * source (live Worker context vs process.env shim), plus a safe shape + live
 * reachability probe for MONGODB_URI. Presence booleans, scheme labels and
 * classified errors ONLY — no binding value is ever included, so nothing an
 * attacker could use is leaked (password/hosts/paths stay sealed).
 *
 * How to read the response:
 * - `bindings.X.present: true`  → the running deployment carries the binding.
 * - `bindings.X.present: false` → the binding does not exist for this
 *   deployment, even if the Cloudflare dashboard shows it. That means one of:
 *     · the deployment was created BEFORE the secret was saved
 *       (→ redeploy / retry deployment),
 *     · the binding lives on a different Worker than the one serving traffic,
 *     · the binding was saved on the Preview environment tab while
 *       *.workers.dev serves Production,
 *     · the value itself is empty / whitespace.
 * - `mongodb.scheme`      → "mongodb+srv" | "mongodb" | "none"
 *   (`mongodb+srv` is resolved through DNS-over-HTTPS automatically; the
 *   standard `mongodb://` form is still recommended as the safest option).
 * - `mongodb.reachability`:
 *     · "ok"                  → ping succeeded; the dashboard should work.
 *     · "timeout"             → hard cap fired; database unreachable or the
 *                               connection never settled (see worker logs).
 *     · "auth-failed"         → database reachable but credentials rejected.
 *     · "network-unreachable" → DNS/connection/TLS failure (check Atlas
 *                               Network Access — Workers need 0.0.0.0/0).
 *     · "error"               → any other failure (message class only).
 *     · "unconfigured"        → no MONGODB_URI — probe skipped.
 * - `appRelease` → the app update system (GET /api/app-version):
 *     · `bindings.X.present`  → whether the RUNNING deployment sees each
 *       APP_* variable (same "dashboard shows it but it's missing" rules
 *       as above — wrong tab, wrong worker, predates deployment, empty).
 *     · `envRelease.issues`   → WHY the env release fails validation,
 *       field by field, with no values (e.g. "versionCode: not a positive
 *       integer", "apkUrl: must start with https://").
 *     · `resolved`            → the EXACT public payload /api/app-version
 *       serves right now (null = the endpoint returns 404). This is data
 *       the public endpoint serves anyway, so nothing new is exposed.
 */
export const dynamic = "force-dynamic";

const PING_HARD_TIMEOUT_MS = 6_000;

type Reachability =
  | "ok"
  | "timeout"
  | "auth-failed"
  | "network-unreachable"
  | "error"
  | "unconfigured";

/** Safe MONGODB_URI shape — booleans and counts, never the value itself. */
function uriShape() {
  const uri = getAnalyticsBinding("MONGODB_URI");
  if (!uri) {
    return { scheme: "none" as const, srv: false, seedHosts: 0 };
  }
  const srv = isSrvUri(uri);
  let seedHosts = 0;
  if (!srv) {
    // Count seed hosts of a standard string without revealing them.
    const authority = uri.slice(uri.indexOf("://") + 3).split("/")[0] ?? "";
    const hostPart = authority.includes("@")
      ? authority.slice(authority.lastIndexOf("@") + 1)
      : authority;
    seedHosts = hostPart.split(",").filter(Boolean).length;
  }
  return { scheme: srv ? ("mongodb+srv" as const) : ("mongodb" as const), srv, seedHosts };
}

/** Live ping, classified. Bounded by the same hard-cap invariant as every
 * other database call — this endpoint can report on a broken database
 * precisely because it can never hang on one. */
async function probeDatabase(): Promise<{
  reachability: Reachability;
  latencyMs?: number;
}> {
  if (!hasAnalyticsBinding("MONGODB_URI")) {
    return { reachability: "unconfigured" };
  }
  const started = Date.now();
  try {
    await withDbTimeout(
      withAnalyticsDb((db) => db.command({ ping: 1 }), "env-check-ping"),
      "env-check-ping",
      PING_HARD_TIMEOUT_MS,
    );
    return { reachability: "ok", latencyMs: Date.now() - started };
  } catch (err) {
    const latencyMs = Date.now() - started;
    if (err instanceof MongoDbTimeoutError) {
      return { reachability: "timeout", latencyMs };
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (
      /ECONNREFUSED|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|fetch failed|network|SSL|TLS|certificate|DoH|SRV|DNS|no valid MongoDB hosts/i.test(
        msg,
      )
    ) {
      return { reachability: "network-unreachable", latencyMs };
    }
    // The driver's aggregate failure when NO server could be selected —
    // usually the database being unreachable or the connection never
    // settling (the hard cap also reports as "timeout" before this point).
    if (/server selection|timed out/i.test(msg)) {
      return { reachability: "timeout", latencyMs };
    }
    if (/authentication|auth(entication)? failed|unauthorized|bad auth/i.test(msg)) {
      return { reachability: "auth-failed", latencyMs };
    }
    return { reachability: "error", latencyMs };
  }
}

export async function GET() {
  const bindings = getBindingReport();
  const dashboardConfigured =
    hasAnalyticsBinding("ANALYTICS_ADMIN_USERNAME") &&
    hasAnalyticsBinding("ANALYTICS_ADMIN_PASSWORD");
  const mongoConfigured = hasAnalyticsBinding("MONGODB_URI");
  const mongodb = { ...uriShape(), ...(await probeDatabase()) };
  const appRelease = await diagnoseAndroidRelease();

  return NextResponse.json(
    {
      ok: true,
      dashboardConfigured,
      mongoConfigured,
      bindings,
      mongodb,
      appRelease,
      note: "Presence booleans and classified diagnostics only — no binding value is ever returned. If a binding shows missing although it exists in the Cloudflare dashboard, redeploy (the deployment predates the secret), or check that the secret is on THIS worker and on the Production tab. appRelease.resolved shows the exact public payload /api/app-version serves (it is public data).",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
