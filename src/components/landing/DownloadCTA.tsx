import { DownloadButton } from "@/components/landing/DownloadButton";
import { Reveal } from "@/components/landing/Reveal";
import { APP_NAME } from "@/config/site";

export function DownloadCTA() {
  return (
    <section id="download" aria-labelledby="download-heading" className="pb-14 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-900 to-ink px-5 py-12 text-center shadow-[0_40px_80px_-40px_rgba(10,36,29,0.7)] sm:px-12 sm:py-16 lg:py-20">
            {/* Decorative glows + rings */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
              <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
            </div>

            <div className="relative mx-auto max-w-2xl">
              <h2
                id="download-heading"
                className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              >
                Start Tracking Your Money Today
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-100/85 sm:text-lg">
                Keep your income and expenses organized with a simple personal finance
                tracker that respects your privacy.
              </p>

              <div className="mt-8 flex justify-center sm:mt-9">
                <DownloadButton
                  size="lg"
                  variant="secondary"
                  className="h-12 w-full max-w-sm bg-white px-8 text-base font-semibold text-brand-900 shadow-xl shadow-black/20 hover:bg-brand-50 sm:w-auto"
                  label="Download Android App"
                />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-brand-200/70">
                Free · Android APK · No account required
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
