"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { DownloadButton } from "@/components/landing/DownloadButton";
import { APP_NAME } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#why-kharcha", label: "Why Kharcha" },
];

/**
 * Sticky navbar that visually elevates (blur + border + shadow) and becomes
 * slightly more compact once the page is scrolled. The mobile menu opens as
 * a themed dark sheet (ink + brand green) matching the page's dark sections.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu with the Escape key (keyboard a11y).
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        menuOpen
          ? "border-b border-white/10 bg-ink/95 shadow-[0_12px_40px_-12px_rgba(10,36,29,0.55)] backdrop-blur-xl"
          : scrolled
            ? "border-b border-slate-200/70 bg-white/85 shadow-[0_8px_30px_-12px_rgba(10,36,29,0.15)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
      )}
    >
      <nav
        aria-label="Main navigation"
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-300 sm:px-6",
          scrolled ? "py-2.5" : "py-4"
        )}
      >
        {/* Logo */}
        <a
          href="#top"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-brand-300"
          aria-label={`${APP_NAME} — back to top`}
        >
          <img
            src="/assets/app-icon-192.png"
            alt=""
            aria-hidden="true"
            className="h-9 w-9 rounded-xl shadow-sm ring-1 ring-black/5"
          />
          <span
            className={cn(
              "text-lg font-semibold tracking-tight transition-colors",
              menuOpen ? "text-white" : "text-slate-900"
            )}
          >
            {APP_NAME}
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <DownloadButton size="sm" label="Download App" />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-brand-300 md:hidden",
            menuOpen
              ? "text-slate-100 hover:bg-white/10"
              : "text-slate-700 hover:bg-brand-50 focus-visible:outline-brand-600"
          )}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu panel — themed dark sheet */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="animate-menu-in relative overflow-hidden border-t border-white/10 bg-ink px-4 pb-6 pt-3 md:hidden"
        >
          {/* Soft brand-green glow, decorative only */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 right-[-3rem] h-48 w-48 rounded-full bg-brand-500/25 blur-3xl"
          />

          <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">
            Menu
          </p>

          <ul className="relative mt-2 flex flex-col">
            {NAV_LINKS.map((link, index) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-medium text-slate-100 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-brand-300"
                >
                  <span className="flex items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className="text-xs font-semibold tabular-nums text-brand-400"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {link.label}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 text-brand-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </a>
              </li>
            ))}
          </ul>

          <div className="relative mt-4 border-t border-white/10 pt-4">
            <DownloadButton
              size="lg"
              className="w-full bg-brand-600 text-white shadow-[0_10px_30px_-10px_rgba(30,93,75,0.7)] hover:bg-brand-500"
              label="Download App"
            />
            <p className="mt-3 text-center text-xs font-medium tracking-wide text-slate-400">
              Free · Android APK · No account needed
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
