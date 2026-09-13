/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────────
 *  APK download link — RUNTIME-DRIVEN, not baked in.
 *
 *  The live link is the `APP_LATEST_APK_URL` variable in the Cloudflare
 *  dashboard (Worker → Settings → Variables and Secrets). Every download
 *  button fetches it from GET /api/app-version on page load, and the mobile
 *  app's update checker uses the same value — one edit publishes everywhere,
 *  no redeploy. Known page-shaped links (Drive share pages, GitHub blob/raw)
 *  are auto-converted to direct download URLs server-side.
 *
 *  This constant is the BUILD-TIME FALLBACK for the rare case the endpoint
 *  cannot answer. It is intentionally EMPTY: there is no hardcoded fallback
 *  download anymore — when the variable is unset/unreachable the buttons
 *  show the "link coming soon" toast instead of serving an outdated APK.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { normalizeApkUrl } from "@/lib/apk-url";

export const APK_DOWNLOAD_URL = "";

/**
 * Direct-download derivation of the build-time fallback via the one shared
 * normalizer (Drive share → direct endpoint, GitHub blob/raw → raw host).
 * Empty fallback in, empty fallback out. The runtime link from
 * /api/app-version is already normalized server-side and never passes here.
 */
export const APK_DIRECT_DOWNLOAD_URL = normalizeApkUrl(APK_DOWNLOAD_URL);

/** Product identity used across the landing page. */
export const APP_NAME = "Kharcha";
export const APP_TAGLINE = "Simple personal finance tracking";
export const APP_DESCRIPTION =
  "Kharcha is a fast, offline-first expense tracker for Android. Record expenses and income, review every transaction, and understand where your money goes — no account, no cloud, completely private.";

/**
 * Developer / maintainer identity. Used on the Contact and About pages and in
 * the footer — change it here once, it updates everywhere.
 */
export const DEVELOPER_NAME = "Mian Khizar";
export const DEVELOPER_EMAIL = "miiankhiizar@gmail.com";
export const DEVELOPER_PORTFOLIO_URL = "https://khizar.pro";
export const DEVELOPER_PORTFOLIO_LABEL = "khizar.pro";

/**
 * Canonical site URL — used as metadataBase so OpenGraph/Twitter images and
 * canonical URLs resolve to absolute addresses (silences the Next.js
 * metadataBase warning). Update after connecting a custom domain.
 */
export const SITE_URL = "https://kharcha-web.pages.dev";
