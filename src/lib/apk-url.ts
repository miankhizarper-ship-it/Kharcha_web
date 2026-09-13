/**
 * APK URL normalization — turns known "page-shaped" share links into DIRECT
 * download URLs that work in a browser AND inside the app's update downloader.
 *
 * Why this exists: `APP_LATEST_APK_URL` is documented as a DIRECT HTTPS
 * download URL, but in practice operators paste whatever their file host's
 * web UI hands them:
 *
 * - Google Drive share pages (`/file/d/<id>/view?usp=sharing`) only open
 *   Drive's preview — the file is not served as an attachment.
 * - GitHub `blob` links (`github.com/<u>/<r>/blob/<ref>/<path>`) render an
 *   HTML page; the raw bytes live on `raw.githubusercontent.com`. A downloader
 *   that expects an APK would receive HTML and fail to install.
 *
 * Normalizing here means ONE variable (env or database) keeps working no
 * matter which of the common shapes was pasted, and the same value feeds
 * both the in-app updater (GET /api/app-version) and the website buttons.
 *
 * Pure string/URL logic — no server-only imports — so any route or test can
 * use it. Unknown hosts are returned unchanged: the caller (sanitizer or
 * client) still enforces https, and genuinely direct links must never be
 * second-guessed.
 */

/** Google Drive direct-download endpoint (serves `attachment`, skips the virus-scan interstitial via confirm=t). */
function driveDirectUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

export function normalizeApkUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return "";

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "";
  }
  // Only https/http page-shaped links are rewritten; anything exotic is
  // returned untouched so the https-only sanitizer keeps the final say.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return trimmed;
  }

  const host = parsed.hostname.toLowerCase();

  // ── Google Drive ───────────────────────────────────────────────────────────
  // .../file/d/<ID>/view…  |  open?id=<ID>  |  uc?id=<ID> / uc?export=download&id=<ID>
  if (host === "drive.google.com" || host === "docs.google.com") {
    const fileMatch = parsed.pathname.match(/^\/file\/d\/([^/]+)/);
    if (fileMatch) return driveDirectUrl(fileMatch[1]);

    const openId = parsed.searchParams.get("id");
    if (openId) return driveDirectUrl(openId);
    return trimmed;
  }

  // ── GitHub ─────────────────────────────────────────────────────────────────
  if (host === "github.com" || host === "www.github.com") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    // /<user>/<repo>/blob/<ref>/<path…> | /<user>/<repo>/raw/<ref>/<path…>
    // → raw.githubusercontent.com/<user>/<repo>/<ref>/<path…>
    // (pathname is reused verbatim — no re-encoding of already-encoded segments)
    if (segments.length >= 5 && (segments[2] === "blob" || segments[2] === "raw")) {
      const withoutMode = parsed.pathname.replace(/^(\/[^/]+\/[^/]+)\/(?:blob|raw)(?=\/)/, "$1");
      return `https://raw.githubusercontent.com${withoutMode}`;
    }
    // releases/download/<tag>/<file> is already a direct asset URL — keep it.
    return trimmed;
  }

  return trimmed;
}
