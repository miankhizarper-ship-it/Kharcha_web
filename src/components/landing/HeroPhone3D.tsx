"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { PhoneMockup } from "@/components/landing/PhoneMockup";

/**
 * HeroPhone3D — the hero phone rebuilt as a layered CSS-3D object that reacts
 * to page scroll.
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
 *   +10px   glass sheen (diagonal glare that parallax-slides against the face)
 *
 * ── Scroll logic ──
 * Progress is measured against the HERO SECTION only (sectionRef passed from
 * <Hero />), 0 → 1 as the hero travels from the top of the viewport out of
 * view. framer-motion MotionValues drive translateX (-40px → +40px), rotateY
 * (-8deg → +8deg) and a slight exit scale-down — written straight to the DOM
 * inside framer's rAF loop (no React re-render per frame, no jank).
 *
 * ── Fallbacks ──
 * - < lg (stacked hero layout): scroll effect disabled, static 3D pose only.
 * - prefers-reduced-motion: fully upright, zero scroll-driven motion.
 * - The rig only ever animates transform → no layout, no CLS; the stage's
 *   in-flow footprint is exactly the old mockup's.
 */

const PHONE_LABEL =
  "Preview of the Kharcha app home screen: total balance with income and expenses, a weekly spending chart, recent transactions, and a bottom navigation bar.";

/** Scroll drift amplitude, in px (phone sweeps -X ↔ +X across the hero). */
const DRIFT_X = 40;
/** Yaw sweep in degrees across the hero scroll range. */
const DRIFT_YAW = 8;
/** Scene perspective — larger = flatter; 1200px reads as "device on a desk". */
const PERSPECTIVE = "1200px";

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
   * against the hero section's own journey through the viewport — not the
   * whole page — so the drift completes exactly as the hero scrolls away.
   */
  sectionRef: React.RefObject<HTMLElement | null>;
};

export function HeroPhone3D({ sectionRef }: HeroPhone3DProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useIsDesktop();

  // Scroll-driven rig only on desktop pointers-wide layouts with motion allowed.
  const driven = isDesktop && !prefersReducedMotion;

  // 0 → 1 as the hero section scrolls from the top of the viewport out of view.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Ranges collapse to constants when the effect is disabled, so the same
  // MotionValues stay SSR-safe and hydration-stable on every breakpoint.
  const x = useTransform(scrollYProgress, [0, 1], driven ? [-DRIFT_X, DRIFT_X] : [0, 0]);
  const rotateY = useTransform(
    scrollYProgress,
    [0, 1],
    driven
      ? [-DRIFT_YAW, DRIFT_YAW]
      : prefersReducedMotion
        ? [0, 0] // reduced motion: upright, no pose at all
        : [-5, -5] // small screens: static 3D pose, depth without motion
  );
  const scale = useTransform(scrollYProgress, [0, 1], driven ? [1, 0.96] : [1, 1]);
  // Floating chips counter-drift at ~30% amplitude → parallax depth cue.
  const chipX = useTransform(scrollYProgress, [0, 1], driven ? [12, -12] : [0, 0]);

  return (
    <div className="relative flex justify-center" style={{ perspective: PERSPECTIVE }}>
      {/* Glow behind phone — screen-facing, outside the rotating rig */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-[115%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[3rem] bg-gradient-to-br from-brand-200/70 via-brand-100/50 to-transparent blur-xl dark:from-brand-800/40 dark:via-brand-900/30 dark:to-transparent"
      />

      {/* Scroll rig — the only element that moves with scroll */}
      <motion.div
        className="relative"
        style={{
          x,
          rotateY,
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

      {/* Floating income chip — floats independently, counter-drifts on scroll */}
      <motion.div
        style={{ x: chipX }}
        className="absolute -right-3 top-16 hidden sm:block lg:-right-8"
      >
        <div className="animate-float rounded-2xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:shadow-black/40">
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Salary received
          </p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            +$2,500.00
          </p>
        </div>
      </motion.div>

      {/* Floating budget chip — floats independently, counter-drifts on scroll */}
      <motion.div
        style={{ x: chipX }}
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
    </div>
  );
}
