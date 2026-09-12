"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Mail, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DEVELOPER_EMAIL,
  DEVELOPER_NAME,
  DEVELOPER_PORTFOLIO_LABEL,
  DEVELOPER_PORTFOLIO_URL,
} from "@/config/site";

/**
 * Developer contact card — the interactive heart of the Contact page.
 * Copy-to-clipboard for the email (with toast feedback), a direct mailto
 * action, and a link to the developer's portfolio. All identity values come
 * from `src/config/site.ts` (single source of truth).
 */
export function DeveloperCard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(DEVELOPER_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Email copied",
        description: DEVELOPER_EMAIL,
      });
    } catch {
      // Clipboard API can be denied (permissions/insecure context) — fall
      // back to opening the mail client so the user is never stuck.
      toast({
        title: "Couldn't copy automatically",
        description: `Please copy it manually: ${DEVELOPER_EMAIL}`,
      });
    }
  };

  const initials = DEVELOPER_NAME.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_-30px_rgba(10,36,29,0.35)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)]">
      {/* Header band */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-ink px-6 py-8 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-brand-500/25 blur-3xl"
        />
        <div className="relative flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white ring-1 ring-white/20"
          >
            {initials}
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {DEVELOPER_NAME}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-100/85">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              Developer &amp; maintainer of Kharcha
            </p>
          </div>
        </div>
      </div>

      {/* Contact rows */}
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {/* Email */}
        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
              Email
            </p>
            <a
              href={`mailto:${DEVELOPER_EMAIL}`}
              className="mt-1 block truncate text-[15px] font-medium text-slate-900 transition-colors hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-300"
            >
              {DEVELOPER_EMAIL}
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={copyEmail}
              aria-label={copied ? "Email copied" : "Copy email address"}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
            <a
              href={`mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent("Kharcha — feedback & support")}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Write
            </a>
          </div>
        </div>

        {/* Portfolio */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
              Portfolio
            </p>
            <p className="mt-1 truncate text-[15px] font-medium text-slate-900 dark:text-slate-100">
              {DEVELOPER_PORTFOLIO_LABEL}
            </p>
          </div>
          <a
            href={DEVELOPER_PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
          >
            Visit
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

/** Compact inline developer attribution used on the About page. */
export function DeveloperMiniCard({ className }: { className?: string }) {
  const initials = DEVELOPER_NAME.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={
        className ??
        "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 text-sm font-bold text-white"
        >
          {initials}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {DEVELOPER_NAME}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Developer &amp; maintainer
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`mailto:${DEVELOPER_EMAIL}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-800 dark:border-white/10 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          Email
        </a>
        <a
          href={DEVELOPER_PORTFOLIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-800 dark:border-white/10 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
        >
          {DEVELOPER_PORTFOLIO_LABEL}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
