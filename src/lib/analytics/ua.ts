/**
 * Compact user-agent classifier for anonymous analytics.
 *
 * Parses ONLY what the funnel needs — coarse device type, browser family and
 * OS family. This is deliberately NOT fingerprinting: no canvas/fonts/audio
 * signals, just the standard User-Agent header the browser sends on every
 * request anyway, reduced to three low-cardinality strings used for
 * aggregate breakdowns in the dashboard.
 *
 * Zero dependencies — order-sensitive checks, most specific first.
 */

export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "other";

export type UaInfo = {
  deviceType: DeviceType;
  browser: string;
  os: string;
};

const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|wget|curl|python-requests|go-http-client/i;

export function parseUserAgent(ua: string | null | undefined): UaInfo {
  const s = ua ?? "";

  if (!s.trim()) {
    return { deviceType: "other", browser: "Unknown", os: "Unknown" };
  }

  if (BOT_PATTERN.test(s)) {
    return { deviceType: "bot", browser: "Bot", os: "Bot" };
  }

  return {
    deviceType: detectDeviceType(s),
    browser: detectBrowser(s),
    os: detectOs(s),
  };
}

function detectDeviceType(s: string): DeviceType {
  // iPadOS 13+ masquerades as desktop Safari — catch the classic token too.
  if (/iPad|Tablet|PlayBook|Silk/i.test(s) || (/Macintosh/.test(s) && /Touch/i.test(s))) {
    return "tablet";
  }
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile/i.test(s)) {
    return "mobile";
  }
  return "desktop";
}

function detectBrowser(s: string): string {
  // Order matters: Chromium derivatives declare Chrome too, so check them first.
  if (/Edg(A|iOS)?\//.test(s)) return "Edge";
  if (/OPR\/|Opera/.test(s)) return "Opera";
  if (/SamsungBrowser\//.test(s)) return "Samsung Internet";
  if (/YaBrowser\//.test(s)) return "Yandex";
  if (/CriOS\//.test(s)) return "Chrome";
  if (/FxiOS\//.test(s)) return "Firefox";
  if (/Firefox\//.test(s)) return "Firefox";
  if (/MiuiBrowser\//.test(s)) return "Mi Browser";
  if (/HeyTapBrowser\//.test(s)) return "Oppo Browser";
  if (/UCBrowser\//.test(s)) return "UC Browser";
  if (/Brave\//.test(s)) return "Brave";
  if (/Chrome\//.test(s)) return "Chrome";
  if (/Safari\//.test(s) && /Version\//.test(s)) return "Safari";
  if (/MSIE |Trident\//.test(s)) return "Internet Explorer";
  return "Other";
}

function detectOs(s: string): string {
  if (/Windows NT|Windows Phone/i.test(s)) return "Windows";
  if (/iPhone|iPad|iPod/i.test(s)) return "iOS";
  if (/Android/i.test(s)) return "Android";
  if (/Mac OS X|Macintosh/.test(s)) return "macOS";
  if (/CrOS/.test(s)) return "ChromeOS";
  if (/Linux|X11|Ubuntu|Fedora/i.test(s)) return "Linux";
  return "Other";
}
