"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before starting the reveal. */
  delay?: number;
  /** Vertical offset (px) the element slides up from. */
  y?: number;
};

/**
 * Scroll-triggered reveal wrapper.
 * - Animates once, when the element enters the viewport.
 * - Fully disabled (content shown immediately) when the user
 *   prefers reduced motion.
 */
export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-72px" }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
