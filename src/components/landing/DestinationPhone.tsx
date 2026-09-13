"use client";

import { useEffect, useRef } from "react";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { destinationPhoneRef } from "@/components/landing/phoneHandoff";

/**
 * The destination slot of the travelling-phone handoff inside "The app"
 * section. Renders the light dashboard phone exactly as the section always
 * did, wrapped in an UNTRANSFORMED element that HeroPhone3D can measure in
 * document coordinates (see phoneHandoff.ts).
 *
 * During the desktop scroll handoff, HeroPhone3D writes a transient inline
 * opacity to this wrapper while the travelling phone covers the slot — the
 * wrapper's layout box is never collapsed, so the section cannot jump.
 * Outside that window the wrapper's opacity is fully CSS-controlled.
 *
 * ⚠ KEEP-IN-SYNC: the lg pose classes below mirror DESTINATION_PHONE_POSE
 * (translateX 24px / scale 0.94 / rotateZ −4° / opacity 0.9).
 */
export function DestinationPhone() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    destinationPhoneRef.current = ref.current;
    return () => {
      if (destinationPhoneRef.current === ref.current) {
        destinationPhoneRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={ref} data-handoff-destination className="relative shrink-0">
      <PhoneMockup
        variant="light"
        className="lg:-rotate-[4deg] lg:translate-x-6 lg:scale-[0.94] lg:opacity-90"
      />
    </div>
  );
}
