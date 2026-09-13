import {
  ArrowLeftRight,
  Briefcase,
  Bus,
  Coffee,
  Home,
  LayoutGrid,
  PieChart,
  Plus,
  ShoppingCart,
  Signal,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PhoneMockup — a hand-built, CSS-only recreation of the Kharcha home
 * dashboard (light & dark themes), used in the Hero and AppPreview sections.
 *
 * ┌ NOTE ─────────────────────────────────────────────────────────────────
 * │ This is a presentational placeholder that mirrors the REAL app UI.
 * │ To swap in actual device screenshots later, replace the usage sites
 * │ (<Hero /> and <AppPreview />) with an <img src="/assets/your-shot.png" />
 * │ — no other section needs to change.
 * └───────────────────────────────────────────────────────────────────────
 */

type Transaction = {
  icon: React.ElementType;
  title: string;
  category: string;
  date: string;
  amount: string;
  income: boolean;
};

const TRANSACTIONS: Transaction[] = [
  {
    icon: ShoppingCart,
    title: "Grocery run",
    category: "Groceries",
    date: "Sep 11",
    amount: "-$54.20",
    income: false,
  },
  {
    icon: Briefcase,
    title: "Salary",
    category: "Income",
    date: "Sep 10",
    amount: "+$2,500.00",
    income: true,
  },
  {
    icon: Bus,
    title: "Bus fare",
    category: "Transport",
    date: "Sep 10",
    amount: "-$12.00",
    income: false,
  },
  {
    icon: Coffee,
    title: "Coffee",
    category: "Food & Dining",
    date: "Sep 9",
    amount: "-$4.50",
    income: false,
  },
];

/** Weekly spending bars — relative heights, highest day highlighted. */
const WEEK_BARS = [42, 66, 34, 78, 58, 96, 48];
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type PhoneMockupProps = {
  variant?: "light" | "dark";
  className?: string;
};

export function PhoneMockup({ variant = "light", className }: PhoneMockupProps) {
  const dark = variant === "dark";

  return (
    <div
      role="img"
      aria-label="Preview of the Kharcha app home screen: total balance with income and expenses, a weekly spending chart, recent transactions, and a bottom navigation bar."
      className={cn(
        // Fluid safety: fixed design width on every real viewport, but
        // max-w-full lets it compress instead of overflowing sub-264px
        // windows or zoomed-out layouts.
        "relative w-[264px] max-w-full shrink-0 select-none rounded-[2.7rem] p-[10px] shadow-2xl sm:w-[292px]",
        dark ? "bg-brand-950 ring-1 ring-white/15" : "bg-brand-950 ring-1 ring-black/25",
        className
      )}
    >
      {/* Screen */}
      <div
        aria-hidden="true"
        className={cn(
          "relative overflow-hidden rounded-[2.15rem] pb-16",
          dark ? "bg-ink text-slate-100" : "bg-[#F6F7F9] text-slate-900"
        )}
      >
        {/* Punch-hole camera */}
        <div
          className={cn(
            "absolute left-1/2 top-2 z-10 h-[14px] w-[14px] -translate-x-1/2 rounded-full",
            dark ? "bg-black ring-1 ring-white/10" : "bg-brand-950"
          )}
        />

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pb-1 pt-2.5">
          <span className="text-[10px] font-semibold">9:41</span>
          <span className="flex items-center gap-1 opacity-70">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
          </span>
        </div>

        {/* Greeting row */}
        <div className="flex items-center justify-between px-5 pb-3 pt-2">
          <div>
            <p className={cn("text-[10px]", dark ? "text-slate-400" : "text-slate-500")}>
              Good morning
            </p>
            <p className="text-[13px] font-semibold tracking-tight">Kharcha</p>
          </div>
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold",
              dark ? "bg-brand-700 text-white" : "bg-brand-700 text-white"
            )}
          >
            K
          </div>
        </div>

        {/* Balance card */}
        <div className="mx-4 rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-4 text-white shadow-lg shadow-brand-900/30">
          <p className="text-[10px] text-brand-100/80">Total Balance</p>
          <p className="mt-0.5 text-[22px] font-bold tracking-tight">$4,820.50</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[9px] text-brand-100/75">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Income
              </p>
              <p className="mt-0.5 text-[11px] font-semibold">+$6,500.00</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[9px] text-brand-100/75">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                Expenses
              </p>
              <p className="mt-0.5 text-[11px] font-semibold">-$1,679.00</p>
            </div>
          </div>
        </div>

        {/* Weekly trend */}
        <div
          className={cn(
            "mx-4 mt-3 rounded-2xl border p-3.5",
            dark ? "border-white/10 bg-ink-soft" : "border-slate-200/80 bg-white"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold">Daily spending</p>
            <p className={cn("text-[9px]", dark ? "text-slate-400" : "text-slate-500")}>
              This week
            </p>
          </div>
          <div className="mt-3 flex h-[64px] items-end justify-between gap-1.5">
            {WEEK_BARS.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-1">
                {/* Pixel heights: percentage heights don't resolve inside
                    auto-height flex columns. */}
                <div
                  className={cn(
                    "w-full rounded-t-[3px]",
                    index === 5
                      ? "bg-gradient-to-t from-brand-600 to-brand-400"
                      : dark
                        ? "bg-white/15"
                        : "bg-brand-200"
                  )}
                  style={{ height: `${Math.round(height * 0.5)}px` }}
                />
                <span
                  className={cn(
                    "text-[7px] leading-none",
                    dark ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  {WEEK_DAYS[index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="mx-4 mt-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold">Recent transactions</p>
            <p className="text-[9px] font-medium text-brand-400">See all</p>
          </div>
          <div className="mt-2 space-y-1.5">
            {TRANSACTIONS.map((tx) => (
              <div
                key={tx.title}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-2.5 py-2",
                  dark ? "border-white/10 bg-ink-soft" : "border-slate-200/80 bg-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    tx.income
                      ? "bg-emerald-100 text-emerald-700"
                      : dark
                        ? "bg-white/10 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                  )}
                >
                  <tx.icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium leading-tight">
                    {tx.title}
                  </span>
                  <span
                    className={cn(
                      "block text-[9px] leading-tight",
                      dark ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    {tx.category} · {tx.date}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[11px] font-semibold tabular-nums",
                    tx.income ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  )}
                >
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tab bar with FAB */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center justify-around border-t px-4 pb-3 pt-2",
            dark ? "border-white/10 bg-ink/95" : "border-slate-200 bg-white/95"
          )}
        >
          <Home className="h-4 w-4 text-brand-600" />
          <ArrowLeftRight className={cn("h-4 w-4", dark ? "text-slate-500" : "text-slate-400")} />
          <span className="relative -mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-700/40 ring-4 ring-white/90 dark:ring-ink">
            <Plus className="h-5 w-5" />
          </span>
          <PieChart className={cn("h-4 w-4", dark ? "text-slate-500" : "text-slate-400")} />
          <LayoutGrid className={cn("h-4 w-4", dark ? "text-slate-500" : "text-slate-400")} />
        </div>
      </div>
    </div>
  );
}
