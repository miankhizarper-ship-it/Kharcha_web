/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────────
 *  APK download link (hosted on Google Drive).
 *
 *  Every download button on the page (Navbar, Hero, Download section, Footer)
 *  reads THIS one value — you never need to touch a component.
 *  To swap the file later (new release), just replace the URL below.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const APK_DOWNLOAD_URL =
  "https://drive.google.com/file/d/1g80WLdKRir0YOSvAijosWRLERDeSh-GQ/view?usp=sharing";

/** True only once a real APK URL has been filled in above. */
export const APK_URL_CONFIGURED = APK_DOWNLOAD_URL.trim().length > 0;

/**
 * Browsers ignore the `download` attribute for cross-origin links, so pointing
 * at the share URL above would only open Drive's preview page. Google Drive
 * exposes a direct-download endpoint that serves the file with
 * `Content-Disposition: attachment` — the download starts immediately instead
 * of showing the Drive page. `confirm=t` also skips Drive's "can't scan this
 * file for viruses" interstitial for large files (APKs are usually large).
 *
 * Derived here so the share link stays the single source of truth. If the URL
 * above is ever swapped for a non-Drive host (e.g. Cloudinary), it is returned
 * unchanged and used directly.
 */
export const APK_DIRECT_DOWNLOAD_URL = (() => {
  const driveFile = APK_DOWNLOAD_URL.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  return driveFile
    ? `https://drive.usercontent.google.com/download?id=${driveFile[1]}&export=download&confirm=t`
    : APK_DOWNLOAD_URL;
})();

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
