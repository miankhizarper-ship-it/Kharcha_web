/**
 * Shared coordination point for the hero → app-section travelling phone.
 *
 * The hero phone (HeroPhone3D) physically travels down the page and docks
 * into the destination slot inside the AppPreview section ("The app") —
 * one continuous object, no fade, no swap. The two landing islands are
 * separate components (and the section between them is a server
 * component), so they coordinate through this tiny module:
 *
 *  - `destinationPhoneRef` — set by <DestinationPhone />, read by
 *    HeroPhone3D to measure the destination slot in document coordinates.
 *  - `DESTINATION_PHONE_POSE` — the resting pose of the destination phone
 *    at the `lg` breakpoint. HeroPhone3D settles to exactly this pose when
 *    docking, so the traveller pixel-matches the slot it takes over.
 *
 * ⚠ DEPLOY COUPLING: this file MUST ship in the same snapshot as its two
 * importers (HeroPhone3D.tsx, DestinationPhone.tsx). If it is missing, the
 * production build fails with "Module not found: Can't resolve
 * '@/components/landing/phoneHandoff'".
 *
 * ⚠ KEEP-IN-SYNC: the pose must mirror the Tailwind classes applied to the
 * destination PhoneMockup in DestinationPhone.tsx
 * (`lg:translate-x-6 lg:scale-[0.94] lg:-rotate-[4deg] lg:opacity-90`).
 */

export const DESTINATION_PHONE_POSE = {
  /** px — mirrors `lg:translate-x-6` */
  translateX: 24,
  /** mirrors `lg:scale-[0.94]` */
  scale: 0.94,
  /** degrees — mirrors `lg:-rotate-[4deg]` */
  rotateZ: -4,
  /** mirrors `lg:opacity-90` */
  opacity: 0.9,
} as const;

/** The destination slot element (the untransformed wrapper around the phone). */
export const destinationPhoneRef: { current: HTMLElement | null } = {
  current: null,
};

/**
 * Document-space top-left of an element, accumulated through the
 * offsetParent chain. Unlike getBoundingClientRect this is immune to CSS
 * transforms on ANY ancestor (entrance reveals, the scaled phone row, the
 * travelling rig itself) — exactly what a stable docking measurement needs.
 *
 * Any constant document offset (body margins) cancels out because callers
 * only consume deltas between two elements measured with this function.
 */
export function getDocumentTopLeft(el: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    x += node.offsetLeft;
    y += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (parent) {
      // offset* is measured to the offsetParent's padding edge — re-add
      // the parent's border so the walk stays exact through bordered boxes.
      x += parent.clientLeft;
      y += parent.clientTop;
    }
    node = parent;
  }
  return { x, y };
}
