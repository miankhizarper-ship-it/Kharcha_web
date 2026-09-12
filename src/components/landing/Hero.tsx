import { CheckCircle2, ShieldCheck } from "lucide-react";
import { DownloadButton } from "@/components/landing/DownloadButton";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { Reveal } from "@/components/landing/Reveal";
import { APP_NAME } from "@/config/site";

const TRUST_POINTS = ["No account needed", "Works fully offline", "Free to use"];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Decorative background — brand-tinted blobs, never interactive */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full bg-gradient-to-br from-brand-100 via-brand-50 to-transparent opacity-80 blur-2xl" />
        <div className="absolute left-[-15%] top-1/3 h-[380px] w-[380px] rounded-full bg-gradient-to-tr from-emerald-50 to-transparent opacity-70 blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200/60 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-28 sm:px-6 sm:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-40">
        {/* Copy */}
        <div className="max-w-xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-medium text-brand-800">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              100% offline — your data stays on your phone
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.6rem]">
              Take Control of <span className="text-brand-700">Your Money.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
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
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-7 text-base font-medium text-slate-700 shadow-sm transition-all hover:border-brand-300 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600 sm:h-11"
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
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500"
                >
                  <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Phone visual */}
        <Reveal delay={0.2} y={36} className="relative mx-auto lg:mx-0 lg:justify-self-center">
          <div className="relative flex justify-center">
            {/* Glow behind phone */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -z-10 h-[115%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[3rem] bg-gradient-to-br from-brand-200/70 via-brand-100/50 to-transparent blur-xl"
            />

            <PhoneMockup variant="light" className="rotate-[1.5deg]" />

            {/* Floating income chip */}
            <div className="animate-float absolute -right-3 top-16 hidden rounded-2xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur sm:block lg:-right-8">
              <p className="text-[10px] font-medium text-slate-500">Salary received</p>
              <p className="text-sm font-semibold text-emerald-600">+$2,500.00</p>
            </div>

            {/* Floating budget chip */}
            <div className="animate-float-delayed absolute -left-4 bottom-24 hidden w-44 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur sm:block lg:-left-10">
              <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                <span>Food &amp; Dining</span>
                <span className="font-semibold text-slate-700">68%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-brand-500 to-brand-700" />
              </div>
              <p className="mt-1.5 text-[9px] text-slate-400">Monthly budget on track</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
