import { Compass, MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center overflow-hidden">
      {/* Decorative blobs, matching the site's hero language */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-8%] h-[360px] w-[360px] rounded-full bg-gradient-to-br from-brand-100 via-brand-50 to-transparent opacity-80 blur-2xl dark:from-brand-900/50 dark:via-brand-950/40 dark:to-transparent" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-emerald-50 to-transparent opacity-70 blur-2xl dark:from-emerald-950/40 dark:to-transparent" />
      </div>

      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          This page wandered off the ledger.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          The address you followed doesn&apos;t exist — but just like a good expense
          record, everything else is exactly where you left it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-700 px-6 text-sm font-medium text-white shadow-lg shadow-brand-700/25 transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            <MoveLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </a>
          <a
            href="/#features"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-brand-700 dark:hover:text-brand-300"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Explore features
          </a>
        </div>
      </div>
    </div>
  );
}
