"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Site-wide color-theme provider (light / dark / system).
 *
 * - `attribute="class"` → next-themes toggles `.dark` on <html>, which the
 *   Tailwind `dark:` variant and the `.dark` token block in globals.css key off.
 * - A tiny blocking script is injected by next-themes before first paint, so
 *   the saved theme (or the OS preference for first-time visitors) is applied
 *   with no flash of the wrong theme.
 * - `<html suppressHydrationWarning>` (already set in layout.tsx) is required
 *   because next-themes mutates the html element on the client.
 */
export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    />
  );
}
