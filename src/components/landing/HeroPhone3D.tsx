"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import {
  DESTINATION_PHONE_POSE,
  destinationPhoneRef,
  getDocumentTopLeft,
} from "@/components/landing/phoneHandoff";

/**
 * HeroPhone3D — the hero phone rebuilt as a layered CSS-3D object that
 * TRAVELS with the scroll from the hero into the app-showcase section and
 * DOCKS into it — one continuous object for the whole journey.
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
 * ── The continuous journey (desktop, motion allowed) ────────────────────
 * ONE phone, ONE scrubbed transform, THREE phases — and the phone's opacity
 * is ALWAYS 1. There is no dissolve, no crossfade and no swap anywhere:
 *
 *   Phase 1 — Lift-off (progress ≈ 0 → 0.4):
 *     the phone leaves its hero slot with a gentle ease-in lift and begins
 *     a controlled three-axis product turn — rotateY swings from the idle
 *     −5° yaw through a noticeable-but-controlled bulge, rotateX tilts,
 *     rotateZ drifts. No 360° spins, ever.
 *
 *   Phase 2 — Travel (0.4 → 0.88):
 *     the page scrolls beneath the nearly viewport-anchored phone while it
 *     glides toward the app section's phone slot and settles into the
 *     DESTINATION pose (flat face, rotateZ −4°, scale 0.94) — exactly the
 *     pose of the light phone waiting in that slot.
 *
 *   Phase 3 — Dock & ownership transfer (0.88 → 1):
 *     the eased approach is flat here, so the traveller is within ~2px of
 *     the destination before the handoff window opens. The destination
 *     phone then fades out BENEATH the fully-covering, pixel-matched
 *     traveller (progress 0.92 → 0.98) — an invisible takeover: the same
 *     silhouette stays on screen, simply now owned by the traveller. The
 *     destination wrapper keeps its layout box (opacity only — never
 *     display:none), so the section cannot shift.
 *
 * At progress 1 the transform clamps: the traveller is glued to the slot in
 * document space and scrolls away with the section — the final state PERSISTS
 * (no onEnter/onLeave toggling anywhere; everything is a pure function of
 * scroll progress, so fast scrolls and reverse scrolling are exact).
 *
 * ── Measurement, not hardcoding ──
 * The destination slot is measured live (offsetParent walk — immune to
 * ancestor transforms such as entrance reveals) and re-measured on resize,
 * hero resize, destination resize, webfont swap and breakpoint changes.
 * The travel RANGE is derived from the same measurement: progress 1 lands
 * the destination slot centre at 55% of the viewport height — fully on
 * stage, so the docking is witnessed.
 *
 * ── Mobile (< lg) ──
 * A simplified, cheaper drift: short y-travel, ±few-degree tilts, no
 * handoff (the section below uses its own compact swipe carousel).
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
 * progress 1 places the DESTINATION slot centre at this fraction of the
 * viewport height — the traveller docks fully on stage.
 */
const SETTLE_VIEWPORT_FRACTION = 0.55;

/** Floor for the measured travel range (px of scroll). */
const MIN_RANGE = 320;

/**
 * Destination-cover window: the waiting destination phone fades out
 * beneath the docked, pixel-matched traveller. Opened late enough that the
 * traveller fully covers the slot; both are the identical <PhoneMockup>,
 * so the takeover is invisible in both directions.
 */
const COVER_START = 0.92;
const COVER_END = 0.98;

/** Cubic ease-in-out — its flat tail puts the traveller within ~2px of the
    destination slot by progress 0.9, before the cover window opens. */
const easeInOutCubic = (u: number) =>
  u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

type Stops = ReadonlyArray<readonly [number, number]>;

/** Piecewise-linear keyframe interpolation (framer array-form semantics). */
function pw(p: number, stops: Stops): number {
  if (p <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (p >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    const [p1, v1] = stops[i];
    if (p <= p1) {
      const [p0, v0] = stops[i - 1];
      return v0 + ((p - p0) / (p1 - p0)) * (v1 - v0);
    }
  }
  return last[1];
}

/** Desktop journey keyframes. Rotations settle into the destination pose
    (flat, −4°) by 0.88 — BEFORE the destination starts fading — so the
    cover window always happens with the traveller exactly on top. */
const DESKTOP = {
  scale: [
    [0, 1],
    [0.45, 0.96],
    [0.88, DESTINATION_PHONE_POSE.scale],
    [1, DESTINATION_PHONE_POSE.scale],
  ] as Stops,
  rotateX: [
    [0, 0],
    [0.45, 7],
    [0.88, 0],
    [1, 0],
  ] as Stops,
  rotateY: [
    [0, -5],
    [0.4, 10],
    [0.88, 0],
    [1, 0],
  ] as Stops,
  rotateZ: [
    [0, 0],
    [0.45, -1.5],
    [0.88, DESTINATION_PHONE_POSE.rotateZ],
    [1, DESTINATION_PHONE_POSE.rotateZ],
  ] as Stops,
};

/** Mobile drift — same gentle character as before, no handoff. */
const MOBILE = {
  y: [
    [0, 0],
    [0.55, 30],
    [1, 36],
  ] as Stops,
  scale: [
    [0, 1],
    [1, 0.97],
  ] as Stops,
  rotateX: [
    [0, 0],
    [1, 3],
  ] as Stops,
  rotateY: [
    [0, -5],
    [1, -2],
  ] as Stops,
  rotateZ: [
    [0, 0],
    [1, -1.5],
  ] as Stops,
};

/** Desktop glow fade-out during the settle (gone before the cover window). */
const DESKTOP_GLOW = {
  opacity: [
    [0, 1],
    [0.72, 1],
    [0.9, 0],
    [1, 0],
  ] as Stops,
};

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
   * Ref attached to the hero <section>. Used as the fallback travel range
   * (and re-measured via ResizeObserver) when the destination has not
   * mounted yet.
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

  // ── Refs read INSIDE the scrubbed transformers ──
  // framer's useTransform caches its transformer, so nothing that changes
  // (mode, measured geometry) may live in a closure. Everything below is
  // read live from refs — always current, zero re-renders.
  const modeRef = useRef(mode);

  const anchorRef = useRef<HTMLDivElement>(null);
  const travelRangeRef = useRef(600);
  const deltaRef = useRef({ x: -72, y: 320 });
  const coverAppliedRef = useRef(false);

  // Synced on commit (never during render) — and bumped together with the
  // epoch so scrubbed values re-evaluate AFTER the ref is current.
  const modeEpoch = useMotionValue(0);
  useEffect(() => {
    modeRef.current = mode;
    modeEpoch.set(modeEpoch.get() + 1);
  }, [mode, modeEpoch]);

  /* ── Measurement: travel range + destination delta ──────────────────── */
  useEffect(() => {
    let retryTimer: number | undefined;
    let destObserver: ResizeObserver | null = null;
    let tries = 0;

    const measure = () => {
      const hero = sectionRef.current;
      if (!hero) return;
      const vh = window.innerHeight;
      const anchor = anchorRef.current;

      // Fallbacks (destination not mounted yet): hero-derived values so the
      // rig still behaves sensibly for the first moments after hydration.
      let range = Math.max(240, Math.round(hero.offsetHeight - vh * 0.45));
      let delta = { x: -72, y: 320 };

      const dest = destinationPhoneRef.current;
      if (dest && anchor) {
        const a = getDocumentTopLeft(anchor);
        const d = getDocumentTopLeft(dest);
        const heroCx = a.x + anchor.offsetWidth / 2;
        const heroCy = a.y + anchor.offsetHeight / 2;
        // The destination phone carries its own lg translate-x-6 — its
        // VISUAL centre sits 24px right of the wrapper's layout centre.
        const destCx = d.x + dest.offsetWidth / 2 + DESTINATION_PHONE_POSE.translateX;
        const destCy = d.y + dest.offsetHeight / 2;
        delta = { x: Math.round(destCx - heroCx), y: Math.round(destCy - heroCy) };
        // progress 1 ⇒ destination centre at 55% of the viewport height.
        range = Math.max(MIN_RANGE, Math.round(destCy - vh * SETTLE_VIEWPORT_FRACTION));

        if (!destObserver) {
          destObserver = new ResizeObserver(measure);
          destObserver.observe(dest);
        }
      } else if (tries < 40) {
        // AppPreview mounts after the hero — retry until the slot exists.
        tries += 1;
        retryTimer = window.setTimeout(measure, 150);
      }

      travelRangeRef.current = range;
      deltaRef.current = delta;
    };

    measure();

    const ro = new ResizeObserver(measure);
    if (sectionRef.current) ro.observe(sectionRef.current);
    window.addEventListener("resize", measure);
    // Webfont swaps after hydration change the layout — re-measure.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      ro.disconnect();
      destObserver?.disconnect();
      window.removeEventListener("resize", measure);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [sectionRef, mode]);

  const { scrollY } = useScroll();

  // 0 → 1 across the measured range, clamped (scrubbed — fast-scroll safe).
  // modeEpoch is a second input purely so a breakpoint flip re-evaluates
  // the value even when scrollY has not moved.
  const progress = useTransform([scrollY, modeEpoch], (latest: number[]) => {
    const value = latest[0];
    const range = travelRangeRef.current;
    return Math.min(1, Math.max(0, value / (range > 0 ? range : 1)));
  });

  /* ── Scrubbed journey — every transformer reads refs (never stale) ──── */
  const x = useTransform([progress, modeEpoch], (latest: number[]) =>
    modeRef.current === "desktop"
      ? easeInOutCubic(latest[0]) * deltaRef.current.x
      : 0
  );
  const y = useTransform([progress, modeEpoch], (latest: number[]) => {
    const p = latest[0];
    if (modeRef.current === "desktop") return easeInOutCubic(p) * deltaRef.current.y;
    if (modeRef.current === "mobile") return pw(p, MOBILE.y);
    return 0;
  });
  const scale = useTransform([progress, modeEpoch], (latest: number[]) => {
    const p = latest[0];
    if (modeRef.current === "desktop") return pw(p, DESKTOP.scale);
    if (modeRef.current === "mobile") return pw(p, MOBILE.scale);
    return 1;
  });
  const rotateX = useTransform([progress, modeEpoch], (latest: number[]) => {
    const p = latest[0];
    if (modeRef.current === "desktop") return pw(p, DESKTOP.rotateX);
    if (modeRef.current === "mobile") return pw(p, MOBILE.rotateX);
    return 0;
  });
  const rotateY = useTransform([progress, modeEpoch], (latest: number[]) => {
    const p = latest[0];
    if (modeRef.current === "desktop") return pw(p, DESKTOP.rotateY);
    if (modeRef.current === "mobile") return pw(p, MOBILE.rotateY);
    return -5; // static pose — depth without motion
  });
  const rotateZ = useTransform([progress, modeEpoch], (latest: number[]) => {
    const p = latest[0];
    if (modeRef.current === "desktop") return pw(p, DESKTOP.rotateZ);
    if (modeRef.current === "mobile") return pw(p, MOBILE.rotateZ);
    return 0;
  });

  /* The travelling glow dissipates as the phone settles so the PARKED
     composition matches the app section's original design (no light wash
     over the neighbouring dark phone) — desktop only. */
  const glowOpacity = useTransform([progress, modeEpoch], (latest: number[]) => {
    const p = latest[0];
    if (modeRef.current === "desktop") return pw(p, DESKTOP_GLOW.opacity);
    return 1;
  });

  /* ── Destination cover: the waiting phone fades out beneath the docked,
         pixel-matched traveller (desktop only; outside the window the
         destination's opacity stays CSS-controlled) ────────────────────── */
  useMotionValueEvent(progress, "change", (p) => {
    if (modeRef.current !== "desktop") return;
    const el = destinationPhoneRef.current;
    if (!el) return;
    if (p < COVER_START) {
      if (coverAppliedRef.current) {
        el.style.opacity = "";
        coverAppliedRef.current = false;
      }
      return;
    }
    const u = Math.min(1, (p - COVER_START) / (COVER_END - COVER_START));
    // Fade the WRAPPER 1 → 0 (the phone inside keeps its own lg:opacity-90;
    // fading from 1 avoids a 10% dimming step when the window opens).
    el.style.opacity = (1 - u).toFixed(3);
    coverAppliedRef.current = true;
  });

  // Mode flips / unmount: hand the destination's opacity back to CSS.
  useEffect(() => {
    return () => {
      const el = destinationPhoneRef.current;
      if (el && coverAppliedRef.current) {
        el.style.opacity = "";
        coverAppliedRef.current = false;
      }
    };
  }, [mode]);

  /* ── Floating chips dissolve early (they never reach the app section) ── */
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

  return (
    <motion.div
      ref={anchorRef}
      data-handoff-traveller
      className="relative flex justify-center"
      style={{ perspective: PERSPECTIVE }}
    >
      {/* Glow behind phone — travels fully attached so the light stays with
          the device for the whole journey, then dissipates on docking. */}
      <motion.div
        aria-hidden="true"
        style={{ y, opacity: glowOpacity }}
        className="absolute left-1/2 top-1/2 -z-10 h-[115%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[3rem] bg-gradient-to-br from-brand-200/70 via-brand-100/50 to-transparent blur-xl dark:from-brand-800/40 dark:via-brand-900/30 dark:to-transparent"
      />

      {/* Scroll rig — the only element that moves with scroll.
          NEVER put opacity on this element: < 1 would flatten preserve-3d,
          and the traveller must stay fully visible for the whole journey. */}
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
          data-handoff-stage
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

          {/* Face — the existing flat mockup, pixel-identical to the
              destination phone waiting in the app section */}
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
