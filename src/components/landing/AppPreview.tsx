import { CalendarClock, FileDown, PiggyBank, Repeat } from "lucide-react";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { Reveal } from "@/components/landing/Reveal";

const CAPABILITIES = [
  {
    icon: PiggyBank,
    title: "Monthly budgets",
    description: "Set spending limits per category and see how you are doing.",
  },
  {
    icon: Repeat,
    title: "Recurring transactions",
    description: "Rent, salary, subscriptions — recorded automatically.",
  },
  {
    icon: FileDown,
    title: "Reports & PDF export",
    description: "Clean monthly reports you can read or share as a PDF.",
  },
  {
    icon: CalendarClock,
    title: "CSV import & export",
    description: "Bring your history in, take your data out — anytime.",
  },
];

export function AppPreview() {
  return (
    <section aria-labelledby="app-preview-heading" className="relative overflow-hidden bg-ink">
      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(138,185,165,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(138,185,165,0.07) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-700/20 blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">
            The app
          </p>
          <h2
            id="app-preview-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Your whole financial day, at a glance
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Balance, income, expenses, and recent activity on one calm home screen — in a
            light theme for daytime and a deep dark theme for late nights.
          </p>
        </Reveal>

      {/* Two phones — dark theme front, light behind. Stacked on phones,
          side-by-side from md (2×292px + gap fits 768px), overlapping
          from lg. */}
        <Reveal delay={0.15} y={40}>
          <div className="mt-10 flex flex-col items-center justify-center gap-10 sm:mt-14 md:flex-row md:gap-8 lg:gap-0">
            <PhoneMockup
              variant="light"
              className="lg:-rotate-[4deg] lg:translate-x-6 lg:scale-[0.94] lg:opacity-90"
            />
            <PhoneMockup
              variant="dark"
              className="lg:z-10 lg:-translate-x-6 lg:rotate-[3deg] lg:shadow-black/60"
            />
          </div>
        </Reveal>

        {/* Real capability strip */}
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((item, index) => (
            <Reveal key={item.title} delay={0.1 + index * 0.08}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-colors hover:border-brand-400/40 hover:bg-white/[0.07]">
                <item.icon className="h-5 w-5 text-brand-300" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
