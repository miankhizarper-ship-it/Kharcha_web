import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PageShell — shared header band + content container for the inner pages
 * (About, Contact, Privacy Policy, Terms of Service).
 *
 * Renders below the fixed navbar (which lives in the root layout) and keeps
 * the decorative brand-tinted background of the hero, themed for both modes.
 */
type PageShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  /** Wide layout for card grids (About/Contact); narrow for reading pages. */
  wide?: boolean;
};

export function PageShell({ eyebrow, title, description, children, wide = false }: PageShellProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative background — same language as the hero, themed */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px]">
        <div className="absolute -top-32 right-[-8%] h-[380px] w-[380px] rounded-full bg-gradient-to-br from-brand-100 via-brand-50 to-transparent opacity-80 blur-2xl dark:from-brand-900/50 dark:via-brand-950/40 dark:to-transparent" />
        <div className="absolute left-[-12%] top-16 h-[320px] w-[320px] rounded-full bg-gradient-to-tr from-emerald-50 to-transparent opacity-70 blur-2xl dark:from-emerald-950/40 dark:to-transparent" />
      </div>

      <header
        className={cn(
          "mx-auto px-4 pb-12 pt-32 sm:px-6 sm:pt-40",
          wide ? "max-w-6xl" : "max-w-3xl"
        )}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            {description}
          </p>
        ) : null}
      </header>

      <div
        className={cn(
          "mx-auto px-4 pb-20 sm:px-6 sm:pb-28",
          wide ? "max-w-6xl" : "max-w-3xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Article primitives — consistent typography for long-form pages ─────── */

export function ArticleH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-28 text-xl font-semibold tracking-tight text-slate-900 first:mt-0 dark:text-white sm:text-2xl">
      {children}
    </h2>
  );
}

export function ArticleH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-8 text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
      {children}
    </h3>
  );
}

export function ArticleP({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
      {children}
    </p>
  );
}

export function ArticleUL({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 space-y-2.5">{children}</ul>
  );
}

export function ArticleLI({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
      <span
        aria-hidden="true"
        className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500 dark:bg-brand-400"
      />
      <span>{children}</span>
    </li>
  );
}

/** Small "last updated" chip shown at the top of legal pages. */
export function LastUpdated({ date }: { date: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-medium text-brand-800 dark:border-brand-800/60 dark:bg-brand-900/40 dark:text-brand-200">
      Last updated: {date}
    </p>
  );
}
