import type { Metadata } from "next";
import { DownloadButton } from "@/components/landing/DownloadButton";
import { DeveloperMiniCard } from "@/components/landing/ContactMethods";
import {
  ArticleH2,
  ArticleP,
  PageShell,
} from "@/components/landing/PageShell";
import { APP_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `${APP_NAME} is an offline-first expense tracker for Android — the story behind it, what it believes, and the developer who builds it.`,
};

const PRINCIPLES = [
  {
    title: "Private by architecture",
    body: "No account, no cloud, no analytics — not because privacy is a feature to advertise, but because a money diary is nobody else's business. Your data physically cannot leak to a server that does not exist.",
  },
  {
    title: "Calm over clever",
    body: "Every screen answers one question: does this help someone record or understand their money faster? If not, it does not ship. Fewer features, done properly, beat a dashboard nobody reads.",
  },
  {
    title: "Yours, fully",
    body: "CSV import and export mean your history is never hostage. Track for a year, export everything, leave — that is a healthy relationship between a person and their software.",
  },
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="Money tracking, without the noise"
      description={`${APP_NAME} is an offline-first expense tracker for Android. It exists for one reason: most finance apps got complicated, and recording what you earn and spend should not be.`}
      wide
    >
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        {/* Story */}
        <div>
          <ArticleH2>The story</ArticleH2>
          <ArticleP>
            {APP_NAME} started with a familiar frustration. The finance apps
            that dominate the stores want to connect your bank, sell you a
            subscription, nudge you toward investments, and cover their
            dashboards with upsells. Somewhere in all of that, the simple habit
            of writing down what you spend — the habit that actually changes
            behavior — got buried.
          </ArticleP>
          <ArticleP>
            Kharcha (&ldquo;خَرچ&rdquo; — expense) goes back to that habit. Open the app,
            tap the number, pick a category, done in seconds. Everything works
            without internet because recording an expense should not require a
            network round-trip, and reviewing your month should not be possible
            to break with a dead zone. The result is an app that opens fast,
            works anywhere, and never asks for your email address.
          </ArticleP>
          <ArticleP>
            It is deliberately small on purpose. Under the calm surface there is
            real depth — monthly budgets, recurring transactions, searchable
            history, reports, PDF and CSV export, and a comfortable dark theme —
            but none of it is allowed to get in the way of the two-second habit
            at the core.
          </ArticleP>

          <ArticleH2>What that means in practice</ArticleH2>
          <div className="mt-4 space-y-4">
            {PRINCIPLES.map((principle) => (
              <div
                key={principle.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  {principle.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {principle.body}
                </p>
              </div>
            ))}
          </div>

          <ArticleH2>Behind the app</ArticleH2>
          <ArticleP>
            Kharcha is designed, built, and maintained by a single developer —
            no investor roadmap, no growth team, no reason to ever turn you into
            a product. If you want to see what else I build, get in touch, or
            report a bug, the doors are open.
          </ArticleP>
          <DeveloperMiniCard className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between" />
        </div>

        {/* At-a-glance card */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-brand-100 bg-ink p-7 shadow-[0_30px_60px_-30px_rgba(10,36,29,0.5)] sm:p-8 dark:border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">
              {APP_NAME} at a glance
            </p>
            <ul className="mt-5 space-y-4 text-sm text-slate-200">
              {[
                "Offline-first — works with zero internet",
                "Expenses & income with clean categories",
                "Monthly budgets and recurring transactions",
                "Searchable, filterable transaction history",
                "Reports with PDF export",
                "CSV import & export — your data, portable",
                "Light & dark themes built in",
                "No account, no ads, no tracking",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-7 border-t border-white/10 pt-6">
              <DownloadButton
                size="lg"
                className="w-full bg-brand-600 text-white shadow-[0_10px_30px_-10px_rgba(30,93,75,0.7)] hover:bg-brand-500"
                label="Download the App"
              />
              <p className="mt-3 text-center text-xs font-medium tracking-wide text-slate-400">
                Free · Android APK · No account needed
              </p>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
