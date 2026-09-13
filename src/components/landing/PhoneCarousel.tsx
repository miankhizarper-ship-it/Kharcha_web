"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneMockup } from "@/components/landing/PhoneMockup";

/**
 * PhoneCarousel — compact swipeable phone showcase for the AppPreview
 * section on small screens (< sm).
 *
 * ── Why a hand-rolled track instead of a carousel library ──
 * The whole interaction is native CSS scroll-snap: one phone centered,
 * the next one peeking from the side, swipe/drag/keyboard to move.
 * The only JS is a rAF-throttled scroll listener that mirrors the
 * snapped index into state for the pagination dots (~40 lines, no
 * dependency, no per-frame React renders — state changes only when
 * the rounded index actually changes).
 *
 * ── Containment guarantees ──
 * - The track is the ONLY scroll container; `overscroll-x-contain`
 *   stops the swipe from chaining into page history navigation.
 * - Slide width is `min(74vw, 272px)`, so the page never grows a
 *   horizontal scrollbar; symmetric `px` padding makes the first and
 *   last slide centerable under `snap-center`.
 * - Scrollbar is hidden via the `no-scrollbar` utility but scrolling
 *   stays fully functional (touch, trackpad, keyboard focus + arrows).
 */

const SLIDES = [
  {
    variant: "light" as const,
    label: "Light theme",
    caption: "A calm daylight dashboard",
  },
  {
    variant: "dark" as const,
    label: "Dark theme",
    caption: "A deep dark theme for late nights",
  },
];

export function PhoneCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Track scroll → active slide index (rAF-throttled, passive listener).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const slides = track.children;
      if (slides.length === 0) return;
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        const mid = slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      // setState with the same value is a no-op, so this stays cheap.
      setActive(best);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /** Dots / keyboard: center the requested slide (reduced-motion aware). */
  const goTo = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    track.scrollTo({
      left:
        slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Kharcha app previews in light and dark theme"
      className="sm:hidden"
    >
      {/* Swipe track — one phone prominent, the next peeking from the side */}
      <div
        ref={trackRef}
        tabIndex={0}
        aria-label="Swipe horizontally to switch between app previews"
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain px-[calc(50%-min(37vw,136px))] pb-2 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.variant}
            className="w-[min(74vw,272px)] shrink-0 snap-center"
          >
            <PhoneMockup
              variant={slide.variant}
              className="w-full shadow-black/40"
            />
            <p className="mt-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">
                {slide.label}
              </span>{" "}
              — {slide.caption}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination dots — also the keyboard path (tab once, arrows via
          native scroll on the focused track, or activate a dot) */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.variant}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Show the ${slide.label.toLowerCase()} preview`}
            aria-current={active === index}
            className={
              active === index
                ? "h-2 w-6 rounded-full bg-brand-600 transition-all duration-300 dark:bg-brand-300"
                : "h-2 w-2 rounded-full bg-slate-300 transition-all duration-300 hover:bg-brand-400 dark:bg-white/20 dark:hover:bg-brand-300/60"
            }
          />
        ))}
      </div>
    </div>
  );
}
