import { Check, X } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const YOU_GET = [
  "Record income in a couple of taps",
  "Record expenses with categories that make sense",
  "Review every transaction in one searchable list",
  "Stay aware of spending with clear reports",
];

const YOU_NEVER_GET = [
  "Ads or upsells",
  "Forced sign-up or personal data",
  "Cloud sync you did not ask for",
  "Feature overload and clutter",
];

export function WhyUse() {
  return (
    <section
      id="why-kharcha"
      aria-labelledby="why-heading"
      className="relative overflow-hidden bg-brand-50/60 dark:bg-brand-950/20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-800/10"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:gap-16">
        {/* Philosophy */}
        <div>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
              Why {`Kharcha`}
            </p>
            <h2
              id="why-heading"
              className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl"
            >
              Your money. Your records.
              <br />
              <span className="text-brand-700 dark:text-brand-300">Your control.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              <p>
                Most finance apps try to be everything at once — investment dashboards,
                social features, credit score pushes — until checking your own balance
                feels like work.
              </p>
              <p>
                {`Kharcha strips it back to what actually helps: record what you earn,
                record what you spend, and review it whenever you want. That's the whole
                product, and it's deliberately enough.`}
              </p>
              <p>
                Everything lives on your device, works without internet, and belongs to
                you alone.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Get / never-get card */}
        <Reveal delay={0.15}>
          <div className="rounded-3xl border border-brand-100 bg-ink p-7 shadow-[0_30px_60px_-30px_rgba(10,36,29,0.5)] sm:p-9">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
                What you get
              </h3>
              <ul className="mt-4 space-y-3">
                {YOU_GET.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600">
                      <Check className="h-3 w-3 text-white" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="my-6 h-px bg-white/10" aria-hidden="true" />

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                What you never get
              </h3>
              <ul className="mt-4 space-y-3">
                {YOU_NEVER_GET.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <X className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
