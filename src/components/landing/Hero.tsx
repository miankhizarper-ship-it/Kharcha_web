"use client";

import { useRef } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { DownloadButton } from "@/components/landing/DownloadButton";
import { HeroPhone3D } from "@/components/landing/HeroPhone3D";
import { Reveal } from "@/components/landing/Reveal";
import { APP_NAME } from "@/config/site";

const TRUST_POINTS = ["No account needed", "Works fully offline", "Free to use"];

export function Hero() {
  // The 3D phone measures scroll progress against THIS section (see HeroPhone3D).
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="top" ref={sectionRef} className="relative">
      {/* Decorative background — brand-tinted blobs, never interactive.
          Clipped in its own layer (NOT on the section) so the travelling
          phone can legally overflow the hero bounds toward the app section. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full bg-gradient-to-br from-brand-100 via-brand-50 to-transparent opacity-80 blur-2xl dark:from-brand-900/50 dark:via-brand-950/40 dark:to-transparent" />
        <div className="absolute left-[-15%] top-1/3 h-[380px] w-[380px] rounded-full bg-gradient-to-tr from-emerald-50 to-transparent opacity-70 blur-2xl dark:from-emerald-950/40 dark:to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200/60 to-transparent dark:via-brand-800/40" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-28 sm:px-6 sm:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-40">
        {/* Copy */}
        <div className="max-w-xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-medium text-brand-800 dark:border-brand-800/60 dark:bg-brand-900/40 dark:text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              100% offline — your data stays on your phone
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.6rem]">
              Take Control of <span className="text-brand-700 dark:text-brand-300">Your Money.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
              {APP_NAME} makes it effortless to record expenses and income, keep every
              transaction organized, and actually understand where your money goes —
              with none of the clutter of traditional finance apps.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <DownloadButton
                size="lg"
                className="h-12 bg-brand-700 px-7 text-base shadow-lg shadow-brand-700/25 hover:bg-brand-800 sm:h-11"
                label="Download App"
              />
              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-7 text-base font-medium text-slate-700 shadow-sm transition-all hover:border-brand-300 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600 sm:h-11 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-brand-700 dark:hover:bg-white/10 dark:hover:text-brand-300"
              >
                Explore Features
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Key guarantees">
              {TRUST_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400"
                >
                  <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Phone visual — layered 3D mockup that travels with scroll.
            z-20: during the scroll handoff the phone paints above the app
            section while docking into its destination slot. It is NEVER
            faded or hidden — it stays the one visible phone end-to-end.
            pointer-events-none: it is purely decorative, so it can never
            block clicks on sections it passes over. */}
        <Reveal
          delay={0.2}
          y={36}
          className="pointer-events-none relative z-20 mx-auto lg:mx-0 lg:justify-self-center"
        >
          <HeroPhone3D sectionRef={sectionRef} />
        </Reveal>
      </div>
    </section>
  );
}
