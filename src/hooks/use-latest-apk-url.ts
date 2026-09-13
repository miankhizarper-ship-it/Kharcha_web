"use client";

import { useEffect, useState } from "react";

/**
 * Live APK download URL for the website's download buttons.
 *
 * WHY: the buttons historically rendered a URL baked into the JS bundle at
 * build time (src/config/site.ts). Swapping the APK link then required a
 * rebuild + redeploy. The backend already exposes the operator-controlled
 * release (GET /api/app-version, fed by the APP_LATEST_* Cloudflare
 * variables with the MongoDB `app_releases` collection as fallback), so the
 * buttons now follow that endpoint at RUNTIME:
 *
 * - One shared fetch per page load (Navbar, Hero, CTA and Footer all mount
 *   this hook — they share a single module-level request).
 * - 3s timeout; ANY failure (offline endpoint, 404 unconfigured, 5xx,
 *   invalid payload, non-https URL) resolves to null and the button keeps
 *   the build-time fallback — the download can never break because of this.
 * - The URL only ever tightens correctness: /api/app-version serves the same
 *   direct-download link the in-app updater uses, already normalized
 *   server-side (Drive share pages → direct endpoint, GitHub blob → raw).
 *
 * Returns null until (and unless) the endpoint provides a usable URL.
 */

/** Module-level shared request: one fetch per page load, no matter how many buttons mount. */
let sharedRequest: Promise<string | null> | null = null;

function fetchLatestApkUrl(): Promise<string | null> {
  if (sharedRequest) return sharedRequest;

  sharedRequest = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3_000);
    try {
      const response = await fetch("/api/app-version", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null) return null;
      const apkUrl = (data as Record<string, unknown>).apkUrl;
      if (typeof apkUrl !== "string") return null;
      try {
        if (new URL(apkUrl).protocol !== "https:") return null;
      } catch {
        return null;
      }
      return apkUrl;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();

  return sharedRequest;
}

export function useLatestApkUrl(): string | null {
  const [apkUrl, setApkUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchLatestApkUrl().then((url) => {
      if (mounted && url) setApkUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return apkUrl;
}
