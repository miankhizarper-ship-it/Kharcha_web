"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides the marketing chrome (navbar / footer) on private admin routes so
 * the analytics dashboard gets a clean, app-like canvas — without moving
 * any page files into route groups.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
