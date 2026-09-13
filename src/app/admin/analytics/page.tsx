import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  Eye,
  LogOut,
  MonitorSmartphone,
  MousePointerClick,
  Percent,
  Users,
} from "lucide-react";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/analytics/auth";
import { isAnalyticsConfigured } from "@/lib/analytics/mongo";
import {
  DATE_RANGES,
  getDashboardData,
  parseDateRange,
  type Bucket,
  type DashboardData,
} from "@/lib/analytics/queries";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Max days rendered in the traffic chart (all-time can span years). */
const MAX_CHART_DAYS = 60;

export default async function AnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  // Private route: verify the signed session cookie before anything else.
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const range = parseDateRange(params.range);

  let data: DashboardData | null = null;
  let problem: string | null = null;
  if (!isAnalyticsConfigured()) {
    problem =
      "Analytics is not configured: set MONGODB_URI (and optionally MONGODB_DATABASE) in the environment or Cloudflare Worker settings, then redeploy.";
  } else {
    try {
      data = await getDashboardData(range);
    } catch {
      problem = "Analytics database is unreachable right now. The rest of the site is unaffected — check MONGODB_URI / Atlas network access.";
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-white">
              <BarChart3 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight text-foreground">Kharcha Analytics</p>
              <p className="text-[11px] leading-tight text-muted-foreground">Private · owner only</p>
            </div>
          </div>

          <nav aria-label="Date range" className="order-3 flex w-full gap-1 rounded-lg border border-border bg-muted/50 p-1 sm:order-2 sm:w-auto">
            {DATE_RANGES.map((r) => (
              <Link
                key={r.value}
                href={`/admin/analytics?range=${r.value}`}
                aria-current={range === r.value ? "page" : undefined}
                className={`flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition sm:flex-none ${
                  range === r.value
                    ? "bg-brand-700 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </Link>
            ))}
          </nav>

          <form action="/api/admin/logout" method="post" className="order-2 ml-auto sm:order-3">
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {problem ? (
          <p role="alert" className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            {problem}
          </p>
        ) : null}

        {data ? (
          <>
            {/* KPI cards */}
            <section aria-label="Overview" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
              <StatCard icon={Users} label="Total visitors" value={fmt(data.totalVisitors)} hint="sessions" />
              <StatCard icon={Users} label="Unique visitors" value={fmt(data.uniqueVisitors)} hint="distinct devices" />
              <StatCard icon={Eye} label="Page views" value={fmt(data.pageviews)} />
              <StatCard icon={MousePointerClick} label="Download clicks" value={fmt(data.downloadClicks)} accent />
              <StatCard icon={Percent} label="Conversion rate" value={`${data.conversionRate}%`} hint="clicks ÷ unique visitors" />
            </section>

            {/* Traffic over time */}
            <SectionCard title="Traffic over time" icon={Activity}>
              {data.daily.length === 0 ? (
                <Empty />
              ) : (
                <TrafficChart days={data.daily.slice(-MAX_CHART_DAYS)} />
              )}
            </SectionCard>

            {/* Breakdowns */}
            <section aria-label="Breakdowns" className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-3">
              <SectionCard title="Devices" icon={MonitorSmartphone}>
                <BarList items={data.devices} />
              </SectionCard>
              <SectionCard title="Browsers">
                <BarList items={data.browsers} />
              </SectionCard>
              <SectionCard title="Operating systems">
                <BarList items={data.operatingSystems} />
              </SectionCard>
              <SectionCard title="Referrers">
                <BarList items={data.referrers} />
              </SectionCard>
              <SectionCard title="Top pages" className="lg:col-span-2">
                <BarList items={data.topPaths} mono />
              </SectionCard>
            </section>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              All numbers are anonymous aggregates — no IPs, no accounts, no fingerprints are stored.
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
        accent ? "border-brand-600/30 bg-brand-700 text-white" : "border-border bg-card text-foreground"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${accent ? "text-brand-100" : "text-muted-foreground"}`} aria-hidden="true" />
        <p className={`text-[11px] font-medium uppercase tracking-wide ${accent ? "text-brand-100" : "text-muted-foreground"}`}>
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      {hint ? (
        <p className={`mt-0.5 text-[11px] ${accent ? "text-brand-200" : "text-muted-foreground"}`}>{hint}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {Icon ? <Icon className="size-4 text-brand-600 dark:text-brand-400" aria-hidden="true" /> : null}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="py-8 text-center text-sm text-muted-foreground">No data in this range yet.</p>;
}

function TrafficChart({ days }: { days: DashboardData["daily"] }) {
  const max = Math.max(...days.map((d) => Math.max(d.visitors, d.pageviews, d.downloads)), 1);
  const labelEvery = Math.max(1, Math.ceil(days.length / 7));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <Legend color="bg-brand-800" label="Visitors" />
        <Legend color="bg-brand-400" label="Page views" />
        <Legend color="bg-amber-400" label="Download clicks" />
      </div>
      <div className="flex h-44 items-end gap-[3px]" role="img" aria-label="Daily visitors, page views and download clicks">
        {days.map((d) => (
          <div key={d.day} className="flex h-full flex-1 items-end justify-center gap-[2px]" title={`${d.day} — ${d.visitors} visitors · ${d.pageviews} page views · ${d.downloads} download clicks`}>
            <Bar value={d.visitors} max={max} className="bg-brand-800" />
            <Bar value={d.pageviews} max={max} className="bg-brand-400" />
            <Bar value={d.downloads} max={max} className="bg-amber-400" />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{days[0]?.day}</span>
        {days.length > labelEvery + 2 ? <span>{days[Math.floor(days.length / 2)]?.day}</span> : null}
        <span>{days[days.length - 1]?.day}</span>
      </div>
    </div>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = Math.max(value > 0 ? 3 : 0, Math.round((value / max) * 100));
  return <div className={`w-1.5 rounded-t-sm ${className}`} style={{ height: `${pct}%` }} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function BarList({ items, mono }: { items: Bucket[]; mono?: boolean }) {
  if (items.length === 0) return <Empty />;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className={`truncate text-foreground ${mono ? "font-mono" : ""}`}>{item.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">{fmt(item.count)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
              style={{ width: `${Math.max(2, Math.round((item.count / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
