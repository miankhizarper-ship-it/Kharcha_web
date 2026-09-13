"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { PhoneMockup } from "@/components/landing/PhoneMockup";

/**
 * HeroPhone3D — the hero phone rebuilt as a layered CSS-3D object that
 * TRAVELS with the scroll from the hero into the app-showcase section.
 *
 * ── How the depth is built (Option A — CSS 3D transforms, no new deps) ──
 * The scene container owns `perspective: 1200px`; the scroll rig inside it
 * carries `transform-style: preserve-3d` so its children share one 3D space.
 * The phone is then stacked along Z instead of being a flat card:
 *
 *   -28px   back casing (peeks out around the silhouette while rotating)
 *   -14px   mid frame + protruding side buttons (bezel thickness)
 *     0px   the existing <PhoneMockup> (frame bezel, punch-hole camera, live
 *           dashboard screen) — the front face, pixel-identical to before
 *    +2px   fixed-direction edge light (rim highlights, light from top-left)
 *    +10px  glass sheen (diagonal glare that parallax-slides against the face)
 *
 * ── Travel choreography (desktop, motion allowed) ──
 * Progress spans the hero's whole journey AND the app section's arrival:
 * ["start start", "end 0.45"] — 1 is reached when the hero's bottom edge
 * sits at 45% of the viewport, i.e. exactly when the showcase phones are
 * on stage. Four stages, all scrubbed by scroll (reversible, fast-scroll
 * safe, transform/opacity only):
 *
 *   Stage 1 — Hero (progress ≈ 0):     idle 3D pose, gentle yaw.
 *   Stage 2 — Scroll starts:           the phone drifts DOWN with the user
 *                                      (y-parallax lags the page), glides
 *                                      toward the page centre and shrinks.
 *   Stage 3 — Transition:              a controlled three-axis product
 *                                      turn — rotateX tilts, rotateY turns
 *                                      the face toward the viewer, rotateZ
 *                                      adds a slight device angle. No 360°
 *                                      spins, ever.
 *   Stage 4 — Arrival:                 floating chips dissolve first, then
 *                                      the phone eases to its settled pose
 *                                      and fades out precisely as the app
 *                                      section's own phones arrive — one
 *                                      continuous journey, two components.
 *
 * The fade lives on an OUTER group wrapper (opacity < 1 on the rig itself
 * would flatten its preserve-3d context per spec) — the 3D layering stays
 * intact at every opacity.
 *
 * ── Mobile (< lg) ──
 * A simplified, cheaper version: short y-travel, ±few-degree tilts, no
 * fade (the section below switches to its own compact swipe carousel).
 *
 * ── Fallbacks ──
 * - prefers-reduced-motion: fully upright, zero scroll-driven motion.
 * - The rig only ever animates transform/opacity → no layout, no CLS;
 *   the stage's in-flow footprint is exactly the old mockup's.
 */

const PHONE_LABEL =
  "Preview of the Kharcha app home screen: total balance with income and expenses, a weekly spending chart, recent transactions, and a bottom navigation bar.";

/** Scene perspective — larger = flatter; 1200px reads as "device on a desk". */
const PERSPECTIVE = "1200px";

/**
 * Travel range: progress 0 = page top, progress 1 = the hero's bottom edge
 * at 45% of the viewport height — exactly the moment the app section's own
 * phones are on stage. Measured directly (ResizeObserver on the hero +
 * window resize + document.fonts.ready) instead of relying on framer's
 * target/offset resolution, so webfont reflow and breakpoint changes can
 * never leave the tracker with a stale range. Only the keyframe amplitudes
 * vary per mode; the range is shared. The idle rotateY (-5deg) matches the
 * static fallback pose exactly, so hydration never causes a pose pop.
 */
const SETTLE_VIEWPORT_FRACTION = 0.45;

/** SSR-safe desktop query. Defaults to false so server HTML matches mobile. */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

type HeroPhone3DProps = {
  /**
   * Ref attached to the hero <section>. Scroll progress is normalized
   * against the hero section's journey (stretched to the app section's
   * arrival) so the travel completes exactly as the showcase takes over.
   */
  sectionRef: React.RefObject<HTMLElement | null>;
};

export function HeroPhone3D({ sectionRef }: HeroPhone3DProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();

  // Three modes: cinematic desktop travel / subtle mobile drift / static.
  const mode: "desktop" | "mobile" | "static" = prefersReducedMotion
    ? "static"
    : isDesktop
      ? "desktop"
      : "mobile";

  // Page-scroll driver with a measured travel range kept in a REF: framer's
  // useTransform caches its transformer, so a range held in state would go
  // stale after webfont reflow. The function form reads the live ref value
  // on every scroll event — always current, zero re-renders.
  const travelRangeRef = useRef(600);

  useEffect(() => {
    const measure = () => {
      const hero = sectionRef.current;
      if (!hero) return;
      const distance =
        hero.offsetHeight - window.innerHeight * SETTLE_VIEWPORT_FRACTION;
      travelRangeRef.current = Math.max(240, Math.round(distance));
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (sectionRef.current) ro.observe(sectionRef.current);
    window.addEventListener("resize", measure);
    // Webfont swaps after hydration change the hero's height — re-measure.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [sectionRef]);

  const { scrollY } = useScroll();

  // 0 → 1 across the measured range, clamped (scrubbed — fast-scroll safe).
  const progress = useTransform(scrollY, (value) => {
    const range = travelRangeRef.current;
    return Math.min(1, Math.max(0, value / (range > 0 ? range : 1)));
  });

  /* ── Desktop: the full four-stage journey ─────────────────────────── */
  const x = useTransform(progress, [0, 1], mode === "desktop" ? [0, -72] : [0, 0]);
  const y = useTransform(
    progress,
    [0, 0.55, 1],
    mode === "desktop" ? [0, 110, 235] : mode === "mobile" ? [0, 36] : [0, 0]
  );
  const scale = useTransform(
    progress,
    [0, 0.6, 1],
    mode === "desktop" ? [1, 0.93, 0.85] : mode === "mobile" ? [1, 0.97] : [1, 1]
  );
  const rotateX = useTransform(
    progress,
    [0, 0.6, 1],
    mode === "desktop" ? [0, 8, 5] : mode === "mobile" ? [0, 3] : [0, 0]
  );
  const rotateY = useTransform(
    progress,
    [0, 0.55, 1],
    mode === "desktop"
      ? [-5, 16, 8]
      : mode === "mobile"
        ? [-5, -2] // small screens: gentle settle of the idle pose
        : [-5, -5] // reduced motion / SSR: static 3D pose, depth without motion
  );
  const rotateZ = useTransform(
    progress,
    [0, 0.6, 1],
    mode === "desktop" ? [0, -4, -2.5] : mode === "mobile" ? [0, -1.5] : [0, 0]
  );

  /* ── Dissolve sequence: chips first, then the phone itself.
         Lives on the outer group (see doc comment) ──────────────────── */
  const travelOpacity = useTransform(
    progress,
    [0, 0.68, 0.94, 1],
    mode === "desktop" ? [1, 1, 0.25, 0] : [1, 1]
  );
  const chipOpacity = useTransform(
    progress,
    [0, 0.3, 0.55],
    mode === "static" ? [1, 1, 1] : [1, 0.5, 0]
  );
  const chipY = useTransform(
    progress,
    [0, 1],
    mode === "desktop" ? [0, -36] : mode === "mobile" ? [0, -24] : [0, 0]
  );
  // Chips counter-drift at ~30% amplitude → parallax depth cue (desktop only).
  const chipX = useTransform(progress, [0, 1], mode === "desktop" ? [12, -12] : [0, 0]);
  // Glow follows the phone at 55% of its travel so the light stays attached
  // while the phone separates from it slightly — reads as depth, not lag.
  const glowY = useTransform(y, (value) => value * 0.55);

  return (
    <motion.div
      className="relative flex justify-center"
      style={{ perspective: PERSPECTIVE, opacity: travelOpacity }}
    >
      {/* Glow behind phone — screen-facing, follows 55% of the travel */}
      <motion.div
        aria-hidden="true"
        style={{ y: glowY }}
        className="absolute left-1/2 top-1/2 -z-10 h-[115%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[3rem] bg-gradient-to-br from-brand-200/70 via-brand-100/50 to-transparent blur-xl dark:from-brand-800/40 dark:via-brand-900/30 dark:to-transparent"
      />

      {/* Scroll rig — the only element that moves with scroll.
          NEVER put opacity on this element: < 1 would flatten preserve-3d. */}
      <motion.div
        className="relative"
        style={{
          x,
          y,
          rotateX,
          rotateY,
          rotateZ,
          scale,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {/* Stage — in-flow size still set by the face (zero layout shift) */}
        <div
          role="img"
          aria-label={PHONE_LABEL}
          className="relative"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Back casing — reveals itself around the edges while rotating */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[2.7rem] bg-[linear-gradient(180deg,#14352b,#081712)] ring-1 ring-black/50"
            style={{ transform: "translateZ(-28px)" }}
          />

          {/* Mid frame — the metal rail between back casing and face */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[2.7rem] bg-[#0d2b22] ring-1 ring-white/10"
            style={{ transform: "translateZ(-14px)" }}
          />

          {/* Side buttons — protrude from the mid frame */}
          <div
            aria-hidden="true"
            className="absolute -right-[3px] top-28 h-14 w-[4px] rounded-r-full bg-[linear-gradient(180deg,#2a4a3e,#0d241d)]"
            style={{ transform: "translateZ(-14px)" }}
          />
          <div
            aria-hidden="true"
            className="absolute -left-[3px] top-24 h-9 w-[4px] rounded-l-full bg-[linear-gradient(180deg,#2a4a3e,#0d241d)]"
            style={{ transform: "translateZ(-14px)" }}
          />
          <div
            aria-hidden="true"
            className="absolute -left-[3px] top-[8.75rem] h-9 w-[4px] rounded-l-full bg-[linear-gradient(180deg,#2a4a3e,#0d241d)]"
            style={{ transform: "translateZ(-14px)" }}
          />

          {/* Face — the existing flat mockup, pixel-identical to before */}
          <PhoneMockup variant="light" />

          {/* Fixed-direction edge light — rim highlights sell the shell depth */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[2.7rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-2px_3px_rgba(0,0,0,0.5),inset_1px_0_1px_rgba(255,255,255,0.08),inset_-2px_0_3px_rgba(0,0,0,0.35)]"
            style={{ transform: "translateZ(2px)" }}
          />

          {/* Glass sheen — sits above the face, parallax-slides on rotation */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[10px] rounded-[2.15rem] bg-[linear-gradient(115deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_18%,transparent_34%)]"
            style={{ transform: "translateZ(10px)" }}
          />
        </div>
      </motion.div>

      {/* Floating income chip — dissolves first, lifts away on scroll */}
      <motion.div style={{ x: chipX, y: chipY, opacity: chipOpacity }} className="absolute -right-3 top-16 hidden sm:block lg:-right-8">
        <div className="animate-float rounded-2xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:shadow-black/40">
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Salary received
          </p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            +$2,500.00
          </p>
        </div>
      </motion.div>

      {/* Floating budget chip — dissolves first, lifts away on scroll */}
      <motion.div
        style={{ x: chipX, y: chipY, opacity: chipOpacity }}
        className="absolute -left-4 bottom-24 hidden sm:block lg:-left-10"
      >
        <div className="animate-float-delayed w-44 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:shadow-black/40">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span>Food &amp; Dining</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">68%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-brand-500 to-brand-700" />
          </div>
          <p className="mt-1.5 text-[9px] text-slate-400 dark:text-slate-500">
            Monthly budget on track
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
