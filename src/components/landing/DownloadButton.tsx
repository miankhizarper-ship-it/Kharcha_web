"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLatestApkUrl } from "@/hooks/use-latest-apk-url";
import { trackAnalyticsEvent } from "@/components/analytics/track";
import { APK_DIRECT_DOWNLOAD_URL, APK_URL_CONFIGURED } from "@/config/site";
import { cn } from "@/lib/utils";

type DownloadButtonProps = {
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
  label?: string;
};

/**
 * The ONLY download action on the page.
 *
 * The href follows the operator-controlled release at RUNTIME: the
 * `useLatestApkUrl` hook reads GET /api/app-version (fed by the APP_LATEST_*
 * Cloudflare variables, MongoDB `app_releases` as fallback) and overrides the
 * build-time link from `src/config/site.ts`. Changing the APK link is now a
 * variable edit in the Cloudflare dashboard — no redeploy needed. Until (and
 * unless) the endpoint answers, the build-time `APK_DIRECT_DOWNLOAD_URL`
 * keeps the button fully functional; any fetch failure is silent.
 *
 * For Google Drive links the direct-download endpoint (or the server-side
 * normalized URL) serves the APK as an attachment — the browser starts the
 * download immediately instead of opening a preview page. `target="_blank"`
 * is kept as a graceful fallback: if a host ever returns HTML instead of the
 * file, the landing page stays open.
 * - When a URL is available → renders a real download link.
 * - When no URL exists at all → renders the same button and explains via
 *   toast that the URL still needs to be filled in (never a fake link).
 */
export function DownloadButton({
  size = "default",
  variant = "default",
  className,
  label = "Download App",
}: DownloadButtonProps) {
  const { toast } = useToast();
  const liveApkUrl = useLatestApkUrl();
  const apkUrl = liveApkUrl ?? APK_DIRECT_DOWNLOAD_URL;

  if (apkUrl.trim().length > 0 && APK_URL_CONFIGURED) {
    return (
      <Button
        size={size}
        variant={variant}
        className={cn("gap-2", className)}
        asChild
      >
        <a
          href={apkUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download the Kharcha Android app (APK)"
          onClick={() =>
            // Fire-and-forget: queues a beacon and returns synchronously —
            // the download never waits for analytics, and an analytics
            // failure is silently ignored.
            trackAnalyticsEvent("download_click", { label })
          }
        >
          <Download className="size-4" aria-hidden="true" />
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={cn("gap-2", className)}
      onClick={() =>
        toast({
          title: "Download link coming soon",
          description:
            "The APK is hosted externally. Set the APP_LATEST_APK_URL variable in the Cloudflare dashboard (or APK_DOWNLOAD_URL in src/config/site.ts) to enable downloads.",
        })
      }
    >
      <Download className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
