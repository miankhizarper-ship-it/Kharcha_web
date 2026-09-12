"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Light/dark theme toggle.
 *
 * The two icons are stacked and crossfaded purely with CSS `.dark:` variants —
 * correct icon in server HTML, no mount flicker, no hydration mismatch.
 * Clicking resolves the current theme to its explicit opposite (so one click
 * always visibly switches, even while in "system" mode).
 *
 * `tone="navbar"` adapts the button to the navbar's scrolled/transparent and
 * dark-mobile-menu states; `tone="plain"` is used on static inner pages.
 */
type ThemeToggleProps = {
  className?: string;
  tone?: "navbar" | "plain";
};

export function ThemeToggle({ className, tone = "navbar" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      title="Toggle light / dark theme"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-brand-600",
        tone === "navbar"
          ? "text-slate-600 hover:bg-brand-50 hover:text-brand-800 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-brand-300"
          : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-brand-300",
        className
      )}
    >
      <Sun
        aria-hidden="true"
        className="size-[18px] rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0"
      />
      <Moon
        aria-hidden="true"
        className="absolute size-[18px] rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100"
      />
    </button>
  );
}
