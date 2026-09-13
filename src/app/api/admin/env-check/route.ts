import { NextResponse } from "next/server";
import { getBindingReport, hasAnalyticsBinding } from "@/lib/analytics/env";

/**
 * GET /api/admin/env-check — deployment diagnostic for the analytics system.
 *
 * Reports WHICH bindings the RUNNING deployment can actually see, and from
 * which source (live Worker context vs process.env shim). Presence booleans
 * ONLY — values are never included, so this endpoint leaks nothing an
 * attacker could use.
 *
 * How to read the response:
 * - `present: true`  → the running deployment carries this binding; the
 *   feature it gates should work.
 * - `present: false` → the binding does not exist for this deployment, even
 *   if the Cloudflare dashboard shows it. That means one of:
 *     · the deployment was created BEFORE the secret was saved
 *       (→ redeploy / retry deployment),
 *     · the binding lives on a different Worker than the one serving traffic,
 *     · the binding was saved on the Preview environment tab while
 *       *.workers.dev serves Production,
 *     · the value itself is empty / whitespace.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const bindings = getBindingReport();
  const dashboardConfigured =
    hasAnalyticsBinding("ANALYTICS_ADMIN_USERNAME") &&
    hasAnalyticsBinding("ANALYTICS_ADMIN_PASSWORD");
  const mongoConfigured = hasAnalyticsBinding("MONGODB_URI");

  return NextResponse.json(
    {
      ok: true,
      dashboardConfigured,
      mongoConfigured,
      bindings,
      note: "Presence booleans only — values are never returned. If a binding shows missing although it exists in the Cloudflare dashboard, redeploy (the deployment predates the secret), or check that the secret is on THIS worker and on the Production tab.",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
