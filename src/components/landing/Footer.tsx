import { DownloadButton } from "@/components/landing/DownloadButton";
import { APP_NAME, APP_TAGLINE, DEVELOPER_NAME } from "@/config/site";

const EXPLORE_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#why-kharcha", label: `Why ${APP_NAME}` },
  { href: "/#download", label: "Download App" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#0a100e]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <a
              href="/#top"
              className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-brand-600"
              aria-label={`${APP_NAME} — back to top`}
            >
              <img
                src="/assets/app-icon-192.png"
                alt=""
                aria-hidden="true"
                className="h-9 w-9 rounded-xl shadow-sm ring-1 ring-black/5"
              />
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {APP_NAME}
              </span>
            </a>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {APP_TAGLINE}. A fast, offline-first expense tracker that keeps your data
              on your phone — where it belongs.
            </p>
          </div>

          {/* Explore */}
          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company + legal */}
          <div className="flex gap-12 sm:gap-16">
            <nav aria-label="Company">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Company
              </h2>
              <ul className="mt-4 space-y-2.5">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Legal">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Legal
              </h2>
              <ul className="mt-4 space-y-2.5">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* CTA */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Get the app
            </h2>
            <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Available as an Android APK — install it and start tracking right away.
            </p>
            <DownloadButton size="sm" className="mt-4" label="Download App" />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row dark:border-white/5">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Built for Android · Offline-first · Developed by {DEVELOPER_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
