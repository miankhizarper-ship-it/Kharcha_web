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
 *   HTML page. A downloader that expects an APK would receive HTML and fail
 *   to install.
 * - `raw.githubusercontent.com` links work for public repos but are blocked
 *   or stale-cached on some networks/ISPs; the operator-verified form is the
 *   same one GitHub's own "View raw" button hands out:
 *   `github.com/<u>/<r>/raw/refs/heads/<ref>/<path>` (302s to the raw host,
 *   follows fine in browsers and redirect-aware downloaders).
 *
 * Normalizing here means ONE variable (env or database) keeps working no
 * matter which of the common shapes was pasted — every GitHub repo-file shape
 * collapses to the canonical `/raw/refs/heads/…` form — and the same value
 * feeds both the in-app updater (GET /api/app-version) and the website buttons.
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
  // Canonical repo-file download form: /raw/refs/heads/<ref>/<path…> — what
  // GitHub's "View raw" button emits. (pathname is reused verbatim — no
  // re-encoding of already-encoded segments)
  const withHeadsRef = (tail: string): string =>
    tail.startsWith("/refs/heads/") ? tail : `/refs/heads${tail}`;

  if (host === "github.com" || host === "www.github.com") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    // /<user>/<repo>/blob/<ref>/<path…> | /<user>/<repo>/raw/<ref>/<path…>
    // → github.com/<user>/<repo>/raw/refs/heads/<ref>/<path…>
    if (segments.length >= 5 && (segments[2] === "blob" || segments[2] === "raw")) {
      const tail = withHeadsRef(parsed.pathname.replace(/^\/[^/]+\/[^/]+\/(?:blob|raw)/, ""));
      if (tail !== "/refs/heads") return `https://github.com/${segments[0]}/${segments[1]}/raw${tail}`;
      return trimmed; // pathological /raw/refs/heads with no path — leave as-is
    }
    // releases/download/<tag>/<file> is already a direct asset URL — keep it.
    return trimmed;
  }

  // raw.githubusercontent.com/<user>/<repo>/<ref>/<path…>
  // → github.com/<user>/<repo>/raw/refs/heads/<ref>/<path…>
  // (some operators paste the raw host directly; canonicalize to the form
  // verified to download reliably in the field)
  if (host === "raw.githubusercontent.com") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 3) {
      const [user, repo, ...pathParts] = segments;
      const tail = withHeadsRef(`/${pathParts.join("/")}`);
      return `https://github.com/${user}/${repo}/raw${tail}`;
    }
    return trimmed;
  }

  return trimmed;
}
