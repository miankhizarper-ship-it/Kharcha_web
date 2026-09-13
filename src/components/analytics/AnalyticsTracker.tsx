"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getVisitorId, getSessionId, send, trackingAllowed } from "./track";

/**
 * Page-view tracker — mounted once in the root layout.
 *
 * - Sends one page_view per real page load / route change (works with both
 *   full loads and App Router client-side navigation).
 * - Never fires on React re-renders: the effect depends only on the pathname,
 *   and a module-level guard collapses StrictMode / double-effect fires
 *   (same path within 2s → ignored).
 * - ALWAYS mounted: whether tracking is enabled is decided by the SERVER
 *   per request (/api/analytics returns 204 when MONGODB_URI is absent).
 *   Gating via a server prop was removed because static prerendering baked
 *   the build-time value (false) into the HTML, which would permanently
 *   disable tracking even after bindings were fixed.
 * - Does no work when the user sends Do Not Track.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastFire = useRef<{ path: string; at: number }>({ path: "", at: 0 });

  useEffect(() => {
    if (!trackingAllowed()) return;

    const now = Date.now();
    if (lastFire.current.path === pathname && now - lastFire.current.at < 2_000) {
      return; // duplicate guard (StrictMode, double invocations)
    }
    lastFire.current = { path: pathname, at: now };

    send({
      type: "pageview",
      path: pathname,
      referrer: document.referrer || "",
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      screen:
        typeof screen !== "undefined" && screen.width
          ? `${screen.width}x${screen.height}`
          : undefined,
    });
  }, [pathname]);

  return null;
}
