import { NextResponse } from "next/server";
import { resolveLatestAndroidRelease } from "@/lib/app-release";

/**
 * GET /api/app-version — latest Android release for the in-app update system.
 *
 * Consumed by the Kharcha Android app once per launch. The app compares the
 * returned `versionCode` against its installed one (versionCode is the ONLY
 * authoritative comparison value) and, when newer, downloads `apkUrl` and
 * hands it to the Android package installer.
 *
 * Response contract (200):
 * {
 *   "version": "1.1.0",                      // display string
 *   "versionCode": 2,                        // integer, > 0 — compared, never parsed
 *   "apkUrl": "https://…/kharcha-1.1.0.apk", // direct HTTPS download URL
 *   "releaseNotes": ["Added monthly analytics", …], // optional, may be []
 *   "mandatory": false                       // true = dialog cannot be dismissed
 * }
 *
 * Failure modes are explicit so the client can treat everything gracefully:
 * - 404 → no release is configured (neither env bindings nor the
 *   `app_releases` collection has a valid entry) — the app silently continues.
 * - 503 → the lookup itself failed (e.g. database unavailable AND no env
 *   release) — the app silently continues.
 * Responses are `no-store`: a freshly released build must never be delayed
 * by an edge cache.
 *
 * Where the release comes from (see src/lib/app-release.ts):
 * env bindings (APP_LATEST_VERSION / _VERSION_CODE / _APK_URL / _RELEASE_NOTES
 * / _UPDATE_MANDATORY) override the MongoDB `app_releases` collection;
 * APP_RELEASE_SOURCE=environment|database forces a mode.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

export async function GET() {
  try {
    const { release } = await resolveLatestAndroidRelease();

    if (!release) {
      return NextResponse.json(
        { error: "No release configured" },
        { status: 404, headers: NO_STORE },
      );
    }

    return NextResponse.json(
      {
        version: release.version,
        versionCode: release.versionCode,
        apkUrl: release.apkUrl,
        releaseNotes: release.releaseNotes,
        mandatory: release.mandatory,
      },
      { headers: NO_STORE },
    );
  } catch {
    // resolveLatestAndroidRelease already contains its own failures, but
    // nothing may ever escape a launch-time dependency of the app.
    return NextResponse.json(
      { error: "Release lookup unavailable" },
      { status: 503, headers: NO_STORE },
    );
  }
}
