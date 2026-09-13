"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLatestApkUrl } from "@/hooks/use-latest-apk-url";
import { trackAnalyticsEvent } from "@/components/analytics/track";
import { APK_DIRECT_DOWNLOAD_URL } from "@/config/site";
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
 * Cloudflare variables, MongoDB `app_releases` as fallback) — there is no
 * hardcoded download link anymore. Until (and unless) the endpoint answers,
 * the button renders in its "not configured" state (explaining toast) rather
 * than ever linking to an outdated APK; any fetch failure is silent.
 *
 * The served URL is normalized server-side (Drive share pages → direct
 * endpoint, GitHub blob → raw host). `target="_blank"` is kept as a graceful
 * fallback: if a host ever returns HTML instead of the file, the landing
 * page stays open.
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

  if (apkUrl.trim().length > 0) {
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
            "The APK link is managed in the Cloudflare dashboard (APP_LATEST_APK_URL variable). Once set, downloads start here automatically.",
        })
      }
    >
      <Download className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
