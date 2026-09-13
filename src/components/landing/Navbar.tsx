"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { DownloadButton } from "@/components/landing/DownloadButton";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { APP_NAME } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#why-kharcha", label: "Why Kharcha" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/**
 * Sticky navbar that visually elevates (blur + border + shadow) and becomes
 * slightly more compact once the page is scrolled. The mobile menu opens as
 * a themed dark sheet (ink + brand green) matching the page's dark sections.
 *
 * Section links are written as `/#…` so they smooth-scroll on the home page
 * and jump home first from inner pages (about / contact / privacy / terms).
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile-menu behaviour: Escape closes and returns focus to the toggle,
  // Tab is trapped inside the open panel, a tap outside closes it, page
  // scroll is locked behind it, and the first link is focused on open
  // (WAI-ARIA disclosure pattern).
  useEffect(() => {
    if (!menuOpen) return;

    const focusables = () =>
      Array.from(
        menuPanelRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ) ?? [],
      );

    // Move focus into the menu (after the panel mounts).
    focusables()[0]?.focus();

    // Lock the page behind the open menu — the panel itself stays scrollable
    // for short landscape viewports.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !menuPanelRef.current) return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        event.target instanceof Node &&
        !headerRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  // Logo: back to top on the home page, home on inner pages.
  const logoHref = pathname === "/" ? "#top" : "/";

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        menuOpen
          ? "border-b border-white/10 bg-ink/95 shadow-[0_12px_40px_-12px_rgba(10,36,29,0.55)] backdrop-blur-xl"
          : scrolled
            ? "border-b border-slate-200/70 bg-white/85 shadow-[0_8px_30px_-12px_rgba(10,36,29,0.15)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0a100e]/85 dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
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
          href={logoHref}
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-brand-300"
          aria-label={`${APP_NAME} — ${pathname === "/" ? "back to top" : "back to home"}`}
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
              menuOpen ? "text-white" : "text-slate-900 dark:text-white"
            )}
          >
            {APP_NAME}
          </span>
        </a>

        {/* Desktop links — shown from lg up: at md (768px) the five inline
            labels + toggle + CTA physically exceed the bar and wrap, so the
            hamburger stays until 1024px. */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600",
                  pathname === link.href
                    ? "bg-brand-50 text-brand-800 dark:bg-white/[0.06] dark:text-brand-300"
                    : "text-slate-600 hover:bg-brand-50 hover:text-brand-800 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-brand-300"
                )}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop actions: theme toggle + CTA */}
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <DownloadButton size="sm" label="Download App" />
        </div>

        {/* Mobile actions: theme toggle + menu button */}
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle
            className={cn(
              menuOpen && "text-slate-100 hover:bg-white/10 hover:text-white"
            )}
          />
          <button
            type="button"
            ref={toggleRef}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-brand-300 lg:hidden",
              menuOpen
                ? "text-slate-100 hover:bg-white/10"
                : "text-slate-700 hover:bg-brand-50 focus-visible:outline-brand-600 dark:text-slate-200 dark:hover:bg-white/10"
            )}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel — themed dark sheet */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuPanelRef}
          className="animate-menu-in relative max-h-[calc(100dvh-4.5rem)] overflow-y-auto overflow-x-hidden border-t border-white/10 bg-ink px-4 pb-6 pt-3 lg:hidden"
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
