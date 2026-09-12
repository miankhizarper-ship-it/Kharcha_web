"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
 * Reads `APK_DIRECT_DOWNLOAD_URL` (derived from `APK_DOWNLOAD_URL` in
 * `src/config/site.ts`, the single source of truth). For Google Drive links
 * this is Drive's direct-download endpoint, which serves the APK as an
 * attachment — the browser starts the download immediately instead of opening
 * Drive's preview page. `target="_blank"` is kept as a graceful fallback: if a
 * host ever returns HTML instead of the file, the landing page stays open.
 * - When the URL is configured → renders a real download link.
 * - Before it is configured → renders the same button and explains via toast
 *   that the URL still needs to be filled in (never a fake link).
 */
export function DownloadButton({
  size = "default",
  variant = "default",
  className,
  label = "Download App",
}: DownloadButtonProps) {
  const { toast } = useToast();

  if (APK_URL_CONFIGURED) {
    return (
      <Button
        size={size}
        variant={variant}
        className={cn("gap-2", className)}
        asChild
      >
        <a
          href={APK_DIRECT_DOWNLOAD_URL}
          download
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download the Kharcha Android app (APK)"
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
            "The APK is hosted externally. Set APK_DOWNLOAD_URL in src/config/site.ts to enable downloads.",
        })
      }
    >
      <Download className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
