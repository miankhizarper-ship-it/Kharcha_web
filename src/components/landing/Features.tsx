import {
  ArrowLeftRight,
  Eye,
  Gauge,
  Moon,
  Receipt,
  TrendingDown,
} from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const FEATURES = [
  {
    icon: TrendingDown,
    title: "Track Expenses",
    description:
      "Record your daily expenses in seconds and keep everything neatly organized by category.",
  },
  {
    icon: ArrowLeftRight,
    title: "Track Income",
    description:
      "Keep every source of income in one simple place, so your full financial picture stays complete.",
  },
  {
    icon: Eye,
    title: "Understand Your Spending",
    description:
      "Reports and insights show where your money actually goes — better awareness, better decisions.",
  },
  {
    icon: Gauge,
    title: "Simple & Fast",
    description:
      "Adding a transaction takes just a few taps. Built for quick, everyday use without friction.",
  },
  {
    icon: Receipt,
    title: "Clean Interface",
    description:
      "A calm, uncluttered design that makes checking your finances easy instead of overwhelming.",
  },
  {
    icon: Moon,
    title: "Dark Theme",
    description:
      "A comfortable dark mode for checking your balances at night — easy on the eyes, easy to use.",
  },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
            Features
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          >
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {`Kharcha focuses on the essentials of personal finance — recording, organizing,
            and understanding — and does each one really well.`}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={0.06 * (index % 3)}>
              <article className="group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(10,36,29,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_40px_-20px_rgba(10,36,29,0.25)] sm:p-6 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-brand-800/70 dark:hover:bg-white/[0.06] dark:hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-700 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-800/50">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
