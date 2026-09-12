import { BarChart3, ListPlus, NotebookPen } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const STEPS = [
  {
    number: "01",
    icon: ListPlus,
    title: "Add",
    description:
      "Add your income or expense in seconds — pick a category, enter the amount, done.",
  },
  {
    number: "02",
    icon: NotebookPen,
    title: "Track",
    description:
      "Every record is kept organized in one place, searchable and filterable whenever you need it.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Understand",
    description:
      "Review reports and trends to finally see where your money goes — and where it could go better.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            How it works
          </p>
          <h2
            id="how-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
          >
            Three steps. That&apos;s the whole app.
          </h2>
        </Reveal>

        {/* Relative connector line drawn behind the cards on desktop */}
        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-brand-200 lg:block"
          />
          <ol className="relative grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.number}>
                <Reveal delay={0.12 * index} className="h-full">
                  <div className="group h-full rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-[0_1px_2px_rgba(10,36,29,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_40px_-20px_rgba(10,36,29,0.25)]">
                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                      <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <step.icon
                        className="relative h-8 w-8 text-brand-700 transition-colors duration-300 group-hover:text-white"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-brand-400">
                      {step.number}
                    </p>
                    <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
